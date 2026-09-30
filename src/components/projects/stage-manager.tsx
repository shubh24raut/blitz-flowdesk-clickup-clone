"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ellipsis, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ColorPicker } from "@/components/shared/color-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, Input, Label } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { COLOR_OPTIONS } from "@/constants";
import { arrayMove, cn } from "@/lib/utils";
import { restrictToVerticalAxisModifier } from "@/components/tasks/dnd-modifiers";
import { addStage, reorderStages, updateStage } from "@/store/actions/stages";
import { getProjectStages, getStageTasks } from "@/store/selectors";
import { useWorkspace } from "@/store/hooks";
import type { Stage } from "@/types";
import { DeleteStageDialog } from "./delete-stage-dialog";

const GRID = "grid grid-cols-[28px_minmax(0,1fr)_48px_40px] items-center gap-3 sm:grid-cols-[28px_minmax(0,1fr)_64px_64px_170px_44px]";

export function StageManager({ projectId }: { projectId: string }) {
  const state = useWorkspace();
  const stages = getProjectStages(state, projectId);
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<Stage | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const ids = stages.map((s) => s.id);
    reorderStages(projectId, arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
    toast.success("Stage order updated");
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Workflow Stages</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create and customize stages for this project. Drag to reorder.</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus /> Add Stage
        </Button>
      </div>

      <div className="mt-5 space-y-2">
        <div className={cn(GRID, "rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium text-muted-foreground shadow-card")}>
          <span>#</span>
          <span>Stage Name</span>
          <span className="hidden sm:block">Color</span>
          <span className="text-center">Tasks</span>
          <span className="hidden sm:block">Mark as completed</span>
          <span className="text-right sm:text-left">Actions</span>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxisModifier]}>
          <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {stages.map((stage) => (
                <StageRow key={stage.id} stage={stage} taskCount={getStageTasks(state, stage.id).length} onDelete={() => setToDelete(stage)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Tasks in stages marked as completed count as done in progress, dashboards and reports.
      </p>

      <AddStageDialog open={adding} onOpenChange={setAdding} projectId={projectId} usedColors={stages.map((s) => s.color)} />
      <DeleteStageDialog stage={toDelete} onOpenChange={(open) => !open && setToDelete(null)} />
    </div>
  );
}

function StageRow({ stage, taskCount, onDelete }: { stage: Stage; taskCount: number; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.name);

  function save() {
    setEditing(false);
    const next = name.trim();
    if (next && next !== stage.name) {
      updateStage(stage.id, { name: next });
      toast.success(`Stage renamed to “${next}”`);
    } else setName(stage.name);
  }

  function toggleCompleted(checked: boolean) {
    updateStage(stage.id, { isCompleted: checked });
    toast.success(checked ? `“${stage.name}” marked as completed` : `“${stage.name}” unmarked as completed`);
  }

  const colorSwatch = (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Change color of ${stage.name}`}
          className="size-6 rounded-full ring-offset-2 ring-offset-card transition hover:ring-2"
          style={{ backgroundColor: stage.color, ["--tw-ring-color" as string]: stage.color }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Stage color</p>
        <ColorPicker value={stage.color} onChange={(color) => updateStage(stage.id, { color })} />
      </PopoverContent>
    </Popover>
  );

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(GRID, "rounded-xl border border-border bg-card px-3 py-3 shadow-card", isDragging && "relative z-10 shadow-overlay")}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${stage.name}`}
        className="grid cursor-grab touch-none place-items-center rounded-md p-1 text-subtle hover:bg-muted hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex min-w-0 items-center gap-3">
        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} />
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setName(stage.name);
                setEditing(false);
              }
            }}
            aria-label="Stage name"
            className="h-8 min-w-0 flex-1 rounded-md border border-primary bg-card px-2 text-sm font-medium outline-none ring-3 ring-primary/15"
          />
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="min-w-0 truncate text-left text-sm font-semibold hover:text-primary">
            {stage.name}
          </button>
        )}
        <span className="sm:hidden">{stage.isCompleted && <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15">Completed</Badge>}</span>
      </div>
      <span className="hidden sm:block">{colorSwatch}</span>
      <span className="text-center text-sm font-medium tabular-nums">{taskCount}</span>
      <div className="hidden items-center gap-2 sm:flex">
        <Switch checked={stage.isCompleted} onCheckedChange={toggleCompleted} aria-label={`Mark ${stage.name} as completed`} />
        {stage.isCompleted && <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">Completed</Badge>}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={`${stage.name} actions`} className="ml-auto grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted sm:ml-0">
            <Ellipsis className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toggleCompleted(!stage.isCompleted)}>
            <Switch checked={stage.isCompleted} className="pointer-events-none scale-75" tabIndex={-1} aria-hidden />
            {stage.isCompleted ? "Unmark completed" : "Mark as completed"}
          </DropdownMenuItem>
          <div className="px-2.5 py-2 sm:hidden">
            <p className="mb-2 text-xs text-muted-foreground">Color</p>
            <ColorPicker value={stage.color} onChange={(color) => updateStage(stage.id, { color })} />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={onDelete}>
            <Trash2 /> Delete stage
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function AddStageDialog({
  open,
  onOpenChange,
  projectId,
  usedColors,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  usedColors: string[];
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(COLOR_OPTIONS[1]);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function reset(nextOpen: boolean) {
    if (nextOpen) {
      setName("");
      setColor(COLOR_OPTIONS.find((c) => !usedColors.includes(c)) ?? COLOR_OPTIONS[1]);
      setCompleted(false);
      setError(undefined);
    }
    onOpenChange(nextOpen);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Stage name is required");
      return;
    }
    addStage(projectId, { name, color, isCompleted: completed });
    toast.success("Stage created successfully");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent title="Add stage" description="Stages become columns on the project board." size="sm">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <DialogBody className="space-y-4">
            <Field label="Stage name" htmlFor="stage-name" required error={error}>
              <Input
                id="stage-name"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(undefined);
                }}
                placeholder="e.g. UAT"
                aria-invalid={!!error}
              />
            </Field>
            <div className="space-y-2">
              <Label>Color</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <span>
                <span className="block text-sm font-medium">Completed stage</span>
                <span className="block text-xs text-muted-foreground">Tasks here count as done.</span>
              </span>
              <Switch checked={completed} onCheckedChange={setCompleted} />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Stage</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
