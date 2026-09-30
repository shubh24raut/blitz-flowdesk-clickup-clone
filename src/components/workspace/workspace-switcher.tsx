"use client";

import { Check, ChevronsUpDown, Plus, Settings, Settings2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useUI } from "@/components/providers/ui-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isAdminRole } from "@/lib/organizations";
import { cn } from "@/lib/utils";
import { useRootState, useWorkspace } from "@/store/hooks";
import { getUserWorkspaces, unreadNotificationCounts } from "@/store/selectors";
import { OrganizationAvatar } from "./organization-avatar";
import { useSwitchWorkspace } from "./use-switch-workspace";

export function UnreadDot({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <span
      aria-label={`${count} unread notification${count === 1 ? "" : "s"}`}
      className={cn("grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-white", className)}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/**
 * Sidebar workspace switcher. Full row from `lg`, avatar only on the collapsed
 * tablet sidebar; both open the same menu.
 */
export function WorkspaceSwitcher() {
  const root = useRootState();
  const { organization, membership, users } = useWorkspace();
  const { openCreateWorkspace } = useUI();
  const switchTo = useSwitchWorkspace();
  const workspaces = getUserWorkspaces(root);
  const unread = unreadNotificationCounts(root);
  const memberCount = users.filter((u) => u.status !== "Inactive").length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Current workspace: ${organization.name}. Switch workspace`}
          className="group flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card p-1.5 text-left shadow-card outline-none transition hover:border-primary/30 hover:bg-muted focus-visible:ring-3 focus-visible:ring-primary/20 data-[state=open]:border-primary/40 data-[state=open]:bg-muted lg:justify-start lg:p-2"
        >
          <OrganizationAvatar organization={organization} size="md" />
          <span className="hidden min-w-0 flex-1 lg:block">
            <span className="block truncate text-sm font-semibold">{organization.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {membership?.role ?? "Member"} · {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          </span>
          <ChevronsUpDown className="hidden size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground lg:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-72">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <div className="scrollbar-thin max-h-80 overflow-y-auto">
          {workspaces.map(({ organization: org, membership: m }) => {
            const active = org.id === organization.id;
            return (
              <DropdownMenuItem
                key={org.id}
                onSelect={() => switchTo(org.id)}
                aria-current={active ? "true" : undefined}
                className={cn("gap-3 py-2", active && "bg-primary-light/60")}
              >
                <OrganizationAvatar organization={org} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{org.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {m.role}
                    {m.status === "Invited" && " · Invited"}
                  </span>
                </span>
                {!active && <UnreadDot count={unread.get(org.id) ?? 0} />}
                {active && <Check className="text-primary!" aria-label="Current workspace" />}
              </DropdownMenuItem>
            );
          })}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={openCreateWorkspace}>
          <Plus /> Create workspace
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/workspaces">
            <Settings2 /> Manage workspaces
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings?tab=organization">
            <Settings /> {organization.name} settings
          </Link>
        </DropdownMenuItem>
        {isAdminRole(membership?.role) && (
          <DropdownMenuItem asChild>
            <Link href="/team?invite=1">
              <UserPlus /> Invite members
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
