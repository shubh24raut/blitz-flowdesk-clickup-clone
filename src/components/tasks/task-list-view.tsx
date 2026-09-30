"use client";

import { ChevronDown, MessageSquare, Paperclip, Plus, SearchX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useUI } from "@/components/providers/ui-provider";
import { AvatarStack } from "@/components/shared/avatar";
import { DueDate, PriorityBadge, StageBadge, TagBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { RoundCheck } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { setTaskCompleted } from "@/store/actions/tasks";
import { getUsers, indexes, taskKey } from "@/store/selectors";
import { useWorkspace } from "@/store/hooks";
import type { Task } from "@/types";

export interface TaskGroup {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  onAdd?: () => void;
}

const GRID = "md:grid md:grid-cols-[minmax(0,1fr)_140px_110px_100px_90px] md:items-center md:gap-4";

export function TaskListView({ groups, showProject, showStage }: { groups: TaskGroup[]; showProject?: boolean; showStage?: boolean }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const total = groups.reduce((sum, g) => sum + g.tasks.length, 0);

  if (total === 0 && groups.every((g) => !g.onAdd)) {
    return <EmptyState icon={SearchX} title="No tasks match" description="Try a different search or clear some filters." />;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const isCollapsed = collapsed.has(group.id);
        return (
          <section key={group.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <button
              type="button"
              aria-expanded={!isCollapsed}
              onClick={() =>
                setCollapsed((prev) => {
                  const next = new Set(prev);
                  if (next.has(group.id)) next.delete(group.id);
                  else next.add(group.id);
                  return next;
                })
              }
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-muted/50"
            >
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isCollapsed && "-rotate-90")} />
              <span className="size-2.5 rounded-full" style={{ backgroundColor: group.color }} />
              <span className="text-sm font-semibold">{group.title}</span>
              <span className="rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">{group.tasks.length}</span>
            </button>
            {!isCollapsed && (
              <>
                <div className={cn("hidden border-y border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground", GRID)}>
                  <span className="pl-8">Task</span>
                  <span>Assignees</span>
                  <span>Due date</span>
                  <span>Priority</span>
                  <span>{showStage ? "Stage" : "Activity"}</span>
                </div>
                <ul className="divide-y divide-border">
                  {group.tasks.map((task) => (
                    <TaskRow key={task.id} task={task} showProject={showProject} showStage={showStage} />
                  ))}
                  {group.tasks.length === 0 && <li className="px-4 py-4 text-sm text-muted-foreground">No tasks</li>}
                </ul>
                {group.onAdd && (
                  <button
                    type="button"
                    onClick={group.onAdd}
                    className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-primary"
                  >
                    <Plus className="size-4" /> Add task
                  </button>
                )}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

function TaskRow({ task, showProject, showStage }: { task: Task; showProject?: boolean; showStage?: boolean }) {
  const state = useWorkspace();
  const { openTask } = useUI();
  const idx = indexes(state);
  const stage = idx.stages.get(task.stageId);
  const project = idx.projects.get(task.projectId);
  const done = stage?.isCompleted ?? false;
  const comments = idx.commentCount.get(task.id) ?? 0;
  const files = idx.attachmentCount.get(task.id) ?? 0;

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => openTask(task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTask(task.id);
        }
      }}
      className={cn("flex cursor-pointer flex-col gap-2 px-4 py-3 transition hover:bg-lavender", GRID)}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5">
          <RoundCheck
            checked={done}
            label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
            onCheckedChange={(checked) => {
              const stageName = setTaskCompleted(task.id, checked);
              if (stageName) toast.success(checked ? `Completed — moved to ${stageName}` : `Reopened — moved to ${stageName}`);
              else toast.error("This project has no completed stage configured");
            }}
          />
        </span>
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>{task.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono">{taskKey(state, task)}</span>
            {showProject && project && (
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                {project.name}
              </span>
            )}
            {task.tags.slice(0, 2).map((t) => (
              <TagBadge key={t} tag={t} className="h-5 px-2 text-[11px]" />
            ))}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 pl-8 md:contents">
        <AvatarStack users={getUsers(state, task.assigneeIds)} max={3} size="sm" />
        <DueDate date={task.dueDate} completed={done} />
        <span>
          <PriorityBadge priority={task.priority} />
        </span>
        {showStage && stage ? (
          <span className="min-w-0 truncate">
            <StageBadge name={stage.name} color={stage.color} />
          </span>
        ) : (
          <span className="flex items-center gap-2.5 text-xs text-subtle">
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3.5" /> {comments}
            </span>
            <span className="inline-flex items-center gap-1">
              <Paperclip className="size-3.5" /> {files}
            </span>
          </span>
        )}
      </div>
    </li>
  );
}
