import { beforeEach, describe, expect, it } from "vitest";
import { LAST_OWNER_MESSAGE } from "@/lib/organizations";
import { endLocalSession, startLocalSession } from "@/store/actions/auth";
import { createClient } from "@/store/actions/clients";
import {
  addOrganizationMember,
  createOrganization,
  leaveOrganization,
  removeOrganizationMember,
  setOrganizationMemberStatus,
  switchOrganization,
  updateOrganizationMemberRole,
} from "@/store/actions/organizations";
import { createProject } from "@/store/actions/projects";
import { createTask, moveTask } from "@/store/actions/tasks";
import { requestLeave } from "@/store/actions/time-off";
import { createInitialState } from "@/store/initial-state";
import {
  getCurrentRole,
  getMembership,
  getOrganizationProjects,
  getProjectStages,
  getUserWorkspaces,
  isCurrentUserAdmin,
  isCurrentUserOwner,
  resolveActiveOrganizationId,
  safePathForWorkspace,
  selectWorkspace,
} from "@/store/selectors";
import { getState, setState } from "@/store/store";
import type { Client, Organization, Project, Task } from "@/types";

/** Stand-ins for Better Auth users (the local store mirrors their ids). */
const ANNA = { id: "u_anna", name: "Anna Owner", email: "anna@example.com" };
const BEN = { id: "u_ben", name: "Ben Builder", email: "ben@example.com" };

const ws = () => selectWorkspace(getState());

const CLIENT = { contactPerson: "", email: "", phone: "", website: "", industry: "", address: "", status: "Active", color: "#5B5CF6", notes: "" } as const;

function project(name: string, clientId: string | null = null): Project {
  return createProject({ name, description: "", clientId, status: "Active", color: "#5B5CF6", startDate: "", dueDate: "", memberIds: [] }, "simple");
}

