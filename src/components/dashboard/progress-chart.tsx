"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Phase } from "@/store/selectors";

export const PHASE_COLORS: Record<Phase, string> = {
  Done: "#22C55E",
  "In Progress": "#3B82F6",
  Review: "#F59E0B",
  "To Do": "#94A3B8",
};

export interface PhaseDatum {
  phase: Phase;
  count: number;
}

/** Donut of tasks by phase with a direct-labelled legend (count + share). */
export function ProgressChart({ data }: { data: PhaseDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={total ? data : [{ phase: "To Do", count: 1 }]}
              dataKey="count"
              nameKey="phase"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={total ? 2 : 0}
              cornerRadius={4}
              stroke="var(--card)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {(total ? data : [{ phase: "To Do" as Phase, count: 1 }]).map((d) => (
                <Cell key={d.phase} fill={total ? PHASE_COLORS[d.phase] : "var(--muted)"} />
              ))}
            </Pie>
            {total > 0 && (
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  const item = payload?.[0]?.payload as PhaseDatum | undefined;
                  if (!active || !item) return null;
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-raised">
                      <p className="flex items-center gap-1.5 font-medium">
                        <span className="size-2 rounded-full" style={{ backgroundColor: PHASE_COLORS[item.phase] }} />
                        {item.phase}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {item.count} tasks · {Math.round((item.count / total) * 100)}%
                      </p>
                    </div>
                  );
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-3xl font-bold leading-none">{total}</p>
            <p className="mt-1 text-xs text-muted-foreground">Tasks</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-3 sm:w-auto sm:min-w-44">
        {data.map((d) => (
          <li key={d.phase} className="flex items-center gap-3 text-sm">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: PHASE_COLORS[d.phase] }} />
            <span className="flex-1 text-muted-foreground">{d.phase}</span>
            <span className="font-semibold tabular-nums">{d.count}</span>
            <span className="w-11 text-right text-xs tabular-nums text-muted-foreground">
              ({total ? Math.round((d.count / total) * 100) : 0}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
