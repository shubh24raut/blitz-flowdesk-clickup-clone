import { formatLong } from "@/lib/dates";
import { clamp, uid } from "@/lib/utils";
import { getProjectStages, getStageTasks, indexes } from "@/store/selectors";
import { getState, setState } from "@/store/store";
import type { AppState, ChecklistItem, ID, Priority, Task } from "@/types";
import { actorId, now, replaceById, withActivity } from "./internal";

export interface TaskInput {
  projectId: ID;
  stageId: ID;
  title: string;
  description?: string;
  priority?: Priority;
  assigneeIds?: ID[];
  dueDate?: string | null;
  tags?: string[];
}

export function createTask(input: TaskInput): Task {
  const state = getState();
  const stage = indexes(state).stages.get(input.stageId);
  const projectTasks = state.tasks.filter((t) => t.projectId === input.projectId);
  const task: Task = {
    id: uid("t"),
    number: projectTasks.reduce((max, t) => Math.max(max, t.number), 99) + 1,
    projectId: input.projectId,
    stageId: input.stageId,
    order: getStageTasks(state, input.stageId).length,
    title: input.title.trim(),
    description: input.description ?? "",
    priority: input.priority ?? "Medium",
    assigneeIds: input.assigneeIds ?? [],
    dueDate: input.dueDate ?? null,
    tags: input.tags ?? [],
    checklist: [],
    createdById: actorId(state),
    createdAt: now(),
    updatedAt: now(),
    completedAt: stage?.isCompleted ? now() : null,
  };
  setState((s) =>
    withActivity(
      { ...s, tasks: [...s.tasks, task] },
      { action: "added a new task", target: task.title, projectId: task.projectId, taskId: task.id },
    ),
  );
  return task;
}

type TaskPatch = Partial<Pick<Task, "title" | "description" | "priority" | "assigneeIds" | "dueDate" | "tags">>;

function names(state: AppState, ids: ID[]): string {
  const users = indexes(state).users;
  return ids.map((id) => users.get(id)?.name ?? "Unknown").join(", ") || "Unassigned";
}

/** Updates task fields and records a human-readable activity per changed field. */
export function updateTask(id: ID, patch: TaskPatch) {
  setState((s) => {
    const task = s.tasks.find((t) => t.id === id);
    if (!task) return s;
    let next: AppState = { ...s, tasks: replaceById(s.tasks, id, (t) => ({ ...t, ...patch, updatedAt: now() })) };
    const ctx = { projectId: task.projectId, taskId: id, target: patch.title ?? task.title };
    if (patch.priority && patch.priority !== task.priority) {
      next = withActivity(next, { ...ctx, action: "changed the priority of", from: task.priority, to: patch.priority });
    }
    if (patch.assigneeIds && patch.assigneeIds.join() !== task.assigneeIds.join()) {
      next = withActivity(next, {
        ...ctx,
        action: "changed the assignees of",
        from: names(s, task.assigneeIds),
        to: names(s, patch.assigneeIds),
      });
    }
    if (patch.dueDate !== undefined && patch.dueDate !== task.dueDate) {
      next = withActivity(next, {
        ...ctx,
        action: "changed the due date of",
        from: formatLong(task.dueDate) || "None",
        to: formatLong(patch.dueDate) || "None",
      });
    }
    if (patch.title && patch.title !== task.title) {
      next = withActivity(next, { ...ctx, action: "renamed", from: task.title, to: patch.title });
    }
    if (patch.description !== undefined && patch.description !== task.description) {
      next = withActivity(next, { ...ctx, action: "updated the description of" });
    }
    return next;
  });
}

export function deleteTask(id: ID) {
  setState((s) => {
    const task = s.tasks.find((t) => t.id === id);
    if (!task) return s;
    const siblings = s.tasks
      .filter((t) => t.stageId === task.stageId && t.id !== id)
      .sort((a, b) => a.order - b.order);
    const order = new Map(siblings.map((t, i) => [t.id, i]));
    return withActivity(
      {
        ...s,
        tasks: s.tasks.filter((t) => t.id !== id).map((t) => (order.has(t.id) ? { ...t, order: order.get(t.id)! } : t)),
        comments: s.comments.filter((c) => c.taskId !== id),
        attachments: s.attachments.filter((a) => a.taskId !== id),
      },
      { action: "deleted task", target: task.title, projectId: task.projectId },
    );
  });
}

