"use client";

import { FileText, ListChecks, MessageSquare, Paperclip } from "lucide-react";
import type { ComponentProps } from "react";
import { AvatarStack } from "@/components/shared/avatar";
import { DueDate, PriorityBadge, TagBadge } from "@/components/shared/badges";
import { cn } from "@/lib/utils";
import type { Task, User } from "@/types";

export interface TaskCardProps extends Omit<ComponentProps<"div">, "children"> {
  task: Task;
  assignees: User[];
  commentCount: number;
  attachmentCount: number;
  done: boolean;
  dragging?: boolean;
  overlay?: boolean;
}

export function TaskCard({
  task,
  assignees,
  commentCount,
  attachmentCount,
  done,
  dragging,
  overlay,
  className,
  ...props
}: TaskCardProps) {
  const checklistDone = task.checklist.filter((c) => c.done).length;
  return (
    <div
      className={cn(
        "group rounded-xl border border-border bg-card p-3.5 text-left shadow-card transition-[box-shadow,border-color,opacity] hover:border-primary/30 hover:shadow-raised",
        dragging && "opacity-40",
        overlay && "rotate-2 cursor-grabbing border-primary/40 shadow-overlay",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 size-4 shrink-0 text-subtle" />
        <p className={cn("text-[13px] font-medium leading-snug text-foreground", done && "text-muted-foreground line-through decoration-subtle")}>
          {task.title}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {task.tags.slice(0, 2).map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <DueDate date={task.dueDate} completed={done} />
        <div className="flex items-center gap-2 text-xs text-subtle">
          {task.checklist.length > 0 && (
            <span className={cn("inline-flex items-center gap-1", checklistDone === task.checklist.length && "text-emerald-600")} title="Checklist">
              <ListChecks className="size-3.5" />
              {checklistDone}/{task.checklist.length}
            </span>
          )}
          {commentCount > 0 && (
            <span className="inline-flex items-center gap-1" title="Comments">
              <MessageSquare className="size-3.5" />
              {commentCount}
            </span>
          )}
          {attachmentCount > 0 && (
            <span className="inline-flex items-center gap-1" title="Attachments">
              <Paperclip className="size-3.5" />
              {attachmentCount}
            </span>
          )}
        </div>
        <AvatarStack users={assignees} max={2} size="sm" className="ml-auto" />
      </div>
    </div>
  );
}
