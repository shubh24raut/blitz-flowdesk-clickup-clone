import { beforeEach, describe, expect, it } from "vitest";
import { LAST_OWNER_MESSAGE } from "@/lib/organizations";
import { signIn, signUp } from "@/store/actions/auth";
import { createClient } from "@/store/actions/clients";
import {
  createOrganization,
  leaveOrganization,
  removeOrganizationMember,
  switchOrganization,
  updateOrganizationMemberRole,
} from "@/store/actions/organizations";
import { createProject } from "@/store/actions/projects";
import { createTask, moveTask } from "@/store/actions/tasks";
import { requestLeave } from "@/store/actions/time-off";
import { migrateState, type StateV2 } from "@/store/migrations";
import { createSeedState, DREAM_KASPER_ID, membershipId, NORTHWIND_ID } from "@/store/seed";
import {
  getCurrentRole,
  getOrganizationProjects,
  getUserWorkspaces,
  isCurrentUserAdmin,
  isCurrentUserOwner,
  resolveActiveOrganizationId,
  safePathForWorkspace,
  selectWorkspace,
} from "@/store/selectors";
import { getState, setState } from "@/store/store";
import type { AppState } from "@/types";

const ws = () => selectWorkspace(getState());

beforeEach(() => {
  window.localStorage.clear();
  setState(() => createSeedState());
  signIn("demo@flowdesk.com"); // Shubham: Owner of Dream Kasper, Member of Northwind
});

describe("memberships", () => {
  it("lets one user belong to several organizations", () => {
    const workspaces = getUserWorkspaces(getState(), "u_shubham");
    expect(workspaces.map((w) => [w.organization.name, w.membership.role])).toEqual([
      ["Dream Kasper LLP", "Owner"],
      ["Northwind Studio", "Member"],
    ]);
  });

  it("resolves roles per organization, not per user", () => {
    expect(getCurrentRole(getState())).toBe("Owner");
    expect(isCurrentUserOwner(getState())).toBe(true);
    switchOrganization(NORTHWIND_ID);
    expect(getCurrentRole(getState())).toBe("Member");
    expect(isCurrentUserAdmin(getState())).toBe(false);
    expect(ws().currentUser.role).toBe("Member");
    // A Member can't manage the Northwind owner.
    const result = removeOrganizationMember(membershipId(NORTHWIND_ID, "u_chloe"));
    expect(result.ok).toBe(false);
  });

  it("falls back to another organization when the stored one is no longer accessible", () => {
    setState((s) => ({ ...s, activeOrganizationId: "org_gone" }));
    expect(resolveActiveOrganizationId(getState())).toBe(DREAM_KASPER_ID);
  });

  it("has no active organization for a brand-new account (onboarding)", () => {
    signUp("New Person", "new.person@example.com");
    expect(resolveActiveOrganizationId(getState())).toBeNull();
    expect(ws().projects).toEqual([]);
    expect(ws().clients).toEqual([]);
  });
});

