import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { invitationEmail, resetPasswordEmail, verifyEmailEmail } from "./emails";
import { roleFromDb } from "./organizations";
import { queueEmail } from "./resend";

/**
 * Better Auth server instance.
 *
 * Authentication (who you are: users, sessions, accounts) is kept separate from
 * workspace access (organizations, members, invitations — the organization plugin).
 * Roles are per membership; `session.activeOrganizationId` is the active workspace.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

const AVATAR_COLORS = ["#5B5CF6", "#0EA5E9", "#EC4899", "#22C55E", "#F59E0B", "#8B5CF6", "#06B6D4", "#F97316"];

/** First workspace the user can use, so a new sign-in opens where they work (or `null` → onboarding). */
async function firstActiveOrganizationId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ organizationId: schema.members.organizationId })
    .from(schema.members)
    .where(and(eq(schema.members.userId, userId), eq(schema.members.status, "Active")))
    .orderBy(asc(schema.members.createdAt))
    .limit(1);
  return row?.organizationId ?? null;
}

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : undefined;

export const auth = betterAuth({
  appName: "FlowDesk",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : undefined,
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => queueEmail(resetPasswordEmail({ to: user.email, name: user.name, url })),
  },
  emailVerification: {
    // Sent on sign-up but not required to sign in (yet).
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => queueEmail(verifyEmailEmail({ to: user.email, name: user.name, url })),
  },
  socialProviders: google,
  user: {
    additionalFields: {
      title: { type: "string", required: false, defaultValue: "Team member" },
      // Assigned by the server, not settable from sign-up.
      color: {
        type: "string",
        required: false,
        input: false,
        defaultValue: () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => ({
          data: { ...session, activeOrganizationId: await firstActiveOrganizationId(session.userId) },
        }),
      },
    },
  },
  plugins: [
    organization({
      // Anyone can create a workspace and becomes its Owner (FlowDesk's "Create workspace").
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
      sendInvitationEmail: async ({ id, email, role, organization: org, inviter }) =>
        queueEmail(
          invitationEmail({
            to: email,
            inviterName: inviter.user.name,
            organizationName: org.name,
            role: roleFromDb(role),
            url: `${APP_URL}/accept-invitation/${id}`,
          }),
        ),
      schema: {
        organization: {
          additionalFields: {
            website: { type: "string", required: false, defaultValue: "" },
            plan: { type: "string", required: false, defaultValue: "Free", input: false },
            workingDays: { type: "number[]", required: false, defaultValue: [1, 2, 3, 4, 5] },
            defaultHolidayCalendarId: { type: "string", required: false },
          },
        },
        member: {
          additionalFields: {
            status: { type: "string", required: false, defaultValue: "Active" },
            holidayCalendarId: { type: "string", required: false },
          },
        },
      },
    }),
    // Must be last: lets server actions set auth cookies.
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
