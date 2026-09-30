import {
  canChangeRole,
  canDeleteOrganization,
  canEditOrganization,
  canLeave,
  canManageMember,
  hasAccess,
  membersOf,
  SLUG_PATTERN,
  slugify,
} from "@/lib/organizations";
import { uid } from "@/lib/utils";
import { getMembership, resolveActiveOrganizationId } from "@/store/organization";
import { flushPersistence, getState, setState } from "@/store/store";
import type { AppState, ID, LeaveType, MemberStatus, Organization, OrganizationMember, Role, User } from "@/types";
import { actorId, activeOrgId, now, replaceById, withActivity, type Result } from "./internal";

const AVATAR_COLORS = ["#5B5CF6", "#0EA5E9", "#EC4899", "#22C55E", "#F59E0B", "#8B5CF6", "#06B6D4", "#F97316"];

/* ------------------------------- Organizations ------------------------------- */

export interface OrganizationInput {
  name: string;
  slug?: string;
  website?: string;
  logoUrl?: string;
}

export function isSlugAvailable(state: AppState, slug: string, exceptOrganizationId?: ID): boolean {
  return !state.organizations.some((o) => o.slug === slug && o.id !== exceptOrganizationId);
}

function validateSlug(state: AppState, slug: string, exceptOrganizationId?: ID): string | null {
  if (!SLUG_PATTERN.test(slug)) return "Use lowercase letters, numbers and single hyphens.";
  if (!isSlugAvailable(state, slug, exceptOrganizationId)) return "That workspace URL is already taken.";
  return null;
}

/** Leave types every new workspace starts with, so Time Off works out of the box. */
function defaultLeaveTypes(organizationId: ID): LeaveType[] {
  return [
    { id: uid("lt"), organizationId, name: "Annual leave", color: "#5B5CF6", allowance: 20, paid: true, requiresApproval: true },
    { id: uid("lt"), organizationId, name: "Sick leave", color: "#F59E0B", allowance: 10, paid: true, requiresApproval: false },
    { id: uid("lt"), organizationId, name: "Unpaid leave", color: "#94A3B8", allowance: null, paid: false, requiresApproval: true },
  ];
}

