import { canEditOrganization, hasAccess, isAdminRole } from "@/lib/organizations";
import type {
  AppState,
  Client,
  ID,
  LeaveRequest,
  Member,
  Organization,
  OrganizationMember,
  Project,
  Role,
  Task,
  User,
  WorkspaceState,
} from "@/types";

/**
 * Organization scoping for the mock store. This is the only module that filters
 * records by `organizationId`; everything else reads a `WorkspaceState`.
 */

/** Signed-in user (the Better Auth user id, mirrored into the local store), or `null`. */
export function currentUserId(state: AppState): ID | null {
  return state.session?.userId ?? null;
}

/* -------------------------------- Memberships -------------------------------- */

export function getMembership(state: AppState, organizationId: ID | null, userId: ID | null = currentUserId(state)): OrganizationMember | null {
  if (!organizationId || !userId) return null;
  return state.organizationMembers.find((m) => m.organizationId === organizationId && m.userId === userId) ?? null;
}

/** Memberships that grant access (not deactivated), in the order the user joined them. */
export function getMembershipsForUser(state: AppState, userId: ID | null): OrganizationMember[] {
  if (!userId) return [];
  const orgIds = new Set(state.organizations.map((o) => o.id));
  return state.organizationMembers.filter((m) => m.userId === userId && hasAccess(m.status) && orgIds.has(m.organizationId));
}

export function getOrganizationsForUser(state: AppState, userId: ID | null = currentUserId(state)): Organization[] {
  const byId = new Map(state.organizations.map((o) => [o.id, o]));
  return getMembershipsForUser(state, userId).map((m) => byId.get(m.organizationId)!);
}

/** Organizations the user can open, each with their role there — what the switcher lists. */
export function getUserWorkspaces(state: AppState, userId: ID | null = currentUserId(state)): Array<{ organization: Organization; membership: OrganizationMember }> {
  const byId = new Map(state.organizations.map((o) => [o.id, o]));
  return getMembershipsForUser(state, userId).map((membership) => ({ organization: byId.get(membership.organizationId)!, membership }));
}

/**
 * The organization the UI should show: the stored choice when the user still
 * belongs to it, otherwise their first organization, otherwise `null` (onboarding).
 */
export function resolveActiveOrganizationId(state: AppState, userId: ID | null = currentUserId(state)): ID | null {
  const memberships = getMembershipsForUser(state, userId);
  const stored = memberships.find((m) => m.organizationId === state.activeOrganizationId);
  return stored?.organizationId ?? memberships[0]?.organizationId ?? null;
}

export function getActiveOrganization(state: AppState): Organization | null {
  const id = resolveActiveOrganizationId(state);
  return state.organizations.find((o) => o.id === id) ?? null;
}

export function getCurrentMembership(state: AppState): OrganizationMember | null {
  return getMembership(state, resolveActiveOrganizationId(state));
}

export function getCurrentRole(state: AppState): Role | null {
  return getCurrentMembership(state)?.role ?? null;
}

export function isCurrentUserOwner(state: AppState): boolean {
  return getCurrentRole(state) === "Owner";
}

/** Owner or Admin in the active organization. */
export function isCurrentUserAdmin(state: AppState): boolean {
  return isAdminRole(getCurrentRole(state));
}

export function canManageOrganization(state: AppState): boolean {
  return canEditOrganization(getCurrentMembership(state)).ok;
}

/* ------------------------------ Scoped collections ----------------------------- */

function toMember(user: User, membership: OrganizationMember): Member {
  return {
    ...user,
    membershipId: membership.id,
    organizationId: membership.organizationId,
    role: membership.role,
    status: membership.status,
    joinedAt: membership.joinedAt,
    holidayCalendarId: membership.holidayCalendarId,
  };
}

/** The membership half of a `Member`, for the role rules in `lib/organizations`. */
export function toMembership(member: Member): OrganizationMember {
  return {
    id: member.membershipId,
    organizationId: member.organizationId,
    userId: member.id,
    role: member.role,
    status: member.status,
    joinedAt: member.joinedAt,
    holidayCalendarId: member.holidayCalendarId,
  };
}

/**
 * Tiny memo keyed on the source array: scoped slices keep their identity while
 * neither the source nor the organization changes, so React memo deps stay stable.
 */
const sliceCache = new WeakMap<object, { deps: unknown[]; value: unknown }>();

function memo<T>(source: object, deps: unknown[], compute: () => T): T {
  const hit = sliceCache.get(source);
  if (hit && hit.deps.length === deps.length && hit.deps.every((d, i) => d === deps[i])) return hit.value as T;
  const value = compute();
  sliceCache.set(source, { deps, value });
  return value;
}

function byOrganization<T extends { organizationId: ID }>(items: T[], organizationId: ID | null): T[] {
  return memo(items, [organizationId], () => items.filter((item) => item.organizationId === organizationId));
}

export function getOrganizationMembers(state: AppState, organizationId: ID | null): Member[] {
  return memo(state.organizationMembers, [organizationId, state.users], () => {
    const users = new Map(state.users.map((u) => [u.id, u]));
    return state.organizationMembers.flatMap((m) => {
      const user = m.organizationId === organizationId ? users.get(m.userId) : undefined;
      return user ? [toMember(user, m)] : [];
    });
  });
}

