import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  hintTone = "neutral",
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string;
  hint: string;
  hintTone?: "neutral" | "good" | "bad";
  icon: LucideIcon;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-raised sm:p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-primary-light text-primary transition group-hover:bg-primary group-hover:text-white">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <p
        className={cn(
          "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          hintTone === "good" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
          hintTone === "bad" && "bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-400",
          hintTone === "neutral" && "px-0 text-muted-foreground",
        )}
      >
        {hint}
      </p>
    </Link>
  );
}