/** Creates a workspace, makes the current user its Owner and switches to it. */
export function createOrganization(input: OrganizationInput): Result<Organization> {
  const state = getState();
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Workspace name is required." };
  const slug = (input.slug ?? "").trim() || slugify(name);
  const slugError = validateSlug(state, slug);
  if (slugError) return { ok: false, error: slugError };

  const timestamp = now();
  const organization: Organization = {
    id: uid("org"),
    name,
    slug,
    logoUrl: input.logoUrl || undefined,
    website: input.website?.trim() ?? "",
    plan: "Free",
    workingDays: [1, 2, 3, 4, 5],
    defaultHolidayCalendarId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const owner: OrganizationMember = {
    id: uid("om"),
    organizationId: organization.id,
    userId: actorId(state),
    role: "Owner",
    status: "Active",
    joinedAt: timestamp,
    holidayCalendarId: null,
  };
  setState((s) => ({
    ...s,
    organizations: [...s.organizations, organization],
    organizationMembers: [...s.organizationMembers, owner],
    leaveTypes: [...s.leaveTypes, ...defaultLeaveTypes(organization.id)],
    activeOrganizationId: organization.id,
  }));
  flushPersistence();
  return { ok: true, value: organization };
}

export type OrganizationPatch = Partial<Pick<Organization, "name" | "slug" | "website" | "logoUrl" | "workingDays" | "defaultHolidayCalendarId">>;

/** Owners and admins of that organization can edit it. */
export function updateOrganization(id: ID, patch: OrganizationPatch): Result<Organization> {
  const state = getState();
  const org = state.organizations.find((o) => o.id === id);
  if (!org) return { ok: false, error: "Workspace not found." };
  const check = canEditOrganization(getMembership(state, id));
  if (!check.ok) return { ok: false, error: check.reason };
  if (patch.name !== undefined && patch.name.trim().length < 2) return { ok: false, error: "Workspace name is required." };
  if (patch.slug !== undefined && patch.slug !== org.slug) {
    const slugError = validateSlug(state, patch.slug, id);
    if (slugError) return { ok: false, error: slugError };
  }
  const updated: Organization = {
    ...org,
    ...patch,
    name: patch.name?.trim() ?? org.name,
    logoUrl: "logoUrl" in patch ? patch.logoUrl || undefined : org.logoUrl,
    updatedAt: now(),
  };
  setState((s) => ({ ...s, organizations: replaceById(s.organizations, id, () => updated) }));
  return { ok: true, value: updated };
}

/** Changes the active organization. Every scoped selector follows immediately. */
export function switchOrganization(id: ID): Result<Organization> {
  const state = getState();
  const org = state.organizations.find((o) => o.id === id);
  const membership = getMembership(state, id);
  if (!org || !membership || !hasAccess(membership.status)) return { ok: false, error: "You don't have access to that workspace." };
  if (state.activeOrganizationId !== id) {
    setState((s) => ({ ...s, activeOrganizationId: id }));
    flushPersistence();
  }
  return { ok: true, value: org };
}

/** Persists the resolved organization when the stored one is stale (left, deleted, deactivated). */
export function syncActiveOrganization() {
  const state = getState();
  const resolved = resolveActiveOrganizationId(state);
  if (resolved !== state.activeOrganizationId) setState((s) => ({ ...s, activeOrganizationId: resolved }));
}

/** Removes the workspace and everything it owns. Owners only. */
export function deleteOrganization(id: ID): Result<Organization> {
  const state = getState();
  const org = state.organizations.find((o) => o.id === id);
  if (!org) return { ok: false, error: "Workspace not found." };
  const check = canDeleteOrganization(getMembership(state, id));
  if (!check.ok) return { ok: false, error: check.reason };

  const projectIds = new Set(state.projects.filter((p) => p.organizationId === id).map((p) => p.id));
  const keep = <T extends { organizationId: ID }>(items: T[]) => items.filter((x) => x.organizationId !== id);
  const keepByProject = <T extends { projectId: ID }>(items: T[]) => items.filter((x) => !projectIds.has(x.projectId));
  setState((s) => {
    const next: AppState = {
      ...s,
      organizations: s.organizations.filter((o) => o.id !== id),
      organizationMembers: keep(s.organizationMembers),
      clients: keep(s.clients),
      projects: keep(s.projects),
      stages: keepByProject(s.stages),
      tasks: keepByProject(s.tasks),
      comments: keepByProject(s.comments),
      attachments: keepByProject(s.attachments),
      activities: keep(s.activities),
      notifications: keep(s.notifications),
      holidayCalendars: keep(s.holidayCalendars),
      holidays: keep(s.holidays),
      leaveTypes: keep(s.leaveTypes),
      leaveRequests: keep(s.leaveRequests),
    };
    return { ...next, activeOrganizationId: resolveActiveOrganizationId(next) };
  });
  flushPersistence();
  return { ok: true, value: org };
}

/* --------------------------------- Members ---------------------------------- */

function findMembership(state: AppState, membershipId: ID) {
  const target = state.organizationMembers.find((m) => m.id === membershipId);
  if (!target) return null;
  const actor = getMembership(state, target.organizationId);
  const members = membersOf(state.organizationMembers, target.organizationId);
  return { target, actor, members };
}

/**
 * Invites someone to the active organization. An existing account (e.g. a member
 * of another workspace) is reused; otherwise a new account is created.
 */
export function addOrganizationMember(input: { name: string; email: string; role: Role; title?: string }): Result<OrganizationMember> {
  const state = getState();
  const organizationId = activeOrgId(state);
  const actor = getMembership(state, organizationId);
  if (!canEditOrganization(actor).ok) return { ok: false, error: "Only owners and admins can invite members." };
  if (input.role === "Owner" && actor?.role !== "Owner") return { ok: false, error: "Only owners can invite another Owner." };

  const email = input.email.trim().toLowerCase();
  const existing = state.users.find((u) => u.email.toLowerCase() === email);
  if (existing && getMembership(state, organizationId, existing.id)) {
    return { ok: false, error: "This person is already in the workspace." };
  }
  const user: User = existing ?? {
    id: uid("u"),
    name: input.name.trim(),
    email,
    title: input.title?.trim() || "Team member",
    color: AVATAR_COLORS[state.users.length % AVATAR_COLORS.length],
    createdAt: now(),
  };
  const member: OrganizationMember = {
    id: uid("om"),
    organizationId,
    userId: user.id,
    role: input.role,
    status: "Invited",
    joinedAt: now(),
    holidayCalendarId: null,
  };
  setState((s) =>
    withActivity(
      { ...s, users: existing ? s.users : [...s.users, user], organizationMembers: [...s.organizationMembers, member] },
      { action: "invited", target: user.name, organizationId },
    ),
  );
  return { ok: true, value: member };
}

export function updateOrganizationMemberRole(membershipId: ID, role: Role): Result<OrganizationMember> {
  const found = findMembership(getState(), membershipId);
  if (!found) return { ok: false, error: "Member not found." };
  const check = canChangeRole(found.actor, found.target, role, found.members);
  if (!check.ok) return { ok: false, error: check.reason };
  const updated = { ...found.target, role };
  setState((s) => ({ ...s, organizationMembers: replaceById(s.organizationMembers, membershipId, () => updated) }));
  return { ok: true, value: updated };
}

export function setOrganizationMemberStatus(membershipId: ID, status: MemberStatus): Result<OrganizationMember> {
  const found = findMembership(getState(), membershipId);
  if (!found) return { ok: false, error: "Member not found." };
  const check = canManageMember(found.actor, found.target, found.members);
  if (!check.ok) return { ok: false, error: check.reason };
  const updated = { ...found.target, status };
  setState((s) => ({ ...s, organizationMembers: replaceById(s.organizationMembers, membershipId, () => updated) }));
  return { ok: true, value: updated };
}

/** Drops a membership and the person's footprint in that organization only. Their account stays. */
function withoutMembership(state: AppState, member: OrganizationMember): AppState {
  const { organizationId, userId } = member;
  const projectIds = new Set(state.projects.filter((p) => p.organizationId === organizationId).map((p) => p.id));
  return {
    ...state,
    organizationMembers: state.organizationMembers.filter((m) => m.id !== member.id),
    projects: state.projects.map((p) =>
      p.organizationId === organizationId ? { ...p, memberIds: p.memberIds.filter((id) => id !== userId) } : p,
    ),
    tasks: state.tasks.map((t) =>
      projectIds.has(t.projectId)
        ? {
            ...t,
            assigneeIds: t.assigneeIds.filter((id) => id !== userId),
            checklist: t.checklist.map((c) => (c.assigneeId === userId ? { ...c, assigneeId: null } : c)),
          }
        : t,
    ),
    leaveRequests: state.leaveRequests.filter((r) => !(r.organizationId === organizationId && r.userId === userId)),
  };
}

export function removeOrganizationMember(membershipId: ID): Result<OrganizationMember> {
  const state = getState();
  const found = findMembership(state, membershipId);
  if (!found) return { ok: false, error: "Member not found." };
  const check = canManageMember(found.actor, found.target, found.members);
  if (!check.ok) return { ok: false, error: check.reason };
  const name = state.users.find((u) => u.id === found.target.userId)?.name ?? "a member";
  setState((s) =>
    withActivity(withoutMembership(s, found.target), { action: "removed", target: name, organizationId: found.target.organizationId }),
  );
  return { ok: true, value: found.target };
}

/** The current user leaves an organization; the last Owner can't. Switches away if it was active. */
export function leaveOrganization(organizationId: ID): Result<Organization> {
  const state = getState();
  const org = state.organizations.find((o) => o.id === organizationId);
  const me = getMembership(state, organizationId);
  if (!org || !me) return { ok: false, error: "You're not a member of that workspace." };
  const check = canLeave(me, membersOf(state.organizationMembers, organizationId));
  if (!check.ok) return { ok: false, error: check.reason };
  setState((s) => {
    const next = withActivity(withoutMembership(s, me), { action: "left the workspace", organizationId });
    return { ...next, activeOrganizationId: resolveActiveOrganizationId(next) };
  });
  flushPersistence();
  return { ok: true, value: org };
}
