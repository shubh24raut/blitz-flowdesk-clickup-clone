"use client";

import {
  ArrowLeft,
  CircleCheck,
  Copy,
  Ellipsis,
  Link2,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AttachmentGallery } from "@/components/attachments/attachment-gallery";
import { AttachmentPreviewDialog } from "@/components/attachments/attachment-preview-dialog";
import { AttachmentTile } from "@/components/attachments/attachment-tile";
import { CommentComposer } from "@/components/comments/comment-composer";
import { CommentThread } from "@/components/comments/comment-thread";
import { useUI } from "@/components/providers/ui-provider";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { AssigneeButton, PriorityPicker, StagePicker, UserPicker } from "@/components/shared/pickers";
import { TagInput } from "@/components/shared/tag-input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabCount, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { dueTone, formatLong, formatRelative, fromInputDate, toInputDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { addAttachments } from "@/store/actions/attachments";
import { deleteTask, duplicateTask, moveTask, setTaskCompleted, updateTask } from "@/store/actions/tasks";
import { getProjectStages, getStageTasks, indexes, isTaskDone, taskKey } from "@/store/selectors";
import { useWorkspace } from "@/store/hooks";
import type { Attachment, Task } from "@/types";
import { TaskChecklist } from "./task-checklist";
import { TaskDescription } from "./task-description";

type Tab = "details" | "comments" | "files" | "activity";

