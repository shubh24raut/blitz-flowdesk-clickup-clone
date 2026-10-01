import { uid } from "@/lib/utils";
import { currentUserId, resolveActiveOrganizationId, selectWorkspace } from "@/store/organization";
import { getState } from "@/store/store";
import type { Activity, AppState, ID, WorkspaceState } from "@/types";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** The signed-in user. Every mutation runs on behalf of someone, so there is no anonymous fallback. */
export function actorId(state: AppState): ID {
  const id = currentUserId(state);
  if (!id) throw new Error("Not signed in.");
  return id;
}

/** The active organization's id. Actions that create org-owned records require one. */
export function activeOrgId(state: AppState): ID {
  const id = resolveActiveOrganizationId(state);
  if (!id) throw new Error("No active workspace — create or join one first.");
  return id;
}

/** Current state scoped to the active organization, for lookups and validation inside actions. */
export function workspace(): WorkspaceState {
  return selectWorkspace(getState());
}

export function now(): string {
  return new Date().toISOString();
}

type ActivityInput = Pick<Activity, "action"> &
  Partial<Pick<Activity, "target" | "from" | "to" | "projectId" | "taskId" | "clientId" | "organizationId">>;

/** Prepends an activity entry (newest first) for the active organization and caps the log size. */
export function withActivity(state: AppState, input: ActivityInput): AppState {
  const organizationId = input.organizationId ?? resolveActiveOrganizationId(state);
  if (!organizationId) return state;
  const entry: Activity = {
    id: uid("ac"),
    actorId: actorId(state),
    projectId: null,
    taskId: null,
    clientId: null,
    createdAt: now(),
    ...input,
    organizationId,
  };
  return { ...state, activities: [entry, ...state.activities].slice(0, 500) };
}

export function replaceById<T extends { id: ID }>(items: T[], id: ID, patch: (item: T) => T): T[] {
  return items.map((item) => (item.id === id ? patch(item) : item));
}
