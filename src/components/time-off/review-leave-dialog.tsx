"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field, FieldError, Textarea } from "@/components/ui/input";
import { eachDateKey, formatDays } from "@/lib/time-off";
import { reviewLeave } from "@/store/actions/time-off";
import { useWorkspace } from "@/store/hooks";
import { approvedLeaveOn, indexes } from "@/store/selectors";
import type { LeaveRequest } from "@/types";
import { formatLeaveRange } from "./leave-request-item";
import { SkippedDaysNote } from "./skipped-days-note";

export type ReviewDecision = "Approved" | "Rejected";

export function ReviewLeaveDialog({
  request,
  decision,
  onOpenChange,
}: {
  request: LeaveRequest | null;
  decision: ReviewDecision;
  onOpenChange: (open: boolean) => void;
}) {
  const open = request !== null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={decision === "Approved" ? "Approve leave" : "Reject leave"} size="sm">
        {request && <ReviewForm key={request.id} request={request} decision={decision} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ReviewForm({ request, decision, onDone }: { request: LeaveRequest; decision: ReviewDecision; onDone: () => void }) {
  const state = useWorkspace();
  const user = indexes(state).users.get(request.userId);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();

  // Who else is already off during this request — helps spot coverage gaps before approving.
  const othersOut = new Set(
    eachDateKey(request.startDate, request.endDate)
      .flatMap((d) => approvedLeaveOn(state, d))
      .filter((r) => r.userId !== request.userId)
      .map((r) => indexes(state).users.get(r.userId)?.name)
      .filter(Boolean),
  );

  function submit() {
    const result = reviewLeave(request.id, { decision, note: note.trim() });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(`${user?.name ?? "Request"}'s leave ${decision.toLowerCase()}`);
    onDone();
  }

  return (
    <>
      <DialogBody className="space-y-4">
        <div className="rounded-xl bg-lavender px-3.5 py-3 text-sm">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-muted-foreground">
            {formatLeaveRange(request)} · {request.halfDay ? "Half day" : formatDays(request.days)}
          </p>
          <SkippedDaysNote userId={request.userId} start={request.startDate} end={request.endDate} className="mt-0.5" />
          {request.reason && <p className="mt-1 text-muted-foreground">“{request.reason}”</p>}
        </div>
        {othersOut.size > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">Also off during these dates: {[...othersOut].join(", ")}.</p>
        )}
        <Field
          label={decision === "Approved" ? "Note (optional)" : "Reason for rejecting"}
          htmlFor="review-note"
          hint={`${user?.name.split(" ")[0] ?? "They"} will see this note.`}
        >
          <Textarea id="review-note" rows={3} autoFocus value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </Field>
        <FieldError message={error} />
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="button" variant={decision === "Approved" ? "primary" : "danger"} onClick={submit}>
          {decision === "Approved" ? "Approve" : "Reject"}
        </Button>
      </DialogFooter>
    </>
  );
}
