"use client";

import { toast } from "sonner";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { pluralize } from "@/lib/utils";
import { deleteStage } from "@/services/stages";
import { getProjectStages, getStageTasks } from "@/store/selectors";
import { useAppState } from "@/store/hooks";
import type { Stage } from "@/types";

export function DeleteStageDialog({ stage, onOpenChange }: { stage: Stage | null; onOpenChange: (open: boolean) => void }) {
  return (
    <>{stage && <DeleteStageDialogInner key={stage.id} stage={stage} onOpenChange={onOpenChange} />}</>
  );
}

function DeleteStageDialogInner({ stage, onOpenChange }: { stage: Stage; onOpenChange: (open: boolean) => void }) {
  const state = useAppState();
  const others = getProjectStages(state, stage.projectId).filter((s) => s.id !== stage.id);
  const taskCount = getStageTasks(state, stage.id).length;
  // Default to the neighbouring stage so tasks stay roughly where they were in the flow.
  const neighbour = others.find((s) => s.order === stage.order - 1) ?? others[0];
  const [target, setTarget] = useState(neighbour?.id ?? "");
  const isLast = others.length === 0;

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title={`Delete “${stage.name}”?`}
      description={
        isLast
          ? "A project needs at least one stage. Add another stage before deleting this one."
          : taskCount > 0
            ? `${pluralize(taskCount, "task")} currently belong${taskCount === 1 ? "s" : ""} to this stage.`
            : "This stage is empty and will be removed from the workflow."
      }
      confirmLabel="Delete Stage"
      confirmDisabled={isLast || (taskCount > 0 && !target)}
      onConfirm={() => {
        const targetStage = others.find((s) => s.id === target);
        deleteStage(stage.id, taskCount > 0 ? target : null);
        toast.success(
          taskCount > 0 && targetStage
            ? `Stage deleted — ${pluralize(taskCount, "task")} moved to ${targetStage.name}`
            : "Stage deleted",
        );
      }}
    >
      {!isLast && taskCount > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="move-target">Move tasks to</Label>
          <NativeSelect id="move-target" value={target} onChange={(e) => setTarget(e.target.value)}>
            {others.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.isCompleted ? " (completed)" : ""}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}
    </ConfirmDialog>
  );
}
