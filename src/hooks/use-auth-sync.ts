"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { endLocalSession, startLocalSession } from "@/store/actions/auth";
import { useHydrated, useRootState } from "@/store/hooks";

export type AuthStatus = "loading" | "signed-out" | "signed-in";

/**
 * The Better Auth session is the source of truth for who is signed in.
 * This hook keeps the local store's session in step with it:
 *
 * - real session, no/other local session → start the local session for that user
 * - no real session (signed out, expired) → end the local session
 *
 * Guards (dashboard shell, onboarding, auth pages) call this and route on the status.
 */
export function useAuthSync(): AuthStatus {
  const { data, isPending } = authClient.useSession();
  const hydrated = useHydrated();
  const localUserId = useRootState().session?.userId ?? null;
  const user = data?.user ?? null;

  useEffect(() => {
    if (!hydrated || isPending) return;
    if (user && localUserId !== user.id) startLocalSession(user);
    else if (!user && localUserId) endLocalSession();
  }, [hydrated, isPending, user, localUserId]);

  if (!hydrated || isPending) return "loading";
  if (!user) return "signed-out";
  // Signed in, but the local session catches up on the next render.
  return localUserId === user.id ? "signed-in" : "loading";
}
