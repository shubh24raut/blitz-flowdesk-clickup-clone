import { CURRENT_USER_ID } from "@/data";
import { uid } from "@/lib/utils";
import type { Activity, AppState, ID } from "@/types";

export function actorId(state: AppState): ID {
  return state.session?.userId ?? CURRENT_USER_ID;
}

export function now(): string {
  return new Date().toISOString();
}

type ActivityInput = Pick<Activity, "action"> &
  Partial<Pick<Activity, "target" | "from" | "to" | "projectId" | "taskId" | "clientId">>;

/** Prepends an activity entry (newest first) and caps the log size. */
export function withActivity(state: AppState, input: ActivityInput): AppState {
  const entry: Activity = {
    id: uid("ac"),
    actorId: actorId(state),
    projectId: null,
    taskId: null,
    clientId: null,
    createdAt: now(),
    ...input,
  };
  return { ...state, activities: [entry, ...state.activities].slice(0, 500) };
}

export function replaceById<T extends { id: ID }>(items: T[], id: ID, patch: (item: T) => T): T[] {
  return items.map((item) => (item.id === id ? patch(item) : item));
}
