/* eslint-disable @next/next/no-img-element -- avatars may be local data URLs */
import { cn, initials, withAlpha } from "@/lib/utils";
import type { User } from "@/types";
import { Tooltip } from "@/components/ui/tooltip";

const SIZES = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-16 text-lg",
};

export function UserAvatar({
  user,
  size = "md",
  className,
  withTooltip,
}: {
  user: Pick<User, "name" | "color" | "avatarUrl"> | undefined;
  size?: keyof typeof SIZES;
  className?: string;
  withTooltip?: boolean;
}) {
  if (!user) {
    return <span className={cn("inline-block shrink-0 rounded-full bg-muted", SIZES[size], className)} aria-hidden />;
  }
  const avatar = user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={user.name}
      className={cn("shrink-0 rounded-full object-cover ring-2 ring-card", SIZES[size], className)}
    />
  ) : (
    <span
      role="img"
      aria-label={user.name}
      className={cn(
        "inline-grid shrink-0 select-none place-items-center rounded-full font-semibold ring-2 ring-card",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: withAlpha(user.color, 0.16), color: user.color }}
    >
      {initials(user.name)}
    </span>
  );
  return withTooltip ? <Tooltip content={user.name}>{avatar}</Tooltip> : avatar;
}

export function AvatarStack({
  users,
  max = 3,
  size = "sm",
  className,
}: {
  users: User[];
  max?: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <div className={cn("flex items-center -space-x-1.5", className)}>
      {shown.map((u) => (
        <UserAvatar key={u.id} user={u} size={size} withTooltip />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            "inline-grid shrink-0 place-items-center rounded-full bg-muted font-semibold text-muted-foreground ring-2 ring-card",
            SIZES[size],
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

/** Colored letter tile used for clients and projects. */
export function LetterTile({
  name,
  color,
  size = "md",
  className,
  solid,
}: {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  solid?: boolean;
}) {
  const sizes = { sm: "size-7 text-xs rounded-lg", md: "size-9 text-sm rounded-xl", lg: "size-12 text-lg rounded-xl", xl: "size-16 text-2xl rounded-2xl" };
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center font-semibold", sizes[size], className)}
      style={solid ? { backgroundColor: color, color: "#fff" } : { backgroundColor: withAlpha(color, 0.14), color }}
    >
      {name.trim()[0]?.toUpperCase() ?? "?"}
    </span>
  );
}
