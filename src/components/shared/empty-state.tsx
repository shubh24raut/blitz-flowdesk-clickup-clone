import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-6 py-16", className)}>
      <div className={cn("grid place-items-center rounded-2xl bg-primary-light text-primary", compact ? "size-10" : "size-14")}>
        <Icon className={compact ? "size-5" : "size-6"} />
      </div>
      <h3 className={cn("font-semibold text-foreground", compact ? "mt-3 text-sm" : "mt-4 text-base")}>{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
