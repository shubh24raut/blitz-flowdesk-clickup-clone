"use client";

import { closestCenter, DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ListChecks, Plus, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { UserAvatar } from "@/components/shared/avatar";
import { UserPicker } from "@/components/shared/pickers";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { arrayMove, cn } from "@/lib/utils";
import {
  addChecklistItem,
  removeChecklistItem,
  reorderChecklist,
  toggleChecklistItem,
  updateChecklistItem,
} from "@/store/actions/tasks";
import { indexes } from "@/store/selectors";
import { useWorkspace } from "@/store/hooks";
import type { ChecklistItem, Task, User } from "@/types";
import { restrictToVerticalAxisModifier } from "./dnd-modifiers";

export function TaskChecklist({ task }: { task: Task }) {
  const state = useWorkspace();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const done = task.checklist.filter((c) => c.done).length;
  const total = task.checklist.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const project = indexes(state).projects.get(task.projectId);
  const members = state.users.filter((u) => project?.memberIds.includes(u.id));

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const ids = task.checklist.map((c) => c.id);
    reorderChecklist(task.id, arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  }

  function submit() {
    if (!draft.trim()) return;
    addChecklistItem(task.id, draft);
    setDraft("");
  }

  return (
    <section aria-labelledby="checklist-heading">
      <div className="flex items-center gap-3">
        <h3 id="checklist-heading" className="shrink-0 text-[15px] font-semibold">
          Checklist <span className="font-normal text-muted-foreground">({done}/{total})</span>
        </h3>
        {total > 0 && (
          <>
            <Progress value={percent} className="h-2 flex-1" label="Checklist progress" />
            <span className="text-xs font-medium text-muted-foreground">{percent}%</span>
          </>
        )}
        <Button variant="secondary" size="sm" className={cn("shrink-0", total === 0 && "ml-auto")} onClick={() => setAdding(true)}>
          <Plus /> Add item
        </Button>
      </div>

      {total === 0 && !adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-muted"
        >
          <ListChecks className="size-4" /> Break this task into smaller steps
        </button>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxisModifier]}>
        <SortableContext items={task.checklist.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <ul className="mt-3 space-y-0.5">
            {task.checklist.map((item) => (
              <ChecklistRow key={item.id} taskId={task.id} item={item} members={members} assignee={item.assigneeId ? indexes(state).users.get(item.assigneeId) : undefined} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {adding && (
        <div className="mt-2 flex items-center gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              } else if (e.key === "Escape") {
                e.stopPropagation();
                setAdding(false);
                setDraft("");
              }
            }}
            placeholder="Add an item and press Enter"
            aria-label="New checklist item"
            className="h-9 flex-1 rounded-lg border border-primary bg-card px-3 text-sm outline-none ring-3 ring-primary/15"
          />
          <Button size="sm" onClick={submit} disabled={!draft.trim()}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setDraft(""); }}>
            Done
          </Button>
        </div>
      )}
    </section>
  );
}

function ChecklistRow({ taskId, item, members, assignee }: { taskId: string; item: ChecklistItem; members: User[]; assignee?: User }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);

  function save() {
    setEditing(false);
    if (text.trim() && text.trim() !== item.text) updateChecklistItem(taskId, item.id, { text: text.trim() });
    else setText(item.text);
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-1.5 py-1.5 hover:bg-muted/60",
        isDragging && "relative z-10 bg-card shadow-raised",
      )}
    >
      <Checkbox checked={item.done} onCheckedChange={() => toggleChecklistItem(taskId, item.id)} aria-label={`Mark “${item.text}” ${item.done ? "incomplete" : "complete"}`} />
      {editing ? (
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              e.stopPropagation();
              setText(item.text);
              setEditing(false);
            }
          }}
          aria-label="Edit checklist item"
          className="h-7 flex-1 rounded-md border border-primary bg-card px-2 text-sm outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn("min-w-0 flex-1 truncate text-left text-sm", item.done && "text-muted-foreground line-through decoration-subtle")}
        >
          {item.text}
        </button>
      )}
      <UserPicker
        users={members}
        value={item.assigneeId ? [item.assigneeId] : []}
        onChange={(ids) => updateChecklistItem(taskId, item.id, { assigneeId: ids[0] ?? null })}
        single
        align="end"
        trigger={
          <button type="button" aria-label={assignee ? `Assigned to ${assignee.name}` : "Assign"} className="rounded-full">
            {assignee ? (
              <UserAvatar user={assignee} size="sm" />
            ) : (
              <span className="grid size-6 place-items-center rounded-full border border-dashed border-border text-subtle opacity-0 transition group-hover:opacity-100">
                <UserPlus className="size-3" />
              </span>
            )}
          </button>
        }
      />
      <button
        type="button"
        onClick={() => removeChecklistItem(taskId, item.id)}
        aria-label={`Delete “${item.text}”`}
        className="rounded p-1 text-subtle opacity-100 transition hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder “${item.text}”`}
        className="cursor-grab touch-none rounded p-1 text-subtle hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
    </li>
  );
}