describe("switching and isolation", () => {
  it("scopes projects to the active organization", () => {
    const dkProjects = ws().projects.map((p) => p.id);
    expect(dkProjects).toContain("p_web");
    expect(switchOrganization(NORTHWIND_ID).ok).toBe(true);
    expect(ws().organization.name).toBe("Northwind Studio");
    expect(ws().projects.map((p) => p.id)).toEqual(["p_nw_bloom"]);
    switchOrganization(DREAM_KASPER_ID);
    expect(ws().projects.map((p) => p.id)).toEqual(dkProjects);
  });

  it("never shows Org A's clients in Org B", () => {
    const client = createClient({
      name: "Only In Dream Kasper",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      industry: "",
      address: "",
      status: "Active",
      color: "#5B5CF6",
      notes: "",
    });
    expect(client.organizationId).toBe(DREAM_KASPER_ID);
    switchOrganization(NORTHWIND_ID);
    expect(ws().clients.map((c) => c.id)).not.toContain(client.id);
    expect(ws().clients.every((c) => c.organizationId === NORTHWIND_ID)).toBe(true);
  });

  it("never shows Org A's tasks, stages, comments or activity in Org B", () => {
    const dkTaskIds = new Set(ws().tasks.map((t) => t.id));
    switchOrganization(NORTHWIND_ID);
    const nw = ws();
    const nwProjectIds = new Set(nw.projects.map((p) => p.id));
    expect(nw.tasks.length).toBeGreaterThan(0);
    expect(nw.tasks.some((t) => dkTaskIds.has(t.id))).toBe(false);
    expect(nw.tasks.every((t) => nwProjectIds.has(t.projectId))).toBe(true);
    expect(nw.stages.every((s) => nwProjectIds.has(s.projectId))).toBe(true);
    expect(nw.comments.every((c) => nwProjectIds.has(c.projectId))).toBe(true);
    expect(nw.activities.every((a) => a.organizationId === NORTHWIND_ID)).toBe(true);
    expect(nw.notifications.every((n) => n.organizationId === NORTHWIND_ID)).toBe(true);
    expect(nw.users.map((u) => u.id).sort()).toEqual(["u_chloe", "u_shubham"]);
  });

  it("keeps time-off policies separate", () => {
    const dkTypes = ws().leaveTypes.map((t) => t.name);
    switchOrganization(NORTHWIND_ID);
    expect(ws().leaveTypes.map((t) => t.name)).toEqual(["Annual leave", "Sick leave"]);
    expect(ws().leaveTypes.map((t) => t.name)).not.toEqual(dkTypes);
    expect(ws().leaveRequests).toEqual([]);
    expect(ws().organization.defaultHolidayCalendarId).toBe("hc_nw_england");
    // A new request is filed in the active organization only.
    const result = requestLeave({ typeId: "lt_nw_annual", startDate: "2031-03-04", endDate: "2031-03-04", halfDay: false, reason: "" });
    expect(result.ok && result.value.organizationId).toBe(NORTHWIND_ID);
    switchOrganization(DREAM_KASPER_ID);
    expect(ws().leaveRequests.some((r) => result.ok && r.id === result.value.id)).toBe(false);
  });

  it("rejects cross-workspace references", () => {
    switchOrganization(NORTHWIND_ID);
    // Dream Kasper's client can't be attached to a Northwind project.
    expect(() =>
      createProject({ name: "Bad", description: "", clientId: "c_acme", status: "Active", color: "#000000", startDate: "", dueDate: "", memberIds: [] }),
    ).toThrow();
    // A task can't go into a stage from another workspace's project.
    expect(() => createTask({ projectId: "p_nw_bloom", stageId: "s_web_backlog", title: "Bad" })).toThrow();
    expect(moveTask("t_nw_1", "s_web_done", 0).stageChanged).toBe(false);
    expect(getState().tasks.find((t) => t.id === "t_nw_1")?.stageId).toBe("s_nw_todo");
  });
});

describe("owner rule", () => {
  it("won't demote, remove or let the final owner leave", () => {
    const shubham = membershipId(DREAM_KASPER_ID, "u_shubham");
    expect(updateOrganizationMemberRole(shubham, "Admin")).toEqual({ ok: false, error: LAST_OWNER_MESSAGE });
    expect(leaveOrganization(DREAM_KASPER_ID).ok).toBe(false);

    // Once someone else is an Owner, stepping down works.
    expect(updateOrganizationMemberRole(membershipId(DREAM_KASPER_ID, "u_rohan"), "Owner").ok).toBe(true);
    expect(updateOrganizationMemberRole(shubham, "Admin").ok).toBe(true);
  });
});

