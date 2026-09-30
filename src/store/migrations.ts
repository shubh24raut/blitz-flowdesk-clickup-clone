import { slugify } from "@/lib/organizations";
import { DREAM_KASPER_ID, membershipId, seedDreamKasperTimeOff, STATE_VERSION } from "@/store/seed";
import type {
  Activity,
  AppNotification,
  AppState,
  Client,
  Holiday,
  HolidayCalendar,
  ID,
  LeaveRequest,
  LeaveType,
  MemberStatus,
  OrganizationMember,
  Project,
  Role,
  User,
} from "@/types";

/**
 * Upgrades saved localStorage state step by step instead of discarding demo data.
 *
 * v1 → single organization, no time off
 * v2 → single organization (`state.organization`), roles on `User`
 * v3 → many organizations with memberships; org-owned records carry `organizationId`
 */

type Unscoped<T> = Omit<T, "organizationId">;

interface UserV2 extends Omit<User, "createdAt"> {
  role: Role;
  status: MemberStatus;
  joinedAt: string;
  holidayCalendarId?: ID | null;
}

interface OrganizationV2 {
  id: ID;
  name: string;
  website: string;
  plan: "Free" | "Pro" | "Business";
  workingDays: number[];
  defaultHolidayCalendarId: ID | null;
}

export interface StateV2 extends Pick<AppState, "session" | "stages" | "tasks" | "comments" | "attachments" | "settings"> {
  version: 2;
  organization: OrganizationV2;
  users: UserV2[];
  clients: Unscoped<Client>[];
  projects: Unscoped<Project>[];
  activities: Unscoped<Activity>[];
  notifications: Unscoped<AppNotification>[];
  holidayCalendars: Unscoped<HolidayCalendar>[];
  holidays: Unscoped<Holiday>[];
  leaveTypes: Unscoped<LeaveType>[];
  leaveRequests: Unscoped<LeaveRequest>[];
}

export interface StateV1 extends Omit<StateV2, "version" | "organization" | "holidayCalendars" | "holidays" | "leaveTypes" | "leaveRequests"> {
  version: 1;
  organization: Omit<OrganizationV2, "workingDays" | "defaultHolidayCalendarId">;
}

function scope<T>(organizationId: ID, items: Unscoped<T>[] | undefined): T[] {
  return (items ?? []).map((item) => ({ ...item, organizationId }) as T);
}

/** The single existing organization becomes the first workspace; every record is assigned to it. */
export function migrateV2ToV3(saved: StateV2): AppState {
  const orgId = saved.organization.id || DREAM_KASPER_ID;
  const now = new Date().toISOString();
  const earliest = saved.users.map((u) => u.joinedAt).sort()[0] ?? now;

  const organizationMembers: OrganizationMember[] = saved.users.map((u) => ({
    id: membershipId(orgId, u.id),
    organizationId: orgId,
    userId: u.id,
    role: u.role,
    status: u.status,
    joinedAt: u.joinedAt,
    holidayCalendarId: u.holidayCalendarId ?? null,
  }));
  const users: User[] = saved.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    title: u.title,
    color: u.color,
    ...(u.avatarUrl ? { avatarUrl: u.avatarUrl } : {}),
    createdAt: u.joinedAt,
  }));

  return {
    version: STATE_VERSION,
    session: saved.session,
    activeOrganizationId: orgId,
    organizations: [
      {
        ...saved.organization,
        id: orgId,
        slug: slugify(saved.organization.name) || "workspace",
        createdAt: earliest,
        updatedAt: now,
      },
    ],
    organizationMembers,
    users,
    clients: scope<Client>(orgId, saved.clients),
    projects: scope<Project>(orgId, saved.projects),
    stages: saved.stages,
    tasks: saved.tasks,
    comments: saved.comments,
    attachments: saved.attachments,
    activities: scope<Activity>(orgId, saved.activities),
    notifications: scope<AppNotification>(orgId, saved.notifications),
    holidayCalendars: scope<HolidayCalendar>(orgId, saved.holidayCalendars),
    holidays: scope<Holiday>(orgId, saved.holidays),
    leaveTypes: scope<LeaveType>(orgId, saved.leaveTypes),
    leaveRequests: scope<LeaveRequest>(orgId, saved.leaveRequests),
    settings: saved.settings,
  };
}

/** v2 added time off: keep everything and add the seed holidays, leave types and requests. */
function migrateV1ToV3(saved: StateV1): AppState {
  const seed = seedDreamKasperTimeOff();
  const migrated = migrateV2ToV3({
    ...saved,
    version: 2,
    organization: { ...saved.organization, workingDays: [1, 2, 3, 4, 5], defaultHolidayCalendarId: null },
    holidayCalendars: [],
    holidays: [],
    leaveTypes: [],
    leaveRequests: [],
  });
  const orgId = migrated.organizations[0].id;
  const retag = <T extends { organizationId: ID }>(items: T[]) => items.map((item) => ({ ...item, organizationId: orgId }));
  const userIds = new Set(migrated.users.map((u) => u.id));
  return {
    ...migrated,
    organizations: [{ ...migrated.organizations[0], defaultHolidayCalendarId: seed.holidayCalendars[0]?.id ?? null }],
    holidayCalendars: retag(seed.holidayCalendars),
    holidays: retag(seed.holidays),
    leaveTypes: retag(seed.leaveTypes),
    leaveRequests: retag(seed.leaveRequests.filter((r) => userIds.has(r.userId))),
  };
}

/** Returns the saved state in the current shape, or `null` when it can't be upgraded. */
export function migrateState(saved: { version?: unknown }): AppState | null {
  switch (saved.version) {
    case STATE_VERSION:
      return saved as AppState;
    case 2:
      return migrateV2ToV3(saved as StateV2);
    case 1:
      return migrateV1ToV3(saved as StateV1);
    default:
      return null;
  }
}
