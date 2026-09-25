import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CLIENT_STATUS_STYLES, PRIORITY_STYLES, PROJECT_STATUS_STYLES, tagTone } from "@/lib/constants";
import { dueTone, formatShort } from "@/lib/dates";
import { cn, withAlpha } from "@/lib/utils";
import type { ClientStatus, Priority, ProjectStatus } from "@/types";

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const style = PRIORITY_STYLES[priority];
  return (
    <Badge className={cn(style.badge, className)}>
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {priority}
    </Badge>
  );
}

export function TagBadge({ tag, className }: { tag: string; className?: string }) {
  return <Badge className={cn(tagTone(tag), className)}>{tag}</Badge>;
}

export function StageBadge({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <Badge className={cn("font-medium", className)} style={{ backgroundColor: withAlpha(color, 0.14), color }}>
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-foreground/80">{name}</span>
    </Badge>
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <Badge className={CLIENT_STATUS_STYLES[status]}>{status}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge className={PROJECT_STATUS_STYLES[status]}>{status}</Badge>;
}

export function DueDate({
  date,
  completed,
  className,
  icon = true,
}: {
  date: string | null;
  completed?: boolean;
  className?: string;
  icon?: boolean;
}) {
  if (!date) return <span className={cn("text-xs text-subtle", className)}>No date</span>;
  const tone = dueTone(date, completed);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-xs",
        tone === "overdue" ? "font-medium text-red-500" : tone === "soon" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
        className,
      )}
    >
      {icon && <CalendarDays className="size-3.5" />}
      {formatShort(date)}
    </span>
  );
}
