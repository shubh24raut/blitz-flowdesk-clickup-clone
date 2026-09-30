"use client";

import { Check, Inbox, X } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWorkspace, useCurrentUser } from "@/store/hooks";
import { canReviewLeave } from "@/store/selectors";
import type { LeaveRequest } from "@/types";
import { LeaveRequestItem } from "./leave-request-item";
import { useLeaveLink } from "./use-leave-link";
import { ReviewLeaveDialog, type ReviewDecision } from "./review-leave-dialog";

export function ApprovalsPanel() {
  const state = useWorkspace();
  const me = useCurrentUser();
  const { openLeave } = useLeaveLink();
  const [reviewing, setReviewing] = useState<{ request: LeaveRequest; decision: ReviewDecision } | null>(null);

  const pending = state.leaveRequests
    .filter((r) => r.status === "Pending")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const decided = state.leaveRequests
    .filter((r) => r.reviewerId && (r.status === "Approved" || r.status === "Rejected"))
    .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""))
    .slice(0, 10);

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5">
        <h2 className="font-semibold">Waiting for approval</h2>
        <p className="text-sm text-muted-foreground">Owners and admins can approve anyone&apos;s request except their own.</p>
        {pending.length === 0 ? (
          <EmptyState compact icon={Inbox} title="All caught up" description="New requests will appear here." />
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {pending.map((r) => (
              <LeaveRequestItem
                key={r.id}
                request={r}
                onOpen={() => openLeave(r.id)}
                showUser
                showStatus={false}
                actions={
                  canReviewLeave(me, r) ? (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => setReviewing({ request: r, decision: "Rejected" })}>
                        <X /> Reject
                      </Button>
                      <Button size="sm" onClick={() => setReviewing({ request: r, decision: "Approved" })}>
                        <Check /> Approve
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Needs another admin</span>
                  )
                }
              />
            ))}
          </ul>
        )}
      </Card>

      {decided.length > 0 && (
        <Card className="p-4 sm:p-5">
          <h2 className="font-semibold">Recent decisions</h2>
          <ul className="mt-2 divide-y divide-border">
            {decided.map((r) => (
              <LeaveRequestItem key={r.id} request={r} onOpen={() => openLeave(r.id)} showUser />
            ))}
          </ul>
        </Card>
      )}

      <ReviewLeaveDialog
        request={reviewing?.request ?? null}
        decision={reviewing?.decision ?? "Approved"}
        onOpenChange={(open) => !open && setReviewing(null)}
      />
    </div>
  );
}
