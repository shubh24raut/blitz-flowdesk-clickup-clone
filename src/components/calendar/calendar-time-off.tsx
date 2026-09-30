"use client";

import { PartyPopper } from "lucide-react";
import { useMemo } from "react";
import { AvatarStack } from "@/components/shared/avatar";
import { eachDateKey, toDateKey } from "@/lib/time-off";
import { cn } from "@/lib/utils";
import { useAppState, useCurrentUser } from "@/store/hooks";
import { holidaysFor, indexes } from "@/store/selectors";
import type { Holiday, User } from "@/types";

export interface DayTimeOff {
  holidays: Holiday[];
  out: User[];
}

const EMPTY: DayTimeOff = { holidays: [], out: [] };

/** Holidays on the viewer's calendar and teammates on approved leave, looked up by day. */
export function useCalendarTimeOff(): (day: Date) => DayTimeOff {
  const state = useAppState();
  const me = useCurrentUser();
  const byDay = useMemo(() => {
    const map = new Map<string, DayTimeOff>();
    const entry = (key: string) => {
      let e = map.get(key);
      if (!e) map.set(key, (e = { holidays: [], out: [] }));
      return e;
    };
    for (const h of holidaysFor(state, me.id)) entry(h.date).holidays.push(h);
    const users = indexes(state).users;
    for (const r of state.leaveRequests) {
      if (r.status !== "Approved") continue;
      const user = users.get(r.userId);
      if (!user) continue;
      for (const key of eachDateKey(r.startDate, r.endDate)) entry(key).out.push(user);
    }
    return map;
  }, [state, me.id]);
  return (day) => byDay.get(toDateKey(day)) ?? EMPTY;
}

/** A day off (not an optional holiday) — used to tint calendar cells. */
export function isDayOff(timeOff: DayTimeOff): boolean {
  return timeOff.holidays.some((h) => h.kind !== "optional");
}

export function TimeOffMarkers({ timeOff, className }: { timeOff: DayTimeOff; className?: string }) {
  if (timeOff.holidays.length === 0 && timeOff.out.length === 0) return null;
  return (
    <div className={cn("space-y-1", className)}>
      {timeOff.holidays.map((h) => (
        <p
          key={h.id}
          title={h.name}
          className={cn(
            "flex items-center gap-1 truncate text-[11px] font-medium",
            h.kind === "optional" ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400",
          )}
        >
          <PartyPopper className="size-3 shrink-0" />
          <span className="truncate">{h.name}</span>
        </p>
      ))}
      {timeOff.out.length > 0 && (
        <div className="flex items-center gap-1.5" aria-label={`On leave: ${timeOff.out.map((u) => u.name).join(", ")}`}>
          <AvatarStack users={timeOff.out} max={3} size="xs" />
          <span className="text-[10px] text-muted-foreground">off</span>
        </div>
      )}
    </div>
  );
}
