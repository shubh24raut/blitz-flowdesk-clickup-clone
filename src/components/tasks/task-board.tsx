"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DeleteStageDialog } from "@/components/projects/delete-stage-dialog";
import { COLOR_OPTIONS, PRIORITIES, PRIORITY_STYLES } from "@/constants";
import { arrayMove } from "@/lib/utils";
import { addStage, reorderStages } from "@/store/actions/stages";
import { moveTask, updateTask } from "@/store/actions/tasks";
import { getProjectStages, getStageTasks, getUsers, indexes } from "@/store/selectors";
import { getState } from "@/store/store";
import { useAppState } from "@/store/hooks";
import type { Priority, Project, Stage, Task } from "@/types";
import { TaskCard } from "./task-card";
import { TaskColumn, type CardData, type ColumnMeta } from "./task-column";

type Columns = Record<string, string[]>;

const COLUMN_PREFIX = "col:";

/**
 * Prefer whatever is under the pointer (falling back to rect overlap for
 * keyboard/touch), and prefer a card over its surrounding column.
 */
const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
  const cardHit = hits.find((hit) => !String(hit.id).startsWith(COLUMN_PREFIX));
  return cardHit ? [cardHit] : hits;
};

function findColumn(id: string, columns: Columns): string | undefined {
  if (id.startsWith(COLUMN_PREFIX)) return id.slice(COLUMN_PREFIX.length);
  return Object.keys(columns).find((key) => columns[key].includes(id));
}

