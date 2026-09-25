import { ArrowRight } from "lucide-react";
import { formatRelative } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Activity, User } from "@/types";
import { UserAvatar } from "./avatar";

export function ActivityItem({
  activity,
  actor,
  isMe,
  compact,
  onTargetClick,
}: {
  activity: Activity;
  actor: User | undefined;
  isMe?: boolean;
  compact?: boolean;
  onTargetClick?: () => void;
}) {
  const target = activity.target ? (
    onTargetClick ? (
      <button type="button" onClick={onTargetClick} className="font-medium text-foreground hover:text-primary hover:underline">
        “{activity.target}”
      </button>
    ) : (
      <span className="font-medium text-foreground">“{activity.target}”</span>
    )
  ) : null;

  return (
    <div className={cn("flex gap-3", compact ? "items-center" : "items-start")}>
      <UserAvatar user={actor} size={compact ? "md" : "md"} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm text-muted-foreground", compact && "truncate")}>
          <span className="font-semibold text-foreground">{isMe ? "You" : (actor?.name ?? "Someone")}</span> {activity.action}{" "}
          {target}
        </p>
        {!compact && (activity.from || activity.to) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            {activity.from && <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground line-through decoration-subtle/60">{activity.from}</span>}
            {activity.from && activity.to && <ArrowRight className="size-3 text-subtle" />}
            {activity.to && <span className="rounded-md bg-primary-light px-2 py-0.5 font-medium text-primary">{activity.to}</span>}
          </div>
        )}
        {!compact && <p className="mt-1 text-xs text-subtle">{formatRelative(activity.createdAt)}</p>}
      </div>
      {compact && <span className="shrink-0 text-xs text-subtle">{formatRelative(activity.createdAt)}</span>}
    </div>
  );
}
