"use client";

import { MessageSquareQuote } from "lucide-react";
import type { ReactNode } from "react";
import { UserAvatar } from "@/components/shared/avatar";
import { Badge } from "@/components/ui/badge";
import { LEAVE_STATUS_STYLES } from "@/constants";
import { formatShort } from "@/lib/dates";
import { formatDays } from "@/lib/time-off";
import { cn } from "@/lib/utils";
import { useAppState } from "@/store/hooks";
import { indexes } from "@/store/selectors";
import type { LeaveRequest } from "@/types";
import { SkippedDaysNote } from "./skipped-days-note";

export function formatLeaveRange(request: Pick<LeaveRequest, "startDate" | "endDate">): string {
  return request.startDate === request.endDate
    ? formatShort(request.startDate)
    : `${formatShort(request.startDate)} – ${formatShort(request.endDate)}`;
}

export function LeaveRequestItem({
  request,
  showUser,
  showStatus = true,
  actions,
  onOpen,
  className,
}: {
  request: LeaveRequest;
  /** Makes the row's summary a button that opens the request's details. */
  onOpen?: () => void;
  showUser?: boolean;
  showStatus?: boolean;
  actions?: ReactNode;
  className?: string;
}) {
  const state = useAppState();
  const idx = indexes(state);
  const user = idx.users.get(request.userId);
  const type = state.leaveTypes.find((t) => t.id === request.typeId);
  const reviewer = request.reviewerId ? idx.users.get(request.reviewerId) : undefined;

  return (
    <li className={cn("flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center", className)}>
      <Summary onOpen={onOpen}>
        {showUser ? (
          <UserAvatar user={user} size="md" />
        ) : (
          <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: type?.color ?? "#94A3B8" }} />
        )}
        <span className="block min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {showUser && <span className="font-semibold">{user?.name ?? "Former member"}</span>}
            <span className={cn(!showUser && "font-semibold")}>{formatLeaveRange(request)}</span>
            <span className="text-muted-foreground">
              · {request.halfDay ? "Half day" : formatDays(request.days)}
            </span>
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {showUser && <span className="size-2 rounded-full" style={{ backgroundColor: type?.color ?? "#94A3B8" }} />}
            {type?.name ?? "Deleted leave type"}
            {request.reason && <span className="truncate">— {request.reason}</span>}
          </span>
          {request.startDate !== request.endDate && (
            <SkippedDaysNote userId={request.userId} start={request.startDate} end={request.endDate} className="mt-0.5" />
          )}
          {(request.reviewNote || (reviewer && request.status !== "Pending")) && (
            <span className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
              <MessageSquareQuote className="mt-px size-3.5 shrink-0" />
              <span>
                {reviewer && `${request.status} by ${reviewer.name}`}
                {reviewer && request.reviewNote && ": "}
                {request.reviewNote && <span className="italic">“{request.reviewNote}”</span>}
              </span>
            </span>
          )}
        </span>
      </Summary>
      <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
        {showStatus && <Badge className={LEAVE_STATUS_STYLES[request.status]}>{request.status}</Badge>}
        {actions}
      </div>
    </li>
  );
}

function Summary({ onOpen, children }: { onOpen?: () => void; children: ReactNode }) {
  const className = "flex min-w-0 flex-1 items-start gap-3 text-left";
  if (!onOpen) return <div className={className}>{children}</div>;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(className, "-m-1.5 rounded-lg p-1.5 outline-none transition hover:bg-lavender focus-visible:ring-2 focus-visible:ring-primary/40")}
    >
      {children}
    </button>
  );
}
