import type { AppState, Client, ID, Project, Stage, Task, User } from "@/types";

interface Indexes {
  users: Map<ID, User>;
  clients: Map<ID, Client>;
  projects: Map<ID, Project>;
  stages: Map<ID, Stage>;
  stagesByProject: Map<ID, Stage[]>;
  tasksByStage: Map<ID, Task[]>;
  tasksByProject: Map<ID, Task[]>;
  commentCount: Map<ID, number>;
  attachmentCount: Map<ID, number>;
}

const cache = new WeakMap<AppState, Indexes>();

function group<T>(items: T[], key: (item: T) => ID): Map<ID, T[]> {
  const map = new Map<ID, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

function count<T>(items: T[], key: (item: T) => ID | null): Map<ID, number> {
  const map = new Map<ID, number>();
  for (const item of items) {
    const k = key(item);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

/** Lookup tables derived from state, memoised per state snapshot. */
export function indexes(state: AppState): Indexes {
  const hit = cache.get(state);
  if (hit) return hit;
  const stagesByProject = group(state.stages, (s) => s.projectId);
  for (const list of stagesByProject.values()) list.sort((a, b) => a.order - b.order);
  const tasksByStage = group(state.tasks, (t) => t.stageId);
  for (const list of tasksByStage.values()) list.sort((a, b) => a.order - b.order);
  const built: Indexes = {
    users: new Map(state.users.map((u) => [u.id, u])),
    clients: new Map(state.clients.map((c) => [c.id, c])),
    projects: new Map(state.projects.map((p) => [p.id, p])),
    stages: new Map(state.stages.map((s) => [s.id, s])),
    stagesByProject,
    tasksByStage,
    tasksByProject: group(state.tasks, (t) => t.projectId),
    commentCount: count(state.comments, (c) => c.taskId),
    attachmentCount: count(state.attachments, (a) => a.taskId),
  };
  cache.set(state, built);
  return built;
}

export function getProjectStages(state: AppState, projectId: ID): Stage[] {
  return indexes(state).stagesByProject.get(projectId) ?? [];
}

export function getStageTasks(state: AppState, stageId: ID): Task[] {
  return indexes(state).tasksByStage.get(stageId) ?? [];
}

export function getProjectTasks(state: AppState, projectId: ID): Task[] {
  return indexes(state).tasksByProject.get(projectId) ?? [];
}

export function isTaskDone(state: AppState, task: Task): boolean {
  return indexes(state).stages.get(task.stageId)?.isCompleted ?? false;
}

export function taskKey(state: AppState, task: Task): string {
  const project = indexes(state).projects.get(task.projectId);
  return `${project?.key ?? "T"}-${task.number}`;
}

export function projectProgress(state: AppState, projectId: ID) {
  const tasks = getProjectTasks(state, projectId);
  const done = tasks.filter((t) => isTaskDone(state, t)).length;
  return {
    total: tasks.length,
    done,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}

export function getUsers(state: AppState, ids: ID[]): User[] {
  const map = indexes(state).users;
  return ids.map((id) => map.get(id)).filter((u): u is User => Boolean(u));
}

export function clientProjects(state: AppState, clientId: ID): Project[] {
  return state.projects.filter((p) => p.clientId === clientId);
}

/** Buckets a task into a generic phase so dashboards work across custom workflows. */
export type Phase = "To Do" | "In Progress" | "Review" | "Done";

export function taskPhase(state: AppState, task: Task): Phase {
  const stage = indexes(state).stages.get(task.stageId);
  if (!stage) return "To Do";
  if (stage.isCompleted) return "Done";
  if (/review|qa|test|approv/i.test(stage.name)) return "Review";
  if (stage.order === 0) return "To Do";
  return "In Progress";
}
