import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  indicatorClassName,
  color,
  label,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
  color?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-primary-light", className)}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-[width] duration-500", indicatorClassName)}
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}