export function duplicateTask(id: ID): Task | null {
  const task = getState().tasks.find((t) => t.id === id);
  if (!task) return null;
  const copy = createTask({ ...task, title: `${task.title} (copy)` });
  setState((s) => ({
    ...s,
    tasks: replaceById(s.tasks, copy.id, (t) => ({
      ...t,
      checklist: task.checklist.map((c) => ({ ...c, id: uid("cl") })),
    })),
  }));
  return copy;
}

/**
 * Moves a task to `toStageId` at position `toIndex`, re-numbering the order of
 * both affected stages. Returns the destination stage name when the stage changed.
 */
export function moveTask(taskId: ID, toStageId: ID, toIndex: number): { stageChanged: boolean; stageName: string } {
  const state = getState();
  const task = state.tasks.find((t) => t.id === taskId);
  const target = indexes(state).stages.get(toStageId);
  if (!task || !target) return { stageChanged: false, stageName: "" };
  const fromStage = indexes(state).stages.get(task.stageId);
  const stageChanged = task.stageId !== toStageId;

  const source = getStageTasks(state, task.stageId).filter((t) => t.id !== taskId);
  const dest = stageChanged ? getStageTasks(state, toStageId).slice() : source.slice();
  dest.splice(clamp(toIndex, 0, dest.length), 0, task);

  const updates = new Map<ID, Partial<Task>>();
  if (stageChanged) source.forEach((t, i) => updates.set(t.id, { order: i }));
  dest.forEach((t, i) => updates.set(t.id, { order: i }));
  const timestamp = now();
  updates.set(taskId, {
    ...updates.get(taskId),
    stageId: toStageId,
    ...(stageChanged
      ? { updatedAt: timestamp, completedAt: target.isCompleted ? (task.completedAt ?? timestamp) : null }
      : {}),
  });

  setState((s) => {
    const next = {
      ...s,
      tasks: s.tasks.map((t) => (updates.has(t.id) ? { ...t, ...updates.get(t.id) } : t)),
    };
    return stageChanged
      ? withActivity(next, {
          action: "moved",
          target: task.title,
          from: fromStage?.name,
          to: target.name,
          projectId: task.projectId,
          taskId,
        })
      : next;
  });
  return { stageChanged, stageName: target.name };
}

/** Marks a task done by moving it to the first completed stage (or back to the first open one). */
export function setTaskCompleted(taskId: ID, completed: boolean): string | null {
  const state = getState();
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return null;
  const stages = getProjectStages(state, task.projectId);
  const target = completed ? stages.find((s) => s.isCompleted) : stages.find((s) => !s.isCompleted);
  if (!target) return null;
  moveTask(taskId, target.id, getStageTasks(state, target.id).length);
  return target.name;
}

function patchChecklist(taskId: ID, update: (items: ChecklistItem[]) => ChecklistItem[]) {
  setState((s) => ({
    ...s,
    tasks: replaceById(s.tasks, taskId, (t) => ({ ...t, checklist: update(t.checklist), updatedAt: now() })),
  }));
}

export function addChecklistItem(taskId: ID, text: string, assigneeId: ID | null = null) {
  patchChecklist(taskId, (items) => [...items, { id: uid("cl"), text: text.trim(), done: false, assigneeId }]);
}

export function toggleChecklistItem(taskId: ID, itemId: ID) {
  const task = getState().tasks.find((t) => t.id === taskId);
  const item = task?.checklist.find((c) => c.id === itemId);
  if (!task || !item) return;
  patchChecklist(taskId, (items) => items.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)));
  if (!item.done) {
    setState((s) =>
      withActivity(s, { action: "completed checklist item", target: item.text, projectId: task.projectId, taskId }),
    );
  }
}

export function updateChecklistItem(taskId: ID, itemId: ID, patch: Partial<Omit<ChecklistItem, "id">>) {
  patchChecklist(taskId, (items) => items.map((c) => (c.id === itemId ? { ...c, ...patch } : c)));
}

export function removeChecklistItem(taskId: ID, itemId: ID) {
  patchChecklist(taskId, (items) => items.filter((c) => c.id !== itemId));
}

export function reorderChecklist(taskId: ID, orderedIds: ID[]) {
  patchChecklist(taskId, (items) => {
    const byId = new Map(items.map((c) => [c.id, c]));
    return orderedIds.map((id) => byId.get(id)).filter((c): c is ChecklistItem => Boolean(c));
  });
}
