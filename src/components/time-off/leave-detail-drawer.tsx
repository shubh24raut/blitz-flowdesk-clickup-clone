"use client";

import { format } from "date-fns";
import { Ban, Check, CheckCircle2, CircleDot, FileQuestion, Send, X, XCircle } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AvatarStack, UserAvatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Progress } from "@/components/ui/progress";
import { LEAVE_STATUS_STYLES } from "@/constants";
import { formatLong, formatRelative } from "@/lib/dates";
import { eachDateKey, formatDays, fromDateKey } from "@/lib/time-off";
import { cn } from "@/lib/utils";
import { canCancelLeave, cancelLeave } from "@/store/actions/time-off";
import { useWorkspace, useCurrentUser } from "@/store/hooks";
import { approvedLeaveOn, canReviewLeave, holidaysFor, indexes, isTimeOffAdmin, leaveBalances } from "@/store/selectors";
import type { DateKey, Holiday, LeaveRequest, Member, WorkspaceState } from "@/types";
import { formatLeaveRange } from "./leave-request-item";
import { ReviewLeaveDialog, type ReviewDecision } from "./review-leave-dialog";

/** Right-side drawer on desktop, full-screen sheet on phones — same shell as the task drawer. */
export function LeaveDetailDrawer({ requestId, onClose }: { requestId: string | null; onClose: () => void }) {
  const state = useWorkspace();
  const request = requestId ? state.leaveRequests.find((r) => r.id === requestId) : undefined;

  return (
    <DialogPrimitive.Root open={requestId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/30 data-[state=open]:animate-fade-in md:backdrop-blur-[1px]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-0 z-50 flex flex-col bg-popover shadow-overlay outline-none data-[state=open]:animate-slide-in-bottom",
            "md:inset-y-2 md:left-auto md:right-2 md:w-[520px] md:rounded-2xl md:border md:border-border md:data-[state=open]:animate-slide-in-right",
          )}
        >
          {request ? (
            <LeaveDetail key={request.id} request={request} />
          ) : (
            <>
              <DialogPrimitive.Title className="sr-only">Leave request not found</DialogPrimitive.Title>
              <div className="flex justify-end p-3">
                <DialogPrimitive.Close className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close">
                  <X className="size-5" />
                </DialogPrimitive.Close>
              </div>
              <EmptyState
                icon={FileQuestion}
                title="Leave request not found"
                description="It may have been removed along with its member."
                action={
                  <Button variant="secondary" onClick={onClose}>
                    Close
                  </Button>
                }
              />
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

type DayRow = { key: DateKey; status: "counted" | "weekend" | "holiday"; holiday?: Holiday; othersOut: Member[] };

function buildDays(state: WorkspaceState, request: LeaveRequest): DayRow[] {
  const idx = indexes(state);
  const holidays = new Map(
    holidaysFor(state, request.userId)
      .filter((h) => h.kind !== "optional")
      .map((h) => [h.date, h]),
  );
  return eachDateKey(request.startDate, request.endDate).map((key) => {
    const othersOut = approvedLeaveOn(state, key)
      .filter((r) => r.userId !== request.userId)
      .map((r) => idx.users.get(r.userId))
      .filter((u): u is Member => Boolean(u));
    if (!state.organization.workingDays.includes(fromDateKey(key).getDay())) return { key, status: "weekend", othersOut };
    const holiday = holidays.get(key);
    if (holiday) return { key, status: "holiday", holiday, othersOut };
    return { key, status: "counted", othersOut };
  });
}

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="border-t border-border px-5 py-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function LeaveDetail({ request }: { request: LeaveRequest }) {
  const state = useWorkspace();
  const me = useCurrentUser();
  const idx = indexes(state);
  const user = idx.users.get(request.userId);
  const reviewer = request.reviewerId ? idx.users.get(request.reviewerId) : undefined;
  const type = state.leaveTypes.find((t) => t.id === request.typeId);
  const [reviewing, setReviewing] = useState<ReviewDecision | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const year = Number(request.startDate.slice(0, 4));
  const balance = leaveBalances(state, request.userId, year).find((b) => b.type.id === request.typeId);
  const days = buildDays(state, request);
  const overlapCount = new Set(days.flatMap((d) => d.othersOut.map((u) => u.id))).size;
  const canReview = canReviewLeave(me, request);
  const canCancel = canCancelLeave(request, me.id);
  const isMine = request.userId === me.id;

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pb-4 pt-5 sm:px-6">
        <UserAvatar user={user} size="lg" />
        <div className="min-w-0 flex-1">
          <DialogPrimitive.Title className="truncate text-lg font-semibold">
            {isMine ? "Your leave" : `${user?.name ?? "Former member"}'s leave`}
          </DialogPrimitive.Title>
          <p className="truncate text-sm text-muted-foreground">{user?.title}</p>
        </div>
        <Badge className={LEAVE_STATUS_STYLES[request.status]}>{request.status}</Badge>
        <DialogPrimitive.Close className="-mr-2 -mt-1 rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close">
          <X className="size-5" />
        </DialogPrimitive.Close>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pb-4">
        {/* Summary */}
        <div className="mx-5 mb-4 rounded-xl bg-lavender p-4 sm:mx-6">
          <p className="flex items-center gap-2 text-sm font-medium">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: type?.color ?? "#94A3B8" }} />
            {type?.name ?? "Deleted leave type"}
            {type && <span className="text-xs font-normal text-muted-foreground">· {type.paid ? "Paid" : "Unpaid"}</span>}
          </p>
          <p className="mt-2 text-xl font-bold">{formatLeaveRange(request)}</p>
          <p className="text-sm text-muted-foreground">
            {request.halfDay ? "Half day (0.5 days)" : `${formatDays(request.days)} of leave`}
            {days.length > 1 && ` across ${days.length} calendar days`}
          </p>
          {request.reason && <p className="mt-3 whitespace-pre-wrap text-sm">“{request.reason}”</p>}
        </div>

        {/* Balance */}
        {balance && type && (
          <Section title={`${type.name} balance · ${year}`}>
            {balance.remaining === null ? (
              <p className="text-sm text-muted-foreground">
                No yearly limit — {formatDays(balance.used)} taken, {formatDays(balance.pending)} pending.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    ["Allowance", type.allowance],
                    ["Taken", balance.used],
                    ["Pending", balance.pending],
                    ["Left", balance.remaining],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-muted/60 px-2 py-2">
                      <p className={cn("text-lg font-bold tabular-nums", label === "Left" && Number(value) < 0 && "text-red-500")}>{value}</p>
                      <p className="text-[11px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                <Progress
                  className="mt-3"
                  value={type.allowance ? ((balance.used + balance.pending) / type.allowance) * 100 : 0}
                  color={type.color}
                  label={`${type.name} used`}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {request.status === "Pending"
                    ? `${formatDays(balance.remaining)} left after this and other pending requests are approved.`
                    : request.status === "Approved"
                      ? "This leave is included in “Taken”."
                      : "This request doesn't count toward the balance."}
                </p>
              </>
            )}
          </Section>
        )}

        {/* Day by day */}
        <Section
          title="Day by day"
          aside={
            overlapCount > 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {overlapCount} {overlapCount === 1 ? "teammate" : "teammates"} also off
              </span>
            )
          }
        >
          <ul className="divide-y divide-border rounded-xl border border-border">
            {days.map((d) => (
              <li key={d.key} className={cn("flex items-center gap-3 px-3 py-2.5 text-sm", d.status !== "counted" && "bg-muted/40")}>
                <span className="w-24 shrink-0 font-medium tabular-nums">{format(fromDateKey(d.key), "EEE, d MMM")}</span>
                <span className="min-w-0 flex-1 truncate">
                  {d.status === "counted" ? (
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <CheckCircle2 className="size-3.5 text-primary" />
                      {request.halfDay ? "Half day" : "Counted"}
                    </span>
                  ) : d.status === "holiday" ? (
                    <span className="text-emerald-600 dark:text-emerald-400" title={d.holiday?.name}>
                      {d.holiday?.name} · not counted
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Weekend · not counted</span>
                  )}
                </span>
                {d.othersOut.length > 0 && (
                  <span className="flex shrink-0 items-center gap-1.5" aria-label={`Also off: ${d.othersOut.map((u) => u.name).join(", ")}`}>
                    <AvatarStack users={d.othersOut} max={3} size="xs" />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>

        {/* History */}
        <Section title="History">
          <ol className="space-y-3">
            <HistoryItem icon={Send} tone="text-primary" title={`Requested by ${user?.name ?? "a former member"}`} time={request.createdAt} />
            {request.status === "Approved" && !reviewer && (
              <HistoryItem icon={CheckCircle2} tone="text-emerald-500" title="Approved automatically" time={request.reviewedAt} note={`${type?.name ?? "This type"} doesn't need approval.`} />
            )}
            {reviewer && (
              <HistoryItem
                icon={request.status === "Rejected" ? XCircle : CheckCircle2}
                tone={request.status === "Rejected" ? "text-red-500" : "text-emerald-500"}
                title={`${request.status === "Rejected" ? "Rejected" : "Approved"} by ${reviewer.name}`}
                time={request.reviewedAt}
                note={request.reviewNote}
              />
            )}
            {request.status === "Cancelled" && <HistoryItem icon={Ban} tone="text-muted-foreground" title="Cancelled" />}
            {request.status === "Pending" && (
              <HistoryItem icon={CircleDot} tone="text-amber-500" title="Waiting for an owner or admin" note={isMine && isTimeOffAdmin(me) ? "Another owner or admin needs to approve it." : undefined} />
            )}
          </ol>
        </Section>
      </div>

      {(canReview || canCancel) && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3.5 sm:px-6">
          {canCancel && (
            <Button variant="secondary" onClick={() => setConfirmCancel(true)} className="mr-auto">
              Cancel request
            </Button>
          )}
          {canReview && (
            <>
              <Button variant="secondary" onClick={() => setReviewing("Rejected")}>
                <X /> Reject
              </Button>
              <Button onClick={() => setReviewing("Approved")}>
                <Check /> Approve
              </Button>
            </>
          )}
        </div>
      )}

      <ReviewLeaveDialog request={reviewing ? request : null} decision={reviewing ?? "Approved"} onOpenChange={(open) => !open && setReviewing(null)} />
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this leave?"
        description={`${formatLeaveRange(request)} will be returned to the balance.`}
        confirmLabel="Cancel leave"
        onConfirm={() => {
          if (cancelLeave(request.id)) toast.success("Leave cancelled");
        }}
      />
    </>
  );
}

function HistoryItem({
  icon: Icon,
  tone,
  title,
  time,
  note,
}: {
  icon: typeof Send;
  tone: string;
  title: string;
  time?: string | null;
  note?: string;
}) {
  return (
    <li className="flex gap-3">
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone)} />
      <div className="min-w-0 text-sm">
        <p className="font-medium">{title}</p>
        {time && (
          <p className="text-xs text-muted-foreground" title={formatLong(time)}>
            {formatRelative(time)} · {formatLong(time)}
          </p>
        )}
        {note && <p className="mt-1 text-xs italic text-muted-foreground">“{note}”</p>}
      </div>
    </li>
  );
}