function ok<T>(result: { ok: true; value: T } | { ok: false; error: string }): T {
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

interface World {
  alpha: Organization;
  beta: Organization;
  alphaClient: Client;
  betaClient: Client;
  alphaProject: Project;
  betaProject: Project;
  alphaTask: Task;
  betaTask: Task;
}

/**
 * Ben owns "Beta Studio" and adds Anna as a Member. Anna owns "Alpha Agency".
 * Each workspace gets a client, a project and a task. Anna is signed in at the end,
 * with Alpha active.
 */
function buildWorld(): World {
  startLocalSession(ANNA);
  endLocalSession();

  startLocalSession(BEN);
  const beta = ok(createOrganization({ name: "Beta Studio" }));
  const betaClient = createClient({ ...CLIENT, name: "Beta Client" });
  const betaProject = project("Beta Project", betaClient.id);
  const betaTask = createTask({ projectId: betaProject.id, stageId: getProjectStages(ws(), betaProject.id)[0].id, title: "Beta task" });
  const invite = ok(addOrganizationMember({ name: ANNA.name, email: ANNA.email, role: "Member" }));
  ok(setOrganizationMemberStatus(invite.id, "Active"));
  endLocalSession();

  startLocalSession(ANNA);
  const alpha = ok(createOrganization({ name: "Alpha Agency" }));
  const alphaClient = createClient({ ...CLIENT, name: "Alpha Client" });
  const alphaProject = project("Alpha Project", alphaClient.id);
  const alphaTask = createTask({ projectId: alphaProject.id, stageId: getProjectStages(ws(), alphaProject.id)[0].id, title: "Alpha task" });

  return { alpha, beta, alphaClient, betaClient, alphaProject, betaProject, alphaTask, betaTask };
}

beforeEach(() => {
  window.localStorage.clear();
  setState(() => createInitialState());
});

describe("local session (mirror of the Better Auth session)", () => {
  it("uses the Better Auth user id and never duplicates the user", () => {
    const user = startLocalSession(ANNA);
    expect(user.id).toBe(ANNA.id);
    startLocalSession({ ...ANNA, name: "Anna Renamed" });
    expect(getState().users).toHaveLength(1);
    expect(getState().users[0].name).toBe("Anna Renamed");
    expect(getState().session?.userId).toBe(ANNA.id);
    endLocalSession();
    expect(getState().session).toBeNull();
  });

  it("starts a brand-new account with no workspace (onboarding)", () => {
    startLocalSession(ANNA);
    expect(resolveActiveOrganizationId(getState())).toBeNull();
    expect(ws().projects).toEqual([]);
  });

  it("refuses to change data while signed out", () => {
    expect(() => createOrganization({ name: "Nobody's" })).toThrow("Not signed in.");
  });
});

describe("memberships", () => {
  it("lets one user belong to several organizations, with a role in each", () => {
    buildWorld();
    const workspaces = getUserWorkspaces(getState(), ANNA.id);
    expect(workspaces.map((w) => [w.organization.name, w.membership.role])).toEqual([
      ["Beta Studio", "Member"],
      ["Alpha Agency", "Owner"],
    ]);
  });

  it("resolves roles per organization, not per user", () => {
    const { beta } = buildWorld();
    expect(getCurrentRole(getState())).toBe("Owner");
    expect(isCurrentUserOwner(getState())).toBe(true);
    ok(switchOrganization(beta.id));
    expect(getCurrentRole(getState())).toBe("Member");
    expect(isCurrentUserAdmin(getState())).toBe(false);
    expect(ws().currentUser.role).toBe("Member");
    // A Member can't remove Beta's owner.
    const ben = getMembership(getState(), beta.id, BEN.id)!;
    expect(removeOrganizationMember(ben.id).ok).toBe(false);
  });

  it("falls back to another organization when the stored one is no longer accessible", () => {
    const { beta } = buildWorld();
    setState((s) => ({ ...s, activeOrganizationId: "org_gone" }));
    expect(resolveActiveOrganizationId(getState())).toBe(beta.id);
  });
});

describe("switching and isolation", () => {
  it("scopes projects to the active organization", () => {
    const { alpha, beta, alphaProject, betaProject } = buildWorld();
    expect(ws().projects.map((p) => p.id)).toEqual([alphaProject.id]);
    ok(switchOrganization(beta.id));
    expect(ws().organization.name).toBe("Beta Studio");
    expect(ws().projects.map((p) => p.id)).toEqual([betaProject.id]);
    ok(switchOrganization(alpha.id));
    expect(ws().projects.map((p) => p.id)).toEqual([alphaProject.id]);
  });

  it("never shows Org A's clients in Org B", () => {
    const { beta, alphaClient } = buildWorld();
    expect(alphaClient.organizationId).not.toBe(beta.id);
    ok(switchOrganization(beta.id));
    expect(ws().clients.map((c) => c.id)).not.toContain(alphaClient.id);
    expect(ws().clients.every((c) => c.organizationId === beta.id)).toBe(true);
  });

  it("never shows Org A's tasks, stages or activity in Org B", () => {
    const { beta, alphaTask, betaProject } = buildWorld();
    ok(switchOrganization(beta.id));
    const b = ws();
    expect(b.tasks.map((t) => t.id)).not.toContain(alphaTask.id);
    expect(b.tasks.every((t) => t.projectId === betaProject.id)).toBe(true);
    expect(b.stages.every((s) => s.projectId === betaProject.id)).toBe(true);
    expect(b.activities.every((a) => a.organizationId === beta.id)).toBe(true);
    expect(b.users.map((u) => u.id).sort()).toEqual([ANNA.id, BEN.id]);
  });

  it("keeps time-off policies separate", () => {
    const { alpha, beta } = buildWorld();
    const alphaTypes = ws().leaveTypes;
    expect(alphaTypes.length).toBeGreaterThan(0);
    expect(alphaTypes.every((t) => t.organizationId === alpha.id)).toBe(true);
    const annual = alphaTypes.find((t) => t.name === "Annual leave")!;
    const request = ok(requestLeave({ typeId: annual.id, startDate: "2031-03-04", endDate: "2031-03-04", halfDay: false, reason: "" }));
    expect(request.organizationId).toBe(alpha.id);

    ok(switchOrganization(beta.id));
    expect(ws().leaveTypes.some((t) => t.id === annual.id)).toBe(false);
    expect(ws().leaveRequests.some((r) => r.id === request.id)).toBe(false);
  });

  it("rejects cross-workspace references", () => {
    const { alphaProject, betaClient, betaProject, alphaTask } = buildWorld();
    // Beta's client can't be attached to an Alpha project.
    expect(() => project("Bad", betaClient.id)).toThrow();
    // A task can't go into a stage of another workspace's project.
    const betaStage = getState().stages.find((s) => s.projectId === betaProject.id)!;
    expect(() => createTask({ projectId: alphaProject.id, stageId: betaStage.id, title: "Bad" })).toThrow();
    expect(moveTask(alphaTask.id, betaStage.id, 0).stageChanged).toBe(false);
    expect(getState().tasks.find((t) => t.id === alphaTask.id)?.projectId).toBe(alphaProject.id);
  });
});

describe("owner rule", () => {
  it("won't demote or let the final owner leave", () => {
    const { alpha } = buildWorld();
    const anna = getMembership(getState(), alpha.id, ANNA.id)!;
    expect(updateOrganizationMemberRole(anna.id, "Admin")).toEqual({ ok: false, error: LAST_OWNER_MESSAGE });
    expect(leaveOrganization(alpha.id).ok).toBe(false);

    // Once someone else is an active Owner, stepping down works.
    const ben = ok(addOrganizationMember({ name: BEN.name, email: BEN.email, role: "Admin" }));
    ok(setOrganizationMemberStatus(ben.id, "Active"));
    ok(updateOrganizationMemberRole(ben.id, "Owner"));
    expect(updateOrganizationMemberRole(anna.id, "Admin").ok).toBe(true);
  });
});

describe("creating a workspace", () => {
  it("makes the creator Owner, switches to it and starts empty", () => {
    const { alpha } = buildWorld();
    const created = ok(createOrganization({ name: "Personal Workspace" }));
    expect(created.slug).toBe("personal-workspace");
    expect(resolveActiveOrganizationId(getState())).toBe(created.id);
    expect(getCurrentRole(getState())).toBe("Owner");
    expect(ws().projects).toEqual([]);
    expect(ws().clients).toEqual([]);
    expect(ws().users.map((u) => u.id)).toEqual([ANNA.id]);
    expect(ws().leaveTypes.length).toBeGreaterThan(0);
    // Other workspaces are untouched.
    expect(getOrganizationProjects(getState(), alpha.id)).toHaveLength(1);
  });

  it("rejects duplicate slugs", () => {
    buildWorld();
    expect(createOrganization({ name: "Another", slug: "alpha-agency" })).toEqual({ ok: false, error: "That workspace URL is already taken." });
  });
});

describe("routing after a switch", () => {
  it("leaves a project or client that belongs to the previous workspace", () => {
    const { beta, alphaProject, alphaClient, betaProject } = buildWorld();
    ok(switchOrganization(beta.id));
    const state = getState();
    expect(safePathForWorkspace(state, `/projects/${alphaProject.id}/tasks`)).toBe("/projects");
    expect(safePathForWorkspace(state, `/clients/${alphaClient.id}`)).toBe("/clients");
    expect(safePathForWorkspace(state, `/projects/${betaProject.id}/overview`)).toBe(`/projects/${betaProject.id}/overview`);
    expect(safePathForWorkspace(state, "/team")).toBe("/team");
    // Unknown ids are left to the page's "not found" state.
    expect(safePathForWorkspace(state, "/projects/p_missing")).toBe("/projects/p_missing");
  });
});
