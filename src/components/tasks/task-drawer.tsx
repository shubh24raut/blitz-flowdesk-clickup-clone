"use client";

import { FileQuestion, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/store/hooks";
import type { ID } from "@/types";
import { TaskDetail } from "./task-detail";

/**
 * Right-side drawer on desktop (expandable), full-screen sheet on phones.
 */
export function TaskDrawer({ taskId, onClose }: { taskId: ID | null; onClose: () => void }) {
  const state = useWorkspace();
  const task = taskId ? state.tasks.find((t) => t.id === taskId) : undefined;
  const [expanded, setExpanded] = useState(false);

  return (
    <DialogPrimitive.Root open={taskId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/30 data-[state=open]:animate-fade-in md:backdrop-blur-[1px]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => {
            // First Escape leaves an inline editor; only a second one closes the drawer.
            const el = document.activeElement;
            if (el instanceof HTMLElement && (el.matches("input, textarea, select") || el.isContentEditable)) {
              e.preventDefault();
              el.blur();
            }
          }}
          className={cn(
            "fixed inset-0 z-50 flex flex-col bg-popover shadow-overlay outline-none data-[state=open]:animate-slide-in-bottom",
            "md:inset-y-2 md:left-auto md:right-2 md:rounded-2xl md:border md:border-border md:data-[state=open]:animate-slide-in-right",
            "md:w-[640px] md:transition-[width] md:duration-300",
            expanded && "md:w-[min(1080px,calc(100vw-1rem))]",
          )}
        >
          {task ? (
            <TaskDetail key={task.id} task={task} expanded={expanded} onToggleExpand={() => setExpanded((v) => !v)} onClose={onClose} />
          ) : (
            <>
              <DialogPrimitive.Title className="sr-only">Task not found</DialogPrimitive.Title>
              <div className="flex justify-end p-3">
                <DialogPrimitive.Close className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close">
                  <X className="size-5" />
                </DialogPrimitive.Close>
              </div>
              <EmptyState
                icon={FileQuestion}
                title="Task not found"
                description="It may have been deleted, or the link is no longer valid."
                action={<Button variant="secondary" onClick={onClose}>Close</Button>}
              />
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
