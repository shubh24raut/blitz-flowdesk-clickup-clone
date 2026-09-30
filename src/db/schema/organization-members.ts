import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

/**
 * A user's membership in a workspace (organization plugin's `member` model).
 * Mirrors `OrganizationMember` in src/types. Roles are stored lowercase
 * (`owner` | `admin` | `member`, the plugin's convention); lib/organizations.ts maps them.
 * `status` and `holiday_calendar_id` are FlowDesk additions (member `additionalFields`).
 */
export const members = pgTable(
  "organization_members",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    /** `Active` | `Inactive`. Pending people are rows in `invitations`, not members. */
    status: text("status").notNull().default("Active"),
    holidayCalendarId: text("holiday_calendar_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("organization_members_org_user_idx").on(t.organizationId, t.userId), index("organization_members_user_idx").on(t.userId)],
);

/** Pending invitations to a workspace (organization plugin's `invitation` model). */
export const invitations = pgTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull().default("member"),
    /** `pending` | `accepted` | `rejected` | `canceled` */
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("invitations_org_idx").on(t.organizationId), index("invitations_email_idx").on(t.email)],
);
