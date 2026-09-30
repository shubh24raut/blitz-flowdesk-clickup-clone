"use client";

import { Check, ChevronRight, Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { useUI } from "@/components/providers/ui-provider";
import { Dialog, DialogBody, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRootState, useWorkspace } from "@/store/hooks";
import { getUserWorkspaces, unreadNotificationCounts } from "@/store/selectors";
import { OrganizationAvatar } from "./organization-avatar";
import { useSwitchWorkspace } from "./use-switch-workspace";
import { UnreadDot } from "./workspace-switcher";

/** Compact current-workspace row for the top of the mobile "More" sheet. */
export function CurrentWorkspaceButton({ onClick }: { onClick: () => void }) {
  const { organization, membership } = useWorkspace();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Current workspace: ${organization.name}. Switch workspace`}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-card transition active:bg-muted"
    >
      <OrganizationAvatar organization={organization} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-subtle">Workspace</span>
        <span className="block truncate text-sm font-semibold">{organization.name}</span>
      </span>
      <span className="text-xs text-muted-foreground">{membership?.role}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}

/** Phone-sized workspace picker. `DialogContent` renders as a bottom sheet on small screens. */
export function WorkspaceSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const root = useRootState();
  const { organization } = useWorkspace();
  const { openCreateWorkspace } = useUI();
  const switchTo = useSwitchWorkspace();
  const workspaces = getUserWorkspaces(root);
  const unread = unreadNotificationCounts(root);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Workspaces" size="sm">
        <DialogBody className="pb-8">
          <ul role="list" className="space-y-1.5">
            {workspaces.map(({ organization: org, membership }) => {
              const active = org.id === organization.id;
              return (
                <li key={org.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      onOpenChange(false);
                      switchTo(org.id);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition active:bg-muted",
                      active ? "border-primary/30 bg-primary-light" : "border-border bg-card",
                    )}
                  >
                    <OrganizationAvatar organization={org} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{org.name}</span>
                      <span className="block text-xs text-muted-foreground">{membership.role}</span>
                    </span>
                    {!active && <UnreadDot count={unread.get(org.id) ?? 0} />}
                    {active && <Check className="size-5 text-primary" aria-label="Current workspace" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                openCreateWorkspace();
              }}
              className="flex items-center gap-2 rounded-xl border border-border bg-card p-3.5 text-sm font-medium"
            >
              <Plus className="size-5 text-primary" /> Create
            </button>
            <Link
              href="/settings/workspaces"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card p-3.5 text-sm font-medium"
            >
              <Settings2 className="size-5 text-muted-foreground" /> Manage
            </Link>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
