import type { AppState, Settings } from "@/types";

/**
 * Bump when the persisted shape changes. Saved state from another version is
 * discarded (v5 dropped the demo data; everything now starts empty).
 */
export const STATE_VERSION = 5;

export function defaultSettings(): Settings {
  return {
    theme: "light",
    language: "English",
    notifications: {
      taskAssignments: true,
      comments: true,
      dueDateReminders: true,
      projectUpdates: true,
      emailDigest: false,
    },
  };
}

/** A blank local store: no users, no workspaces. Signing in and onboarding fill it. */
export function createInitialState(): AppState {
  return {
    version: STATE_VERSION,
    session: null,
    activeOrganizationId: null,
    organizations: [],
    organizationMembers: [],
    users: [],
    clients: [],
    projects: [],
    stages: [],
    tasks: [],
    comments: [],
    attachments: [],
    activities: [],
    notifications: [],
    holidayCalendars: [],
    holidays: [],
    leaveTypes: [],
    leaveRequests: [],
    settings: defaultSettings(),
  };
}
