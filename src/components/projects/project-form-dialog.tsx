"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ColorPicker } from "@/components/shared/color-picker";
import { UserPicker } from "@/components/shared/pickers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field, Input, Label, Textarea } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { LetterTile } from "@/components/shared/avatar";
import { PROJECT_STATUSES } from "@/constants";
import { fromInputDate, toInputDate } from "@/lib/dates";
import { cn, wait } from "@/lib/utils";
import { createProject, STAGE_TEMPLATES, updateProject, type StageTemplateId } from "@/store/actions/projects";
import { useWorkspace, useCurrentUser } from "@/store/hooks";
import type { ID, Project } from "@/types";

const schema = z
  .object({
    name: z.string().trim().min(2, "Project name is required").max(80),
    description: z.string().max(500, "Keep the description under 500 characters"),
    clientId: z.string(),
    status: z.enum(["Active", "On Hold", "Completed", "Archived"]),
    color: z.string(),
    startDate: z.string().min(1, "Pick a start date"),
    dueDate: z.string().min(1, "Pick a due date"),
    memberIds: z.array(z.string()),
    template: z.string(),
  })
  .refine((v) => v.dueDate >= v.startDate, { path: ["dueDate"], message: "Due date must be after the start date" });

type FormValues = z.infer<typeof schema>;

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  defaultClientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  defaultClientId?: ID;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title={project ? "Edit project" : "Create project"}
        description={project ? "Update the project details." : "Set up the project and pick a starting workflow — you can customise stages anytime."}
      >
        {open && <ProjectForm project={project} defaultClientId={defaultClientId} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ProjectForm({ project, defaultClientId, onDone }: { project?: Project; defaultClientId?: ID; onDone: () => void }) {
  const state = useWorkspace();
  const me = useCurrentUser();
  const router = useRouter();
  const today = new Date();
  const inMonth = new Date(today.getTime() + 30 * 86_400_000);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      clientId: project?.clientId ?? defaultClientId ?? "",
      status: project?.status ?? "Active",
      color: project?.color ?? "#5B5CF6",
      startDate: toInputDate(project?.startDate ?? today.toISOString()),
      dueDate: toInputDate(project?.dueDate ?? inMonth.toISOString()),
      memberIds: project?.memberIds ?? [me.id],
      template: "agency",
    },
  });

  async function onSubmit(values: FormValues) {
    await wait(350);
    const input = {
      name: values.name,
      description: values.description,
      clientId: values.clientId || null,
      status: values.status,
      color: values.color,
      startDate: fromInputDate(values.startDate) ?? new Date().toISOString(),
      dueDate: fromInputDate(values.dueDate) ?? new Date().toISOString(),
      memberIds: values.memberIds,
    };
    if (project) {
      updateProject(project.id, input);
      toast.success("Project updated");
      onDone();
    } else {
      const created = createProject(input, values.template as StageTemplateId);
      toast.success(`Project “${created.name}” created`);
      onDone();
      router.push(`/projects/${created.id}/tasks`);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
      <DialogBody className="space-y-4">
        <Field label="Project name" htmlFor="project-name" required error={errors.name?.message}>
          <Input id="project-name" autoFocus placeholder="e.g. Website Redesign" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Description" htmlFor="project-description" error={errors.description?.message}>
          <Textarea id="project-description" rows={3} placeholder="What is this project about?" {...register("description")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client" htmlFor="project-client">
            <Controller
              control={control}
              name="clientId"
              render={({ field }) => (
                <Select
                  id="project-client"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    { value: "", label: "Internal (no client)" },
                    ...state.clients.map((c) => ({
                      value: c.id,
                      textValue: c.name,
                      label: (
                        <span className="flex items-center gap-2">
                          <LetterTile name={c.name} color={c.color} solid size="sm" className="size-5 rounded-md text-[10px]" />
                          {c.name}
                        </span>
                      ),
                    })),
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Status" htmlFor="project-status">
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  id="project-status"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={PROJECT_STATUSES.map((s) => ({ value: s, label: s }))}
                />
              )}
            />
          </Field>
          <Field label="Start date" htmlFor="project-start" required error={errors.startDate?.message}>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <DatePicker id="project-start" value={field.value} onChange={field.onChange} clearable={false} invalid={!!errors.startDate} />
              )}
            />
          </Field>
          <Field label="Due date" htmlFor="project-due" required error={errors.dueDate?.message}>
            <Controller
              control={control}
              name="dueDate"
              render={({ field }) => (
                <DatePicker id="project-due" value={field.value} onChange={field.onChange} clearable={false} invalid={!!errors.dueDate} />
              )}
            />
          </Field>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Team members</Label>
          <Controller
            control={control}
            name="memberIds"
            render={({ field }) => <UserPicker users={state.users} value={field.value} onChange={field.onChange} placeholder="Add members" />}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Color</Label>
          <Controller control={control} name="color" render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />} />
        </div>
        {!project && (
          <div className="flex flex-col gap-2">
            <Label id="template-label">Starting workflow</Label>
            <Controller
              control={control}
              name="template"
              render={({ field }) => (
                <div role="radiogroup" aria-labelledby="template-label" className="grid gap-2">
                  {Object.entries(STAGE_TEMPLATES).map(([id, template]) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={field.value === id}
                      onClick={() => field.onChange(id)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition",
                        field.value === id ? "border-primary bg-primary-light/60 ring-3 ring-primary/10" : "border-border hover:bg-muted",
                      )}
                    >
                      <span className="text-sm font-semibold">{template.label}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-1.5">
                        {template.stages.map((s, i) => (
                          <span key={s.name} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.name}
                            {i < template.stages.length - 1 && <span className="text-subtle">→</span>}
                          </span>
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {project ? "Save changes" : "Create project"}
        </Button>
      </DialogFooter>
    </form>
  );
}
