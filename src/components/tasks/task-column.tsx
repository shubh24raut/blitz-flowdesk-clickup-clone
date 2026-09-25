"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  CircleDashed,
  EllipsisVertical,
  Palette,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useUI } from "@/components/providers/ui-provider";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COLOR_OPTIONS } from "@/lib/constants";
import { cn, withAlpha } from "@/lib/utils";
import { updateStage } from "@/services/stages";
import { createTask } from "@/services/tasks";
import type { Priority, Stage, Task, User } from "@/types";
import { TaskCard } from "./task-card";

export interface ColumnMeta {
  id: string;
  title: string;
  color: string;
  stage?: Stage;
}

export interface CardData {
  task: Task;
  assignees: User[];
  commentCount: number;
  attachmentCount: number;
  done: boolean;
}

export function SortableTaskCard({ data }: { data: CardData }) {
  const { openTask } = useUI();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: data.task.id,
    data: { type: "task" },
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="touch-manipulation"
    >
      <TaskCard
        {...data}
        {...attributes}
        {...listeners}
        dragging={isDragging}
        aria-label={`${data.task.title}. Press Enter to open, Space to move.`}
        onClick={() => openTask(data.task.id)}
        onKeyDown={(e) => {
          listeners?.onKeyDown?.(e);
          if (e.key === "Enter") openTask(data.task.id);
        }}
        className="cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
      />
    </li>
  );
}

export function TaskColumn({
  meta,
  projectId,
  cards,
  canMoveLeft,
  canMoveRight,
  onMove,
  onDelete,
  groupBy,
}: {
  meta: ColumnMeta;
  projectId: string;
  cards: CardData[];
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  groupBy: "stage" | "priority";
}) {
  const { openCreateTask } = useUI();
  const { setNodeRef, isOver } = useDroppable({ id: `col:${meta.id}`, data: { type: "column" } });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(meta.title);
  const stage = meta.stage;

  function quickAdd() {
    const title = draft.trim();
    if (!title) return;
    if (stage) createTask({ projectId, stageId: stage.id, title });
    setDraft("");
    toast.success(`Task added to ${meta.title}`);
  }

  function saveName() {
    setRenaming(false);
    if (stage && name.trim() && name.trim() !== stage.name) {
      updateStage(stage.id, { name: name.trim() });
      toast.success("Stage renamed");
    } else setName(meta.title);
  }

  return (
    <section
      aria-label={`${meta.title} column`}
      className="flex max-h-full w-[82vw] shrink-0 snap-start flex-col rounded-2xl border sm:w-[272px]"
      style={{ backgroundColor: withAlpha(meta.color, 0.06), borderColor: withAlpha(meta.color, 0.14) }}
    >
      <header className="flex items-center gap-2 px-3 pb-2 pt-3">
        <span className="grid size-5 shrink-0 place-items-center rounded-md text-white" style={{ backgroundColor: meta.color }}>
          {stage?.isCompleted ? <CircleCheck className="size-3.5" /> : <CircleDashed className="size-3" />}
        </span>
        {renaming ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") {
                setName(meta.title);
                setRenaming(false);
              }
            }}
            aria-label="Stage name"
            className="h-7 min-w-0 flex-1 rounded-md border border-primary bg-card px-2 text-sm font-semibold outline-none"
          />
        ) : (
          <h3 className="truncate text-sm font-semibold" onDoubleClick={() => stage && setRenaming(true)}>
            {meta.title}
          </h3>
        )}
        <span className="rounded-full px-1.5 text-xs font-semibold" style={{ color: meta.color, backgroundColor: withAlpha(meta.color, 0.14) }}>
          {cards.length}
        </span>
        <div className="ml-auto flex items-center">
          {stage && (
            <button
              type="button"
              onClick={() => openCreateTask({ projectId, stageId: stage.id })}
              aria-label={`Add task to ${meta.title}`}
              className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
            >
              <Plus className="size-4" />
            </button>
          )}
          {stage && groupBy === "stage" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`${meta.title} options`}
                  className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
                >
                  <EllipsisVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52">
                <DropdownMenuItem onSelect={() => setRenaming(true)}>
                  <Pencil /> Rename
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Palette /> Color
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="grid w-auto min-w-0 grid-cols-5 gap-1 p-2">
                    {COLOR_OPTIONS.map((color) => (
                      <DropdownMenuItem
                        key={color}
                        aria-label={color}
                        onSelect={() => updateStage(stage.id, { color })}
                        className={cn("size-7 justify-center rounded-full p-0", color === stage.color && "ring-2 ring-offset-2 ring-offset-popover")}
                        style={{ backgroundColor: color, ["--tw-ring-color" as string]: color }}
                      >
                        <span className="sr-only">{color}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuCheckboxItem
                  checked={stage.isCompleted}
                  onCheckedChange={(checked) => {
                    updateStage(stage.id, { isCompleted: checked });
                    toast.success(checked ? `“${stage.name}” now counts as completed` : `“${stage.name}” is no longer a completed stage`);
                  }}
                >
                  <CircleCheck /> Completed stage
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={!canMoveLeft} onSelect={() => onMove(-1)}>
                  <ArrowLeft /> Move left
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canMoveRight} onSelect={() => onMove(1)}>
                  <ArrowRight /> Move right
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={onDelete}>
                  <Trash2 /> Delete stage
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <SortableContext items={cards.map((c) => c.task.id)} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={cn(
            "scrollbar-thin flex min-h-24 flex-1 flex-col gap-2.5 overflow-y-auto px-2.5 pb-2 pt-1 transition-colors",
            isOver && "rounded-xl bg-white/40 dark:bg-white/5",
          )}
        >
          {cards.map((card) => (
            <SortableTaskCard key={card.task.id} data={card} />
          ))}
          {cards.length === 0 && (
            <li className="grid flex-1 place-items-center rounded-xl border-2 border-dashed px-3 py-6 text-center text-xs text-muted-foreground" style={{ borderColor: withAlpha(meta.color, 0.25) }}>
              {groupBy === "priority" ? `Drop tasks here to set ${meta.title as Priority} priority` : "No tasks — drag one here"}
            </li>
          )}
        </ul>
      </SortableContext>

      {stage && (
        <div className="px-2.5 pb-3 pt-1">
          {adding ? (
            <div className="rounded-xl border border-primary bg-card p-2 shadow-raised">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") quickAdd();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setDraft("");
                  }
                }}
                onBlur={() => !draft && setAdding(false)}
                placeholder="Task name — Enter to add"
                aria-label={`New task in ${meta.title}`}
                className="h-8 w-full bg-transparent px-1 text-sm outline-none placeholder:text-subtle"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition hover:bg-card"
              style={{ color: meta.color }}
            >
              <Plus className="size-4" /> Add task
            </button>
          )}
        </div>
      )}
    </section>
  );
}
