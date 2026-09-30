"use client";

import { inferAdditionalFields, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

/**
 * Better Auth client for client components: sign-in/up/out, the session hook and
 * the organization endpoints (create, switch active workspace, members, invitations).
 * Same-origin, so no `baseURL` is needed.
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), organizationClient()],
});

export const { signIn, signUp, signOut, useSession, useActiveOrganization, useListOrganizations } = authClient;
