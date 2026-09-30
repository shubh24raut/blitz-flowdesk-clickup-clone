import type { AppState } from "@/types";
import { seedActivities, seedNotifications } from "./activities";
import { seedClients } from "./clients";
import { seedAttachments, seedComments } from "./comments";
import { seedProjects, seedStages } from "./projects";
import { seedTasks } from "./tasks";
import { seedHolidayCalendars, seedHolidays, seedLeaveRequests, seedLeaveTypes } from "./time-off";
import { seedOrganization, seedUsers } from "./users";

export { CURRENT_USER_ID } from "./users";

/** Bump when the persisted shape changes so stale localStorage is discarded. */
export const STATE_VERSION = 2;

export function createSeedState(): AppState {
  return {
    version: STATE_VERSION,
    session: null,
    organization: seedOrganization(),
    users: seedUsers(),
    clients: seedClients(),
    projects: seedProjects(),
    stages: seedStages(),
    tasks: seedTasks(),
    comments: seedComments(),
    attachments: seedAttachments(),
    activities: seedActivities(),
    notifications: seedNotifications(),
    holidayCalendars: seedHolidayCalendars(),
    holidays: seedHolidays(),
    leaveTypes: seedLeaveTypes(),
    leaveRequests: seedLeaveRequests(),
    settings: {
      theme: "light",
      language: "English",
      notifications: {
        taskAssignments: true,
        comments: true,
        dueDateReminders: true,
        projectUpdates: true,
        emailDigest: false,
      },
    },
  };
}
