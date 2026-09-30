import { DEMO_CREDENTIALS } from "@/constants";
import type { Activity, AppNotification, AppState, Client, Holiday, HolidayCalendar, LeaveRequest, LeaveType, Project, Settings } from "@/types";
import { seedActivities, seedNotifications } from "./activities";
import { seedClients } from "./clients";
import { seedAttachments, seedComments } from "./comments";
import { seedNorthwindData, seedNorthwindMembers, seedNorthwindOrganization, seedNorthwindUsers } from "./northwind";
import { DREAM_KASPER_ID, inOrganization } from "./organizations";
import { seedProjects, seedStages } from "./projects";
import { seedTasks } from "./tasks";
import { seedHolidayCalendars, seedHolidays, seedLeaveRequests, seedLeaveTypes } from "./time-off";
import { seedMembers, seedOrganization, seedUsers } from "./users";

export { CURRENT_USER_ID } from "./users";
export { DREAM_KASPER_ID, NORTHWIND_ID, membershipId } from "./organizations";

/**
 * Emails of the seeded demo people (plus the demo login). These may sign in to the
 * mock data with any password — unless a real account with that email exists.
 */
export function demoEmails(): string[] {
  return [DEMO_CREDENTIALS.email, ...[...seedUsers(), ...seedNorthwindUsers()].map((u) => u.email.toLowerCase())];
}

/** Bump when the persisted shape changes, and add a step to `src/store/migrations.ts`. */
export const STATE_VERSION = 4;

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

/** Dream Kasper's time-off data, reused when migrating version-1 saves that predate time off. */
export function seedDreamKasperTimeOff() {
  return {
    holidayCalendars: inOrganization<HolidayCalendar>(DREAM_KASPER_ID, seedHolidayCalendars()),
    holidays: inOrganization<Holiday>(DREAM_KASPER_ID, seedHolidays()),
    leaveTypes: inOrganization<LeaveType>(DREAM_KASPER_ID, seedLeaveTypes()),
    leaveRequests: inOrganization<LeaveRequest>(DREAM_KASPER_ID, seedLeaveRequests()),
  };
}

export function createSeedState(): AppState {
  const dk = seedDreamKasperTimeOff();
  const nw = seedNorthwindData();
  return {
    version: STATE_VERSION,
    session: null,
    activeOrganizationId: DREAM_KASPER_ID,
    organizations: [seedOrganization(), seedNorthwindOrganization()],
    organizationMembers: [...seedMembers(), ...seedNorthwindMembers()],
    users: [...seedUsers(), ...seedNorthwindUsers()],
    clients: [...inOrganization<Client>(DREAM_KASPER_ID, seedClients()), ...nw.clients],
    projects: [...inOrganization<Project>(DREAM_KASPER_ID, seedProjects()), ...nw.projects],
    stages: [...seedStages(), ...nw.stages],
    tasks: [...seedTasks(), ...nw.tasks],
    comments: seedComments(),
    attachments: seedAttachments(),
    activities: [...inOrganization<Activity>(DREAM_KASPER_ID, seedActivities()), ...nw.activities],
    notifications: [...inOrganization<AppNotification>(DREAM_KASPER_ID, seedNotifications()), ...nw.notifications],
    holidayCalendars: [...dk.holidayCalendars, ...nw.holidayCalendars],
    holidays: [...dk.holidays, ...nw.holidays],
    leaveTypes: [...dk.leaveTypes, ...nw.leaveTypes],
    leaveRequests: dk.leaveRequests,
    settings: defaultSettings(),
  };
}
