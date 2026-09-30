"use client";

import { formatShort } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/store/hooks";
import { skippedDaysFor } from "@/store/selectors";
import type { DateKey, ID } from "@/types";

/**
 * "Not counted: 2 weekend days, Gandhi Jayanti (Oct 2)" — explains why a leave range
 * is shorter than its calendar length. Uses the requester's holiday calendar, not the viewer's.
 */
export function SkippedDaysNote({
  userId,
  start,
  end,
  className,
}: {
  userId: ID;
  start: DateKey;
  end: DateKey;
  className?: string;
}) {
  const state = useWorkspace();
  const { weekendDays, holidays } = skippedDaysFor(state, userId, { start, end });
  const parts = [
    weekendDays > 0 && `${weekendDays} weekend ${weekendDays === 1 ? "day" : "days"}`,
    ...holidays.map((h) => `${h.name} (${formatShort(h.date)})`),
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return <span className={cn("block text-xs text-muted-foreground", className)}>Not counted: {parts.join(", ")}</span>;
}