describe("creating a workspace", () => {
  it("makes the creator Owner, switches to it and starts empty", () => {
    const result = createOrganization({ name: "Personal Workspace" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.slug).toBe("personal-workspace");
    expect(resolveActiveOrganizationId(getState())).toBe(result.value.id);
    expect(getCurrentRole(getState())).toBe("Owner");
    const created = ws();
    expect(created.projects).toEqual([]);
    expect(created.clients).toEqual([]);
    expect(created.users.map((u) => u.id)).toEqual(["u_shubham"]);
    expect(created.leaveTypes.length).toBeGreaterThan(0);

    // Dream Kasper's data is untouched.
    expect(getOrganizationProjects(getState(), DREAM_KASPER_ID).length).toBe(5);
  });

  it("rejects duplicate slugs", () => {
    const result = createOrganization({ name: "Another", slug: "dream-kasper" });
    expect(result).toEqual({ ok: false, error: "That workspace URL is already taken." });
  });
});

describe("routing after a switch", () => {
  it("leaves a project or client that belongs to the previous workspace", () => {
    switchOrganization(NORTHWIND_ID);
    const state = getState();
    expect(safePathForWorkspace(state, "/projects/p_web/tasks")).toBe("/projects");
    expect(safePathForWorkspace(state, "/clients/c_acme")).toBe("/clients");
    expect(safePathForWorkspace(state, "/projects/p_nw_bloom/overview")).toBe("/projects/p_nw_bloom/overview");
    expect(safePathForWorkspace(state, "/team")).toBe("/team");
    // Unknown ids are left to the page's "not found" state.
    expect(safePathForWorkspace(state, "/projects/p_missing")).toBe("/projects/p_missing");
  });
});

/* -------------------------------- Migration -------------------------------- */

function omit<T extends object, K extends keyof T>(item: T, ...keys: K[]): Omit<T, K> {
  const copy = { ...item };
  for (const key of keys) delete copy[key];
  return copy;
}

/** Rebuilds what a version-2 save of the Dream Kasper demo looked like. */
function dreamKasperAsV2(state: AppState): StateV2 {
  const org = state.organizations.find((o) => o.id === DREAM_KASPER_ID)!;
  const projectIds = new Set(state.projects.filter((p) => p.organizationId === DREAM_KASPER_ID).map((p) => p.id));
  const strip = <T extends { organizationId: string }>(items: T[]) =>
    items.filter((x) => x.organizationId === DREAM_KASPER_ID).map((x) => omit(x, "organizationId"));
  const members = state.organizationMembers.filter((m) => m.organizationId === DREAM_KASPER_ID);
  return {
    version: 2,
    session: state.session,
    organization: {
      id: org.id,
      name: org.name,
      website: org.website,
      plan: org.plan,
      workingDays: org.workingDays,
      defaultHolidayCalendarId: org.defaultHolidayCalendarId,
    },
    users: members.map((m) => {
      const user = omit(state.users.find((u) => u.id === m.userId)!, "createdAt");
      return { ...user, role: m.role, status: m.status, joinedAt: m.joinedAt, holidayCalendarId: m.holidayCalendarId };
    }),
    clients: strip(state.clients),
    projects: strip(state.projects),
    stages: state.stages.filter((s) => projectIds.has(s.projectId)),
    tasks: state.tasks.filter((t) => projectIds.has(t.projectId)),
    comments: state.comments.filter((c) => projectIds.has(c.projectId)),
    attachments: state.attachments.filter((a) => projectIds.has(a.projectId)),
    activities: strip(state.activities),
    notifications: strip(state.notifications),
    holidayCalendars: strip(state.holidayCalendars),
    holidays: strip(state.holidays),
    leaveTypes: strip(state.leaveTypes),
    leaveRequests: strip(state.leaveRequests),
    settings: state.settings,
  };
}

describe("localStorage migration", () => {
  it("moves a single-organization save into Dream Kasper LLP without losing data", () => {
    const seed = getState();
    const v2 = dreamKasperAsV2(seed);
    const migrated = migrateState(JSON.parse(JSON.stringify(v2)))!;

    expect(migrated.version).toBe(3);
    expect(migrated.organizations).toHaveLength(1);
    expect(migrated.organizations[0]).toMatchObject({ id: DREAM_KASPER_ID, name: "Dream Kasper LLP", slug: "dream-kasper-llp" });
    expect(migrated.activeOrganizationId).toBe(DREAM_KASPER_ID);

    // Roles moved from users onto memberships.
    const shubham = migrated.organizationMembers.find((m) => m.userId === "u_shubham");
    expect(shubham).toMatchObject({ organizationId: DREAM_KASPER_ID, role: "Owner", status: "Active" });
    expect(migrated.users.find((u) => u.id === "u_shubham")).not.toHaveProperty("role");

    // Everything is still visible, exactly as before.
    const before = selectWorkspace(seed);
    const after = selectWorkspace(migrated);
    expect(after.organization.name).toBe("Dream Kasper LLP");
    for (const key of ["clients", "projects", "stages", "tasks", "comments", "activities", "notifications", "holidays", "leaveTypes", "leaveRequests"] as const) {
      expect(after[key].map((x) => x.id).sort(), key).toEqual(before[key].map((x) => x.id).sort());
    }
    expect(after.users.map((u) => [u.id, u.role, u.status]).sort()).toEqual(before.users.map((u) => [u.id, u.role, u.status]).sort());
  });

  it("upgrades version-1 saves (before time off) too", () => {
    const v2 = dreamKasperAsV2(getState());
    const rest = omit(v2, "holidayCalendars", "holidays", "leaveTypes", "leaveRequests");
    const v1 = { ...rest, version: 1, organization: { id: v2.organization.id, name: v2.organization.name, website: "", plan: "Pro" } };
    const migrated = migrateState(v1)!;
    expect(migrated.version).toBe(3);
    expect(migrated.leaveTypes.length).toBeGreaterThan(0);
    expect(migrated.leaveTypes.every((t) => t.organizationId === DREAM_KASPER_ID)).toBe(true);
    expect(selectWorkspace(migrated).projects).toHaveLength(5);
  });

  it("discards unknown versions", () => {
    expect(migrateState({ version: 99 })).toBeNull();
  });
});
