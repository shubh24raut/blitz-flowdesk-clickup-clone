"use client";

import { useUI } from "@/components/providers/ui-provider";
import { cn, withAlpha } from "@/lib/utils";
import type { Stage, Task } from "@/types";

export function CalendarTaskChip({ task, stage, className }: { task: Task; stage?: Stage; className?: string }) {
  const { openTask } = useUI();
  const color = stage?.color ?? "#94A3B8";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openTask(task.id);
      }}
      title={`${task.title}${stage ? ` · ${stage.name}` : ""}`}
      className={cn(
        "block w-full truncate rounded-md border-l-[3px] px-1.5 py-0.5 text-left text-[11px] font-medium text-foreground/85 transition hover:brightness-95",
        stage?.isCompleted && "text-muted-foreground line-through",
        className,
      )}
      style={{ backgroundColor: withAlpha(color, 0.16), borderLeftColor: color }}
    >
      {task.title}
    </button>
  );
}
