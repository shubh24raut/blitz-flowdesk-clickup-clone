"use client";

import { toast } from "sonner";
import { WEEKDAYS } from "@/constants";
import { cn } from "@/lib/utils";
import { setWorkingDays } from "@/store/actions/time-off";
import { useWorkspace } from "@/store/hooks";

/** Toggles the active organization's working days. Shared by Time Off policies and workspace settings. */
export function WorkingWeekEditor({ readOnly }: { readOnly?: boolean }) {
  const { organization: org } = useWorkspace();

  function toggleDay(day: number) {
    const next = org.workingDays.includes(day) ? org.workingDays.filter((d) => d !== day) : [...org.workingDays, day];
    if (next.length === 0) {
      toast.error("Keep at least one working day");
      return;
    }
    const result = setWorkingDays(next);
    if (!result.ok) toast.error(result.error);
  }

  return (
    <div role="group" aria-label="Working days" className="flex flex-wrap gap-2">
      {WEEKDAYS.map((d) => {
        const on = org.workingDays.includes(d.value);
        return (
          <button
            key={d.value}
            type="button"
            aria-pressed={on}
            aria-label={d.long}
            disabled={readOnly}
            onClick={() => toggleDay(d.value)}
            className={cn(
              "h-9 w-14 rounded-lg border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
              on ? "border-primary bg-primary-light text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {d.short}
          </button>
        );
      })}
    </div>
  );
}