export function TaskDetail({
  task,
  expanded,
  onToggleExpand,
  onClose,
}: {
  task: Task;
  expanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}) {
  const state = useWorkspace();
  const { openTask } = useUI();
  const [tab, setTab] = useState<Tab>("details");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [title, setTitle] = useState(task.title);

  const idx = indexes(state);
  const project = idx.projects.get(task.projectId);
  const stages = getProjectStages(state, task.projectId);
  const creator = idx.users.get(task.createdById);
  const done = isTaskDone(state, task);
  const key = taskKey(state, task);
  const projectMembers = state.users.filter((u) => project?.memberIds.includes(u.id));
  const assignableUsers = [...projectMembers, ...state.users.filter((u) => !projectMembers.includes(u))];
  const assignees = task.assigneeIds.map((id) => idx.users.get(id)).filter((u) => u !== undefined);
  const files = state.attachments.filter((a) => a.taskId === task.id && !a.commentId);
  const commentCount = idx.commentCount.get(task.id) ?? 0;
  const activities = useMemo(() => state.activities.filter((a) => a.taskId === task.id), [state.activities, task.id]);
  const mentionNames = useMemo(() => state.users.map((u) => u.name), [state.users]);
  const tagSuggestions = useMemo(() => [...new Set(state.tasks.flatMap((t) => t.tags))].sort(), [state.tasks]);
  const tone = dueTone(task.dueDate, done);

  function saveTitle() {
    const next = title.trim();
    if (!next) setTitle(task.title);
    else if (next !== task.title) {
      updateTask(task.id, { title: next });
      toast.success("Task renamed");
    }
  }

  function changeStage(stageId: string) {
    if (stageId === task.stageId) return;
    const { stageName } = moveTask(task.id, stageId, getStageTasks(state, stageId).length);
    toast.success(`Task moved to ${stageName}`);
  }

  function copyLink() {
    const url = `${window.location.origin}/projects/${task.projectId}/tasks?task=${task.id}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Could not copy link"));
  }

  async function upload(list: File[]) {
    await addAttachments(list, { projectId: task.projectId, taskId: task.id });
  }

  const headerButton = "grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground";

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 sm:px-5">
        <button type="button" onClick={onClose} className={cn(headerButton, "md:hidden")} aria-label="Back">
          <ArrowLeft className="size-5" />
        </button>
        <StagePicker compact stages={stages} value={task.stageId} onChange={changeStage} />
        {done && (
          <span className="hidden items-center gap-1 text-xs font-medium text-emerald-600 sm:inline-flex">
            <CircleCheck className="size-3.5" /> Completed
          </span>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip content="Copy link">
            <button type="button" onClick={copyLink} className={headerButton} aria-label="Copy link">
              <Link2 className="size-4.5" />
            </button>
          </Tooltip>
          <DropdownMenu>
            <Tooltip content="More actions">
              <DropdownMenuTrigger asChild>
                <button type="button" className={headerButton} aria-label="More actions">
                  <Ellipsis className="size-4.5" />
                </button>
              </DropdownMenuTrigger>
            </Tooltip>
            <DropdownMenuContent className="w-52">
              <DropdownMenuItem
                onSelect={() => {
                  const stageName = setTaskCompleted(task.id, !done);
                  if (stageName) toast.success(done ? `Reopened — moved to ${stageName}` : `Completed — moved to ${stageName}`);
                  else toast.error(done ? "This project has no open stage" : "Mark a stage as completed in project settings first");
                }}
              >
                {done ? <RotateCcw /> : <CircleCheck />} {done ? "Reopen task" : "Mark as complete"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  const copy = duplicateTask(task.id);
                  if (copy) toast.success("Task duplicated", { action: { label: "Open", onClick: () => openTask(copy.id) } });
                }}
              >
                <Copy /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={copyLink}>
                <Link2 /> Copy link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => setConfirmDelete(true)}>
                <Trash2 /> Delete task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip content={expanded ? "Collapse" : "Expand"}>
            <button type="button" onClick={onToggleExpand} className={cn(headerButton, "hidden md:grid")} aria-label={expanded ? "Collapse" : "Expand"}>
              {expanded ? <Minimize2 className="size-4.5" /> : <Maximize2 className="size-4.5" />}
            </button>
          </Tooltip>
          <DialogPrimitive.Close className={cn(headerButton, "hidden md:grid")} aria-label="Close">
            <X className="size-5" />
          </DialogPrimitive.Close>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className={cn("px-4 pb-8 pt-5 sm:px-6", expanded && "lg:px-10")}>
          {/* Title */}
          <div className="flex items-start gap-3">
            <DialogPrimitive.Title className="sr-only">{task.title}</DialogPrimitive.Title>
            <div className="min-w-0 flex-1">
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                    if (e.key === "Escape") {
                      e.stopPropagation();
                      setTitle(task.title);
                      e.currentTarget.blur();
                    }
                  }}
                  rows={1}
                  aria-label="Task title"
                  className="-mx-1.5 block w-full resize-none rounded-lg bg-transparent px-1.5 py-0.5 text-2xl font-bold leading-snug tracking-tight outline-none field-sizing-content hover:bg-muted/60 focus:bg-muted/60"
                />
            </div>
            <span className="mt-2 shrink-0 font-mono text-xs text-muted-foreground">#{key}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            in{" "}
            <Link href={`/projects/${task.projectId}/tasks`} onClick={onClose} className="font-medium text-foreground hover:text-primary">
              {project?.name}
            </Link>{" "}
            · created by {creator?.name ?? "someone"} {formatRelative(task.createdAt)}
          </p>

          {/* Metadata */}
          <div className={cn("mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3", expanded && "lg:grid-cols-4")}>
            <MetaField label="Priority">
              <PriorityPicker
                value={task.priority}
                onChange={(priority) => {
                  updateTask(task.id, { priority });
                  toast.success(`Priority set to ${priority}`);
                }}
              />
            </MetaField>
            <MetaField label="Assignee" className="col-span-2 sm:col-span-1">
              <UserPicker
                users={assignableUsers}
                value={task.assigneeIds}
                onChange={(ids) => updateTask(task.id, { assigneeIds: ids })}
                trigger={<AssigneeButton users={assignees} />}
              />
            </MetaField>
            <MetaField label="Due date" className="col-span-2 sm:col-span-1">
              <DatePicker
                aria-label="Due date"
                value={toInputDate(task.dueDate)}
                presets
                placeholder="No due date"
                tone={tone === "overdue" ? "danger" : undefined}
                onChange={(value) => {
                  updateTask(task.id, { dueDate: fromInputDate(value) });
                  toast.success(value ? `Due ${formatLong(fromInputDate(value))}` : "Due date cleared");
                }}
              />
            </MetaField>
            {expanded && (
              <MetaField label="Stage" className="hidden lg:flex">
                <StagePicker stages={stages} value={task.stageId} onChange={changeStage} />
              </MetaField>
            )}
            <MetaField label="Tags" className="col-span-2 sm:col-span-3 lg:col-span-full">
              <TagInput value={task.tags} onChange={(tags) => updateTask(task.id, { tags })} suggestions={tagSuggestions} />
            </MetaField>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="comments">
                Comments <TabCount>{commentCount}</TabCount>
              </TabsTrigger>
              <TabsTrigger value="files">
                Files <TabCount>{files.length}</TabCount>
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-8 pt-5">
              <TaskDescription task={task} mentionNames={mentionNames} />
              <TaskChecklist task={task} />
              <section aria-labelledby="attachments-heading">
                <div className="flex items-center justify-between">
                  <h3 id="attachments-heading" className="text-[15px] font-semibold">
                    Attachments <span className="font-normal text-muted-foreground">({files.length})</span>
                  </h3>
                  <Button variant="secondary" size="sm" onClick={() => setTab("files")}>
                    <Plus /> Add files
                  </Button>
                </div>
                {files.length > 0 ? (
                  <div className={cn("mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4", expanded && "lg:grid-cols-6")}>
                    {files.slice(0, expanded ? 6 : 4).map((a) => (
                      <AttachmentTile key={a.id} attachment={a} onPreview={() => setPreview(a)} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No files attached yet.</p>
                )}
                {files.length > (expanded ? 6 : 4) && (
                  <Button variant="link" size="sm" className="mt-2" onClick={() => setTab("files")}>
                    View all {files.length} files
                  </Button>
                )}
              </section>
              <section aria-labelledby="comments-heading">
                <h3 id="comments-heading" className="mb-4 text-[15px] font-semibold">
                  Comments <span className="font-normal text-muted-foreground">({commentCount})</span>
                </h3>
                <CommentThread projectId={task.projectId} taskId={task.id} composerClassName="hidden md:flex" />
              </section>
            </TabsContent>

            <TabsContent value="comments" className="pt-5">
              <CommentThread projectId={task.projectId} taskId={task.id} composerClassName="hidden md:flex" />
            </TabsContent>

            <TabsContent value="files" className="pt-5">
              <AttachmentGallery
                attachments={files}
                onUpload={upload}
                columns={cn("grid-cols-2 sm:grid-cols-3", expanded && "lg:grid-cols-5")}
                subtitleFor={(a) => `${idx.users.get(a.uploadedById)?.name.split(" ")[0] ?? "Someone"} · ${formatRelative(a.createdAt)}`}
              />
            </TabsContent>

            <TabsContent value="activity" className="pt-5">
              <ActivityFeed activities={activities} linkTasks={false} emptyText="Changes to this task will appear here." />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sticky composer on phones */}
      {(tab === "details" || tab === "comments") && (
        <div className="border-t border-border bg-popover px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:hidden">
          <CommentComposer projectId={task.projectId} taskId={task.id} placeholder="Add a comment…" showAvatar={false} />
        </div>
      )}

      <AttachmentPreviewDialog attachment={preview} onOpenChange={(open) => !open && setPreview(null)} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${task.title}”?`}
        description="The task, its checklist, comments and attachments will be permanently removed."
        confirmLabel="Delete task"
        onConfirm={() => {
          onClose();
          deleteTask(task.id);
          toast.success("Task deleted");
        }}
      />
    </>
  );
}

function MetaField({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
