"use client";

import { useSyncExternalStore } from "react";
import { getUserWorkspaces, selectWorkspace } from "@/store/organization";
import type { AppState, Member, WorkspaceState } from "@/types";
import { getServerState, getState, subscribe } from "./store";

/**
 * The raw, unscoped state — every organization. Only workspace-level UI
 * (switcher, onboarding, workspace management) should need this.
 */
export function useRootState(): AppState {
  return useSyncExternalStore(subscribe, getState, getServerState);
}

const getWorkspace = () => selectWorkspace(getState());
const getServerWorkspace = () => selectWorkspace(getServerState());

/** State scoped to the active organization. Screens read data through this. */
export function useWorkspace(): WorkspaceState {
  return useSyncExternalStore(subscribe, getWorkspace, getServerWorkspace);
}

const noopSubscribe = () => () => {};

/** `false` during SSR and hydration, `true` once running on the client. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** The signed-in user as a member of the active organization; `role` is their role there. */
export function useCurrentUser(): Member {
  return useWorkspace().currentUser;
}

/** Organizations the signed-in user belongs to, with their role in each. */
export function useUserWorkspaces() {
  const state = useRootState();
  return getUserWorkspaces(state);
}
