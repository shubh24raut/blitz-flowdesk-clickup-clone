"use client";

import { History } from "lucide-react";
import { useUI } from "@/components/providers/ui-provider";
import { indexes } from "@/store/selectors";
import { useAppState, useCurrentUser } from "@/store/hooks";
import type { Activity } from "@/types";
import { ActivityItem } from "./activity-item";
import { EmptyState } from "./empty-state";

/** Timeline of activity entries with a vertical rail. */
export function ActivityFeed({
  activities,
  emptyText = "Changes to this item will show up here.",
  linkTasks = true,
}: {
  activities: Activity[];
  emptyText?: string;
  linkTasks?: boolean;
}) {
  const state = useAppState();
  const me = useCurrentUser();
  const { openTask } = useUI();
  const users = indexes(state).users;
  const taskIds = new Set(state.tasks.map((t) => t.id));

  if (activities.length === 0) return <EmptyState compact icon={History} title="No activity yet" description={emptyText} />;

  return (
    <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-border">
      {activities.map((a) => (
        <li key={a.id} className="relative">
          <ActivityItem
            activity={a}
            actor={users.get(a.actorId)}
            isMe={a.actorId === me.id}
            onTargetClick={linkTasks && a.taskId && taskIds.has(a.taskId) ? () => openTask(a.taskId!) : undefined}
          />
        </li>
      ))}
    </ol>
  );
}
