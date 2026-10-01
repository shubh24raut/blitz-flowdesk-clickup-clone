import { resolveActiveOrganizationId } from "@/store/organization";
import { flushPersistence, getState, setState } from "@/store/store";
import type { User } from "@/types";
import { now } from "./internal";

/*
 * Authentication is handled by Better Auth (src/lib/auth.ts, src/lib/auth-client.ts).
 * These two functions only mirror the signed-in Better Auth user into the local
 * store, which still holds the app's data until each feature moves to the database.
 * `useAuthSync` (src/hooks/use-auth-sync.ts) calls them; nothing else should.
 */

/** The Better Auth user fields the local store needs. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  title?: string | null;
  color?: string | null;
}

/**
 * Starts the local session for a Better Auth user. The local user has the **same id**
 * as the Better Auth user, so data created while signed in belongs to that account.
 */
export function startLocalSession(account: AuthUser): User {
  const existing = getState().users.find((u) => u.id === account.id);
  const user: User = {
    id: account.id,
    name: account.name,
    email: account.email.toLowerCase(),
    title: existing?.title ?? account.title ?? "Team member",
    color: existing?.color ?? account.color ?? "#5B5CF6",
    avatarUrl: existing?.avatarUrl ?? account.image ?? undefined,
    createdAt: existing?.createdAt ?? now(),
  };
  setState((s) => {
    const users = existing ? s.users.map((u) => (u.id === user.id ? { ...u, name: user.name, email: user.email } : u)) : [...s.users, user];
    const next = { ...s, users, session: { userId: user.id, signedInAt: now() } };
    return { ...next, activeOrganizationId: resolveActiveOrganizationId(next, user.id) };
  });
  flushPersistence();
  return user;
}

/** Ends the local session (the Better Auth session is ended separately with `authClient.signOut()`). */
export function endLocalSession() {
  if (!getState().session) return;
  setState((s) => ({ ...s, session: null }));
  flushPersistence();
}
