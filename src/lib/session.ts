import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./auth";

/**
 * The signed-in session for the current request (or `null`), deduplicated per
 * request. Use in Server Components, route handlers and services.
 * `session.session.activeOrganizationId` is the active workspace.
 */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** Like `getSession`, but throws when signed out — for code paths that require a user. */
export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  return session;
}
