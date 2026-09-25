"use client";

interface Entry {
  name?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
  payload?: { fill?: string };
}

/** Shared Recharts tooltip body in FlowDesk styling. */
export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: readonly Entry[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-raised">
      {label !== undefined && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.payload?.fill ?? p.color }} />
          {p.name}: <span className="font-semibold text-foreground">{String(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export const AXIS_PROPS = {
  tick: { fontSize: 12, fill: "var(--muted-foreground)" },
  axisLine: false,
  tickLine: false,
} as const;
