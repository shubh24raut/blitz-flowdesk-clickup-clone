import { uid } from "@/lib/utils";
import { getProjectStages } from "@/store/selectors";
import { getState, setState } from "@/store/store";
import type { ID, Stage } from "@/types";
import { now, withActivity } from "./internal";

export function addStage(projectId: ID, input: { name: string; color: string; isCompleted?: boolean }): Stage {
  const existing = getProjectStages(getState(), projectId);
  const stage: Stage = {
    id: uid("s"),
    projectId,
    name: input.name.trim(),
    color: input.color,
    isCompleted: input.isCompleted ?? false,
    order: existing.length,
  };
  setState((s) =>
    withActivity({ ...s, stages: [...s.stages, stage] }, { action: "added stage", target: stage.name, projectId }),
  );
  return stage;
}

export function updateStage(id: ID, patch: Partial<Pick<Stage, "name" | "color" | "isCompleted">>) {
  setState((s) => {
    const stage = s.stages.find((x) => x.id === id);
    if (!stage) return s;
    const stages = s.stages.map((x) => (x.id === id ? { ...x, ...patch } : x));
    // Keep `completedAt` consistent when a stage's completed flag flips.
    const tasks =
      patch.isCompleted === undefined || patch.isCompleted === stage.isCompleted
        ? s.tasks
        : s.tasks.map((t) =>
            t.stageId === id ? { ...t, completedAt: patch.isCompleted ? (t.completedAt ?? now()) : null } : t,
          );
    const next = { ...s, stages, tasks };
    if (patch.name && patch.name !== stage.name) {
      return withActivity(next, { action: "renamed stage", from: stage.name, to: patch.name, projectId: stage.projectId });
    }
    return next;
  });
}

/** Persists a new stage order for a project. `orderedIds` must contain every stage id of the project. */
export function reorderStages(projectId: ID, orderedIds: ID[]) {
  const position = new Map(orderedIds.map((id, index) => [id, index]));
  setState((s) => ({
    ...s,
    stages: s.stages.map((x) =>
      x.projectId === projectId && position.has(x.id) ? { ...x, order: position.get(x.id)! } : x,
    ),
  }));
}

/**
 * Deletes a stage. Tasks inside it are appended to `moveToStageId`;
 * when the stage is empty `moveToStageId` may be null.
 */
export function deleteStage(id: ID, moveToStageId: ID | null) {
  setState((s) => {
    const stage = s.stages.find((x) => x.id === id);
    if (!stage) return s;
    const target = moveToStageId ? s.stages.find((x) => x.id === moveToStageId) : undefined;
    const moving = s.tasks.filter((t) => t.stageId === id).sort((a, b) => a.order - b.order);
    if (moving.length > 0 && !target) return s;
    const base = s.tasks.filter((t) => t.stageId === target?.id).length;
    const movedIds = new Map(moving.map((t, i) => [t.id, base + i]));
    const tasks = s.tasks.map((t) =>
      movedIds.has(t.id) && target
        ? {
            ...t,
            stageId: target.id,
            order: movedIds.get(t.id)!,
            completedAt: target.isCompleted ? (t.completedAt ?? now()) : null,
          }
        : t,
    );
    const remaining = s.stages
      .filter((x) => x.projectId === stage.projectId && x.id !== id)
      .sort((a, b) => a.order - b.order);
    const newOrder = new Map(remaining.map((x, i) => [x.id, i]));
    const stages = s.stages
      .filter((x) => x.id !== id)
      .map((x) => (newOrder.has(x.id) ? { ...x, order: newOrder.get(x.id)! } : x));
    return withActivity(
      { ...s, stages, tasks },
      {
        action: "deleted stage",
        target: stage.name,
        to: target && moving.length ? `${moving.length} tasks → ${target.name}` : undefined,
        projectId: stage.projectId,
      },
    );
  });
}
