"use client";

import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserAvatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatRelative } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { clearNotifications, markAllNotificationsRead, markNotificationRead } from "@/store/actions/settings";
import { indexes } from "@/store/selectors";
import { useAppState } from "@/store/hooks";

export function NotificationsMenu() {
  const state = useAppState();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const users = indexes(state).users;
  const unread = state.notifications.filter((n) => !n.read).length;
  const list = tab === "unread" ? state.notifications.filter((n) => !n.read) : state.notifications;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
          className="relative grid size-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-4.5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-background">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(380px,calc(100vw-1rem))] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-semibold">Notifications</p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAllNotificationsRead} disabled={!unread}>
              <CheckCheck className="size-3.5" /> Mark all read
            </Button>
          </div>
        </div>
        <div className="flex gap-1 px-4 pt-2">
          {(["all", "unread"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium capitalize",
                tab === t ? "bg-primary-light text-primary" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t} {t === "unread" && unread > 0 && `(${unread})`}
            </button>
          ))}
        </div>
        <ul className="scrollbar-thin max-h-96 overflow-y-auto p-2">
          {list.length === 0 && (
            <li className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
              <BellOff className="size-6 text-subtle" />
              You&apos;re all caught up
            </li>
          )}
          {list.map((n) => {
            const actor = users.get(n.actorId);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    markNotificationRead(n.id);
                    setOpen(false);
                    router.push(n.href);
                  }}
                  className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-muted"
                >
                  <UserAvatar user={actor} size="md" />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold">{actor?.name ?? "Someone"}</span>{" "}
                    <span className="text-muted-foreground">{n.message}</span>
                    <span className="mt-0.5 block text-xs text-subtle">{formatRelative(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                </button>
              </li>
            );
          })}
        </ul>
        {state.notifications.length > 0 && (
          <div className="border-t border-border p-2 text-center">
            <Button variant="ghost" size="sm" className="text-xs" onClick={clearNotifications}>
              Clear all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