export function TaskBoard({
  project,
  tasks,
  groupBy,
}: {
  project: Project;
  /** Tasks after search/filter; the board only renders these. */
  tasks: Task[];
  groupBy: "stage" | "priority";
}) {
  const state = useAppState();
  const stages = getProjectStages(state, project.id);
  const idx = indexes(state);
  const [dragColumns, setDragColumns] = useState<Columns | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
  const [newStage, setNewStage] = useState<string | null>(null);

  const meta: ColumnMeta[] = useMemo(
    () =>
      groupBy === "stage"
        ? stages.map((s) => ({ id: s.id, title: s.name, color: s.color, stage: s }))
        : PRIORITIES.map((p) => ({ id: p, title: p, color: PRIORITY_STYLES[p].color })),
    [groupBy, stages],
  );

  const baseColumns: Columns = useMemo(() => {
    const stageOrder = new Map(stages.map((s) => [s.id, s.order]));
    const sorted = [...tasks].sort(
      (a, b) => (stageOrder.get(a.stageId) ?? 0) - (stageOrder.get(b.stageId) ?? 0) || a.order - b.order,
    );
    const columns: Columns = Object.fromEntries(meta.map((m) => [m.id, [] as string[]]));
    for (const task of sorted) {
      const key = groupBy === "stage" ? task.stageId : task.priority;
      columns[key]?.push(task.id);
    }
    return columns;
  }, [tasks, meta, stages, groupBy]);

  const columns = dragColumns ?? baseColumns;
  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const cardData = (id: string): CardData | null => {
    const task = taskMap.get(id);
    if (!task) return null;
    return {
      task,
      assignees: getUsers(state, task.assigneeIds),
      commentCount: idx.commentCount.get(task.id) ?? 0,
      attachmentCount: idx.attachmentCount.get(task.id) ?? 0,
      done: idx.stages.get(task.stageId)?.isCompleted ?? false,
    };
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setDragColumns(baseColumns);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);
    setDragColumns((prev) => {
      const cols = prev ?? baseColumns;
      const from = findColumn(activeKey, cols);
      const to = findColumn(overKey, cols);
      if (!from || !to || from === to) return cols;
      const toItems = cols[to].filter((id) => id !== activeKey);
      const overIndex = overKey.startsWith(COLUMN_PREFIX) ? -1 : toItems.indexOf(overKey);
      const translated = active.rect.current.translated;
      const below = translated ? translated.top > over.rect.top + over.rect.height / 2 : false;
      const index = overIndex >= 0 ? overIndex + (below ? 1 : 0) : toItems.length;
      toItems.splice(index, 0, activeKey);
      return { ...cols, [from]: cols[from].filter((id) => id !== activeKey), [to]: toItems };
    });
  }

  function commit(taskId: string, columnId: string, ordered: string[]) {
    const fresh = getState();
    const task = fresh.tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (groupBy === "priority") {
      if (task.priority !== columnId) {
        updateTask(taskId, { priority: columnId as Priority });
        toast.success(`Priority changed to ${columnId}`);
      }
      return;
    }

    // Translate the position in the (possibly filtered) column into a position in the full stage.
    const full = getStageTasks(fresh, columnId).map((t) => t.id).filter((id) => id !== taskId);
    const pos = ordered.indexOf(taskId);
    const prev = ordered[pos - 1];
    const next = ordered[pos + 1];
    let index = full.length;
    if (prev && full.includes(prev)) index = full.indexOf(prev) + 1;
    else if (next && full.includes(next)) index = full.indexOf(next);

    const unchanged = task.stageId === columnId && getStageTasks(fresh, columnId).findIndex((t) => t.id === taskId) === index;
    if (unchanged) return;
    const { stageChanged, stageName } = moveTask(taskId, columnId, index);
    if (stageChanged) toast.success(`Task moved to ${stageName}`);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const cols = dragColumns ?? baseColumns;
    const activeKey = String(active.id);
    setActiveId(null);
    if (!over) {
      setDragColumns(null);
      return;
    }
    const overKey = String(over.id);
    const column = findColumn(activeKey, cols);
    if (!column) {
      setDragColumns(null);
      return;
    }
    let ordered = cols[column];
    if (!overKey.startsWith(COLUMN_PREFIX) && findColumn(overKey, cols) === column) {
      const from = ordered.indexOf(activeKey);
      const to = ordered.indexOf(overKey);
      if (from !== to && to >= 0) ordered = arrayMove(ordered, from, to);
    }
    commit(activeKey, column, ordered);
    setDragColumns(null);
  }

  function moveColumn(stage: Stage, direction: -1 | 1) {
    const ids = stages.map((s) => s.id);
    const from = ids.indexOf(stage.id);
    const to = from + direction;
    if (to < 0 || to >= ids.length) return;
    reorderStages(project.id, arrayMove(ids, from, to));
  }

  function createStage() {
    const name = newStage?.trim();
    if (!name) {
      setNewStage(null);
      return;
    }
    const used = new Set(stages.map((s) => s.color));
    addStage(project.id, { name, color: COLOR_OPTIONS.find((c) => !used.has(c)) ?? COLOR_OPTIONS[1] });
    toast.success(`Stage “${name}” created`);
    setNewStage(null);
  }

  const activeCard = activeId ? cardData(activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setDragColumns(null);
        }}
        accessibility={{
          screenReaderInstructions: {
            draggable: "To pick up a task, press Space. Use the arrow keys to move it between columns, then press Space again to drop it.",
          },
        }}
      >
        <div className="scrollbar-thin -mx-4 flex h-[calc(100dvh-15rem)] min-h-[420px] snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:snap-none md:px-6 lg:-mx-8 lg:px-8">
          {meta.map((m, i) => (
            <TaskColumn
              key={m.id}
              meta={m}
              projectId={project.id}
              groupBy={groupBy}
              cards={(columns[m.id] ?? []).map(cardData).filter((c): c is CardData => c !== null)}
              canMoveLeft={i > 0}
              canMoveRight={i < meta.length - 1}
              onMove={(dir) => m.stage && moveColumn(m.stage, dir)}
              onDelete={() => m.stage && setStageToDelete(m.stage)}
            />
          ))}
          {groupBy === "stage" && (
            <div className="w-[82vw] shrink-0 snap-start sm:w-[272px]">
              {newStage === null ? (
                <button
                  type="button"
                  onClick={() => setNewStage("")}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:bg-primary-light hover:text-primary"
                >
                  <Plus className="size-4" /> Add stage
                </button>
              ) : (
                <div className="rounded-2xl border border-primary bg-card p-3 shadow-raised">
                  <input
                    autoFocus
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createStage();
                      if (e.key === "Escape") setNewStage(null);
                    }}
                    onBlur={createStage}
                    placeholder="Stage name, e.g. UAT"
                    aria-label="New stage name"
                    className="h-8 w-full bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-subtle"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Enter to create · Esc to cancel</p>
                </div>
              )}
            </div>
          )}
        </div>
        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
          {activeCard ? <TaskCard {...activeCard} overlay className="w-[82vw] sm:w-[248px]" /> : null}
        </DragOverlay>
      </DndContext>
      <DeleteStageDialog stage={stageToDelete} onOpenChange={(open) => !open && setStageToDelete(null)} />
    </>
  );
}
