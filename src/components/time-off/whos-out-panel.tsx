"use client";

import { addDays, format, isToday } from "date-fns";
import { Palmtree, Sun } from "lucide-react";
import { UserAvatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { fromDateKey, toDateKey } from "@/lib/time-off";
import { cn } from "@/lib/utils";
import { useAppState } from "@/store/hooks";
import { approvedLeaveOn, indexes } from "@/store/selectors";
import { LeaveRequestItem } from "./leave-request-item";

const HORIZON_DAYS = 14;

/** Team availability: a two-week strip plus everyone's approved leave in the next 60 days. */
export function WhosOutPanel() {
  const state = useAppState();
  const idx = indexes(state);
  const today = new Date();
  const todayKey = toDateKey(today);
  const days = Array.from({ length: HORIZON_DAYS }, (_, i) => toDateKey(addDays(today, i)));
  const upcoming = state.leaveRequests
    .filter((r) => r.status === "Approved" && r.endDate >= todayKey && r.startDate <= toDateKey(addDays(today, 60)))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const companyHolidays = new Map(state.holidays.filter((h) => h.calendarId === null).map((h) => [h.date, h.name]));

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5">
        <h2 className="font-semibold">Next two weeks</h2>
        <div className="scrollbar-thin -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {days.map((key) => {
            const date = fromDateKey(key);
            const out = approvedLeaveOn(state, key);
            const weekend = !state.organization.workingDays.includes(date.getDay());
            const holiday = companyHolidays.get(key);
            return (
              <div
                key={key}
                className={cn(
                  "flex w-24 shrink-0 flex-col rounded-xl border border-border p-2.5",
                  isToday(date) && "border-primary/40 ring-3 ring-primary/10",
                  (weekend || holiday) && "bg-muted/50",
                )}
              >
                <p className="text-[11px] text-muted-foreground">{format(date, "EEE")}</p>
                <p className={cn("text-lg font-bold leading-tight", isToday(date) && "text-primary")}>{format(date, "d")}</p>
                <div className="mt-2 flex min-h-6 flex-wrap gap-1">
                  {holiday ? (
                    <span title={holiday} className="truncate text-[11px] font-medium text-primary">
                      {holiday}
                    </span>
                  ) : weekend ? (
                    <span className="text-[11px] text-subtle">Weekend</span>
                  ) : out.length === 0 ? (
                    <span className="text-[11px] text-subtle">Everyone in</span>
                  ) : (
                    out.map((r) => {
                      const user = idx.users.get(r.userId);
                      return <UserAvatar key={r.id} user={user} size="xs" withTooltip />;
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="font-semibold">Upcoming leave</h2>
        {upcoming.length === 0 ? (
          <EmptyState compact icon={Sun} title="Nobody is away" description="Approved leave for the next 60 days shows up here." />
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {upcoming.map((r) => (
              <LeaveRequestItem
                key={r.id}
                request={r}
                showUser
                showStatus={false}
                actions={
                  r.startDate <= todayKey && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <Palmtree className="size-3.5" /> Out now
                    </span>
                  )
                }
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
