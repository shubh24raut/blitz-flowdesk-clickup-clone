"use client";

import { useSyncExternalStore } from "react";
import { CURRENT_USER_ID } from "@/data";
import type { AppState, User } from "@/types";
import { getServerState, getState, subscribe } from "./store";

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getServerState);
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

export function useCurrentUser(): User {
  const state = useAppState();
  const id = state.session?.userId ?? CURRENT_USER_ID;
  return state.users.find((u) => u.id === id) ?? state.users[0];
}