export function getOrganizationClients(state: AppState, organizationId: ID | null): Client[] {
  return byOrganization(state.clients, organizationId);
}

export function getOrganizationProjects(state: AppState, organizationId: ID | null): Project[] {
  return byOrganization(state.projects, organizationId);
}

function projectIdSet(state: AppState, organizationId: ID | null): Set<ID> {
  const projects = getOrganizationProjects(state, organizationId);
  return memo(projects, [], () => new Set(projects.map((p) => p.id)));
}

/** Stages, tasks, comments and attachments belong to an organization through their project. */
function byProject<T extends { projectId: ID }>(state: AppState, items: T[], organizationId: ID | null): T[] {
  const ids = projectIdSet(state, organizationId);
  return memo(items, [ids], () => items.filter((item) => ids.has(item.projectId)));
}

export function getOrganizationTasks(state: AppState, organizationId: ID | null): Task[] {
  return byProject(state, state.tasks, organizationId);
}

export function getOrganizationLeaveRequests(state: AppState, organizationId: ID | null): LeaveRequest[] {
  return byOrganization(state.leaveRequests, organizationId);
}

/** Unread notifications per organization, for badges on the workspace switcher. */
export function unreadNotificationCounts(state: AppState): Map<ID, number> {
  return memo(state.notifications, [], () => {
    const counts = new Map<ID, number>();
    for (const n of state.notifications) if (!n.read) counts.set(n.organizationId, (counts.get(n.organizationId) ?? 0) + 1);
    return counts;
  });
}

/* --------------------------------- Workspace -------------------------------- */

/** Placeholder while the user belongs to no organization; the shell sends them to onboarding. */
const NO_ORGANIZATION: Organization = {
  id: "",
  name: "No workspace",
  slug: "",
  website: "",
  plan: "Free",
  workingDays: [1, 2, 3, 4, 5],
  defaultHolidayCalendarId: null,
  createdAt: "",
  updatedAt: "",
};

/** Stand-in while nobody is signed in (e.g. during server rendering); the shell shows a skeleton. */
const SIGNED_OUT_USER: User = { id: "", name: "", email: "", title: "", color: "#5B5CF6", createdAt: "" };

const workspaceCache = new WeakMap<AppState, WorkspaceState>();

/**
 * The state as seen from the active organization. Memoised per state snapshot,
 * so it is safe to use as a `useSyncExternalStore` snapshot.
 */
export function selectWorkspace(state: AppState): WorkspaceState {
  const hit = workspaceCache.get(state);
  if (hit) return hit;
  const orgId = resolveActiveOrganizationId(state);
  const organization = state.organizations.find((o) => o.id === orgId) ?? NO_ORGANIZATION;
  const users = getOrganizationMembers(state, orgId);
  const userId = currentUserId(state);
  const membership = getMembership(state, orgId, userId);
  const account = state.users.find((u) => u.id === userId) ?? SIGNED_OUT_USER;
  const workspace: WorkspaceState = {
    session: state.session,
    settings: state.settings,
    organization,
    membership,
    currentUser:
      users.find((u) => u.id === userId) ??
      toMember(account, {
        id: "",
        organizationId: organization.id,
        userId: account.id,
        role: "Member",
        status: "Active",
        joinedAt: account.createdAt,
        holidayCalendarId: null,
      }),
    users,
    clients: getOrganizationClients(state, orgId),
    projects: getOrganizationProjects(state, orgId),
    stages: byProject(state, state.stages, orgId),
    tasks: getOrganizationTasks(state, orgId),
    comments: byProject(state, state.comments, orgId),
    attachments: byProject(state, state.attachments, orgId),
    activities: byOrganization(state.activities, orgId),
    notifications: byOrganization(state.notifications, orgId),
    holidayCalendars: byOrganization(state.holidayCalendars, orgId),
    holidays: byOrganization(state.holidays, orgId),
    leaveTypes: byOrganization(state.leaveTypes, orgId),
    leaveRequests: getOrganizationLeaveRequests(state, orgId),
  };
  workspaceCache.set(state, workspace);
  return workspace;
}

/* ---------------------------------- Routing ---------------------------------- */

/**
 * Where to go when the active organization no longer owns the entity in the URL
 * (after a switch, or a link from another workspace). Entities that don't exist
 * at all are left to the page's own "not found" state.
 */
export function safePathForWorkspace(state: AppState, pathname: string): string {
  const orgId = resolveActiveOrganizationId(state);
  const project = pathname.match(/^\/projects\/([^/]+)/)?.[1];
  if (project) {
    const found = state.projects.find((p) => p.id === decodeURIComponent(project));
    if (found && found.organizationId !== orgId) return "/projects";
  }
  const client = pathname.match(/^\/clients\/([^/]+)/)?.[1];
  if (client) {
    const found = state.clients.find((c) => c.id === decodeURIComponent(client));
    if (found && found.organizationId !== orgId) return "/clients";
  }
  return pathname;
}
