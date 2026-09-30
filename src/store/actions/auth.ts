import { CURRENT_USER_ID } from "@/store/seed";
import { DEMO_CREDENTIALS } from "@/constants";
import { uid } from "@/lib/utils";
import { resolveActiveOrganizationId } from "@/store/organization";
import { flushPersistence, getState, setState } from "@/store/store";
import type { User } from "@/types";
import { now } from "./internal";

const AVATAR_COLORS = ["#5B5CF6", "#0EA5E9", "#EC4899", "#22C55E", "#F59E0B", "#8B5CF6"];

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Authentication only establishes *who* the user is. Which workspaces they can
 * open comes from their organization memberships, resolved here for the new session.
 */
function startSession(userId: string) {
  setState((s) => {
    const next = { ...s, session: { userId, signedInAt: now() } };
    return { ...next, activeOrganizationId: resolveActiveOrganizationId(next, userId) };
  });
  flushPersistence();
}

/**
 * Fake sign-in. The demo account (or any existing user's email) signs in as
 * that user; any other valid email creates a new account with no workspace yet.
 */
export function signIn(email: string): User {
  const normalized = email.trim().toLowerCase();
  const state = getState();
  const existing =
    normalized === DEMO_CREDENTIALS.email
      ? state.users.find((u) => u.id === CURRENT_USER_ID)
      : state.users.find((u) => u.email.toLowerCase() === normalized);
  if (existing) {
    startSession(existing.id);
    return existing;
  }
  return signUp(nameFromEmail(normalized), normalized);
}

export function signUp(name: string, email: string): User {
  const state = getState();
  const user: User = {
    id: uid("u"),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    title: "Team member",
    color: AVATAR_COLORS[state.users.length % AVATAR_COLORS.length],
    createdAt: now(),
  };
  setState((s) => ({ ...s, users: [...s.users, user] }));
  startSession(user.id);
  return user;
}

export function signInWithGoogle(): User {
  return signIn(DEMO_CREDENTIALS.email);
}

export function signOut() {
  setState((s) => ({ ...s, session: null }));
  flushPersistence();
}
