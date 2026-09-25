"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Paperclip, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { acceptFiles } from "@/components/attachments/file-dropzone";
import { useUI } from "@/components/providers/ui-provider";
import { MarkdownEditor } from "@/components/shared/markdown-editor";
import { UserPicker } from "@/components/shared/pickers";
import { TagInput } from "@/components/shared/tag-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field, Input, Label } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { PRIORITIES, PRIORITY_STYLES } from "@/lib/constants";
import { fromInputDate, toInputDate } from "@/lib/dates";
import { cn, formatBytes, wait } from "@/lib/utils";
import { addAttachments } from "@/services/attachments";
import { createTask } from "@/services/tasks";
import { getProjectStages } from "@/store/selectors";
import { useAppState, useCurrentUser } from "@/store/hooks";
import type { ID } from "@/types";

export interface TaskFormDefaults {
  projectId?: ID;
  stageId?: ID;
  dueDate?: string | null;
}

const schema = z.object({
  title: z.string().trim().min(1, "Give the task a title").max(140, "Keep the title under 140 characters"),
  description: z.string(),
  projectId: z.string().min(1, "Select a project"),
  stageId: z.string().min(1, "Select a stage"),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  assigneeIds: z.array(z.string()),
  dueDate: z.string(),
  tags: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

export function TaskFormDialog({
  open,
  defaults,
  onOpenChange,
}: {
  open: boolean;
  defaults: TaskFormDefaults;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Create Task" size="xl">
        {open && <TaskForm defaults={defaults} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({ defaults, onDone }: { defaults: TaskFormDefaults; onDone: () => void }) {
  const state = useAppState();
  const me = useCurrentUser();
  const { openTask } = useUI();
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const projects = state.projects.filter((p) => p.status !== "Archived" || p.id === defaults.projectId);
  const initialProject = defaults.projectId ?? projects.find((p) => p.status === "Active")?.id ?? projects[0]?.id ?? "";
  const initialStage = defaults.stageId ?? getProjectStages(state, initialProject)[0]?.id ?? "";

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      projectId: initialProject,
      stageId: initialStage,
      priority: "Medium",
      assigneeIds: [me.id],
      dueDate: toInputDate(defaults.dueDate ?? null),
      tags: [],
    },
  });

  const projectId = useWatch({ control, name: "projectId" });
  const stages = getProjectStages(state, projectId);
  const project = state.projects.find((p) => p.id === projectId);
  const members = project ? state.users.filter((u) => project.memberIds.includes(u.id)) : state.users;
  const others = state.users.filter((u) => !members.includes(u));
  const tagSuggestions = useMemo(() => [...new Set(state.tasks.flatMap((t) => t.tags))].sort(), [state.tasks]);

  async function onSubmit(values: FormValues) {
    await wait(300);
    const task = createTask({
      projectId: values.projectId,
      stageId: values.stageId,
      title: values.title,
      description: values.description,
      priority: values.priority,
      assigneeIds: values.assigneeIds,
      dueDate: fromInputDate(values.dueDate),
      tags: values.tags,
    });
    if (files.length) await addAttachments(files, { projectId: task.projectId, taskId: task.id });
    const stage = stages.find((s) => s.id === values.stageId);
    toast.success("Task created", {
      description: `“${task.title}” added to ${stage?.name ?? "board"}`,
      action: { label: "Open", onClick: () => openTask(task.id) },
    });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
      <DialogBody>
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <Field label="Title" htmlFor="task-title" required error={errors.title?.message}>
              <Input id="task-title" autoFocus placeholder="e.g. Implement homepage" aria-invalid={!!errors.title} {...register("title")} />
            </Field>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-description">Description</Label>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <MarkdownEditor id="task-description" value={field.value} onChange={field.onChange} rows={8} placeholder="Write a detailed description…" />
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Attachments</Label>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                  const { accepted, rejected } = acceptFiles(e.target.files);
                  if (rejected) toast.error("Some files exceed the 50 MB limit");
                  setFiles((prev) => [...prev, ...accepted]);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                {files.map((f, i) => (
                  <span key={`${f.name}-${i}`} className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs">
                    <Paperclip className="size-3.5 text-muted-foreground" />
                    <span className="max-w-40 truncate font-medium">{f.name}</span>
                    <span className="text-muted-foreground">{formatBytes(f.size)}</span>
                    <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                  <Paperclip /> Add files
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Project" htmlFor="task-project" required error={errors.projectId?.message}>
              <Controller
                control={control}
                name="projectId"
                render={({ field }) => (
                  <Select
                    id="task-project"
                    value={field.value}
                    onValueChange={(projectId) => {
                      field.onChange(projectId);
                      // Stage options depend on the project — default to its first stage.
                      const first = getProjectStages(state, projectId)[0];
                      setValue("stageId", first?.id ?? "", { shouldValidate: true });
                    }}
                    options={projects.map((p) => ({
                      value: p.id,
                      textValue: p.name,
                      label: (
                        <span className="flex items-center gap-2">
                          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.name}
                        </span>
                      ),
                    }))}
                  />
                )}
              />
            </Field>
            <Field label="Stage" htmlFor="task-stage" required error={errors.stageId?.message}>
              <Controller
                control={control}
                name="stageId"
                render={({ field }) => (
                  <Select
                    id="task-stage"
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select a stage"
                    options={stages.map((s) => ({
                      value: s.id,
                      textValue: s.name,
                      label: (
                        <span className="flex items-center gap-2">
                          <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </span>
                      ),
                    }))}
                  />
                )}
              />
            </Field>
            <div className="flex flex-col gap-1.5">
              <Label id="priority-label">Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <div role="radiogroup" aria-labelledby="priority-label" className="grid grid-cols-4 gap-1.5">
                    {PRIORITIES.map((p) => {
                      const selected = field.value === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => field.onChange(p)}
                          className={cn(
                            "flex h-9 items-center justify-center gap-1 rounded-lg text-xs font-semibold transition",
                            PRIORITY_STYLES[p].badge,
                            selected ? "ring-2 ring-current ring-offset-1 ring-offset-popover" : "opacity-60 hover:opacity-100",
                          )}
                        >
                          {selected && <span className={cn("size-1.5 rounded-full", PRIORITY_STYLES[p].dot)} />}
                          {p}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Assignees</Label>
              <Controller
                control={control}
                name="assigneeIds"
                render={({ field }) => <UserPicker users={[...members, ...others]} value={field.value} onChange={field.onChange} />}
              />
            </div>
            <Field label="Due date" htmlFor="task-due">
              <Controller
                control={control}
                name="dueDate"
                render={({ field }) => <DatePicker id="task-due" value={field.value} onChange={field.onChange} presets placeholder="Select date" />}
              />
            </Field>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-tags">Tags</Label>
              <Controller
                control={control}
                name="tags"
                render={({ field }) => <TagInput id="task-tags" value={field.value} onChange={field.onChange} suggestions={tagSuggestions} />}
              />
            </div>
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} className="sm:min-w-32">
          Create Task
        </Button>
      </DialogFooter>
    </form>
  );
}
