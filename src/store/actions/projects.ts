import { uid } from "@/lib/utils";
import { getState, setState } from "@/store/store";
import type { ID, Project, Stage } from "@/types";
import { actorId, activeOrgId, now, replaceById, withActivity, workspace } from "./internal";

type TemplateStage = { name: string; color: string; isCompleted?: boolean };

export const STAGE_TEMPLATES: Record<string, { label: string; stages: TemplateStage[] }> = {
  agency: {
    label: "Agency delivery",
    stages: [
      { name: "Backlog", color: "#94A3B8" },
      { name: "Design", color: "#8B5CF6" },
      { name: "Development", color: "#3B82F6" },
      { name: "QA", color: "#F59E0B" },
      { name: "Client Review", color: "#EC4899" },
      { name: "Done", color: "#22C55E", isCompleted: true },
    ],
  },
  product: {
    label: "Product build",
    stages: [
      { name: "Ideas", color: "#94A3B8" },
      { name: "Planning", color: "#06B6D4" },
      { name: "Building", color: "#3B82F6" },
      { name: "Testing", color: "#F59E0B" },
      { name: "Approved", color: "#8B5CF6", isCompleted: true },
      { name: "Delivered", color: "#22C55E", isCompleted: true },
    ],
  },
  simple: {
    label: "Simple",
    stages: [
      { name: "To Do", color: "#94A3B8" },
      { name: "In Progress", color: "#5B5CF6" },
      { name: "Done", color: "#22C55E", isCompleted: true },
    ],
  },
};

export type StageTemplateId = keyof typeof STAGE_TEMPLATES;

export type ProjectInput = Pick<
  Project,
  "name" | "description" | "clientId" | "status" | "color" | "startDate" | "dueDate" | "memberIds"
>;

function deriveKey(name: string, taken: string[]): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("")
    .replace(/[^A-Z]/g, "");
  let key = (letters.length >= 2 ? letters : name.replace(/[^a-z]/gi, "").toUpperCase()).slice(0, 3) || "PR";
  let n = 2;
  while (taken.includes(key)) key = `${key.slice(0, 2)}${n++}`;
  return key;
}

/** A project may only reference a client of its own organization. */
function assertClientInWorkspace(clientId: ID | null | undefined) {
  if (clientId && !workspace().clients.some((c) => c.id === clientId)) {
    throw new Error("A project can only belong to a client in the same workspace.");
  }
}

export function createProject(input: ProjectInput, template: StageTemplateId = "agency"): Project {
  const state = getState();
  const ws = workspace();
  const me = actorId(state);
  assertClientInWorkspace(input.clientId);
  const memberIds = new Set(ws.users.map((u) => u.id));
  const members = input.memberIds.filter((id) => memberIds.has(id));
  const project: Project = {
    ...input,
    id: uid("p"),
    organizationId: activeOrgId(state),
    memberIds: members.includes(me) ? members : [me, ...members],
    starred: false,
    key: deriveKey(input.name, ws.projects.map((p) => p.key)),
    createdAt: now(),
  };
  const stages: Stage[] = STAGE_TEMPLATES[template].stages.map((s, order) => ({
    id: uid("s"),
    projectId: project.id,
    name: s.name,
    color: s.color,
    order,
    isCompleted: s.isCompleted ?? false,
  }));
  setState((s) =>
    withActivity(
      { ...s, projects: [project, ...s.projects], stages: [...s.stages, ...stages] },
      { action: "created the project", target: project.name, projectId: project.id, clientId: project.clientId },
    ),
  );
  return project;
}

export function updateProject(id: ID, patch: Partial<Omit<Project, "id" | "key" | "organizationId">>) {
  assertClientInWorkspace(patch.clientId);
  setState((s) => {
    const project = s.projects.find((p) => p.id === id);
    if (!project) return s;
    const next = { ...s, projects: replaceById(s.projects, id, (p) => ({ ...p, ...patch })) };
    if (patch.status && patch.status !== project.status) {
      return withActivity(next, {
        action: "changed the status of",
        target: project.name,
        from: project.status,
        to: patch.status,
        projectId: id,
      });
    }
    return withActivity(next, { action: "updated project details for", target: patch.name ?? project.name, projectId: id });
  });
}

export function toggleProjectStar(id: ID) {
  setState((s) => ({ ...s, projects: replaceById(s.projects, id, (p) => ({ ...p, starred: !p.starred })) }));
}

export function archiveProject(id: ID) {
  updateProject(id, { status: "Archived" });
}

/** Removes a project together with its stages, tasks, comments and files. */
export function deleteProject(id: ID) {
  setState((s) => ({
    ...s,
    projects: s.projects.filter((p) => p.id !== id),
    stages: s.stages.filter((x) => x.projectId !== id),
    tasks: s.tasks.filter((t) => t.projectId !== id),
    comments: s.comments.filter((c) => c.projectId !== id),
    attachments: s.attachments.filter((a) => a.projectId !== id),
    activities: s.activities.filter((a) => a.projectId !== id),
  }));
}

export function setProjectMembers(id: ID, memberIds: ID[]) {
  setState((s) => ({ ...s, projects: replaceById(s.projects, id, (p) => ({ ...p, memberIds })) }));
}
