"use client";

import { ArrowLeft, Check, Ellipsis, LogOut, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useUI } from "@/components/providers/ui-provider";
import { PageHeader } from "@/components/shared/page-header";
import { DeleteWorkspaceDialog } from "@/components/workspace/delete-workspace-dialog";
import { EditWorkspaceDialog } from "@/components/workspace/edit-workspace-dialog";
import { LeaveWorkspaceDialog } from "@/components/workspace/leave-workspace-dialog";
import { OrganizationAvatar } from "@/components/workspace/organization-avatar";
import { useSwitchWorkspace } from "@/components/workspace/use-switch-workspace";
import { WORKSPACE_URL_PREFIX } from "@/components/workspace/workspace-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canDeleteOrganization, canEditOrganization } from "@/lib/organizations";
import { cn } from "@/lib/utils";
import { useRootState, useWorkspace } from "@/store/hooks";
import { getOrganizationMembers, getOrganizationProjects, getUserWorkspaces } from "@/store/selectors";
import type { Organization, Role } from "@/types";

const ROLE_STYLES: Record<Role, string> = {
  Owner: "bg-primary text-white",
  Admin: "bg-primary-light text-primary",
  Member: "bg-muted text-muted-foreground",
};

/** Every workspace the signed-in user belongs to, with what their role there allows. */
export default function WorkspacesPage() {
  const root = useRootState();
  const { organization: active } = useWorkspace();
  const { openCreateWorkspace } = useUI();
  const switchTo = useSwitchWorkspace();
  const [editing, setEditing] = useState<Organization | null>(null);
  const [leaving, setLeaving] = useState<Organization | null>(null);
  const [deleting, setDeleting] = useState<Organization | null>(null);

  const workspaces = getUserWorkspaces(root).map(({ organization, membership }) => ({
    organization,
    membership,
    members: getOrganizationMembers(root, organization.id).filter((m) => m.status !== "Inactive").length,
    projects: getOrganizationProjects(root, organization.id).filter((p) => p.status !== "Archived").length,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Settings
        </Link>
        <PageHeader
          className="mt-2"
          title="Your workspaces"
          description="Each workspace has its own clients, projects, team and time off."
          actions={
            <Button onClick={openCreateWorkspace}>
              <Plus /> Create workspace
            </Button>
          }
        />
      </div>

      <ul className="space-y-3">
        {workspaces.map(({ organization: org, membership, members, projects }) => {
          const isActive = org.id === active.id;
          const canEdit = canEditOrganization(membership).ok;
          const canDelete = canDeleteOrganization(membership).ok;
          return (
            <li key={org.id}>
              <Card className={cn("flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5", isActive && "border-primary/40 ring-3 ring-primary/10")}>
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <OrganizationAvatar organization={org} size="lg" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2">
                      <span className="truncate font-semibold">{org.name}</span>
                      {isActive && (
                        <Badge className="h-5 bg-primary-light px-2 text-[11px] text-primary">
                          <Check className="size-3" /> Current
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {WORKSPACE_URL_PREFIX}
                      {org.slug}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge className={cn("h-5 px-2 text-[11px]", ROLE_STYLES[membership.role])}>{membership.role}</Badge>
                      {members} {members === 1 ? "member" : "members"} · {projects} {projects === 1 ? "project" : "projects"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0">
                  <Button
                    variant={isActive ? "secondary" : "primary"}
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => switchTo(org.id, { to: "/dashboard" })}
                  >
                    {isActive ? "Go to dashboard" : "Open"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${org.name}`}>
                        <Ellipsis className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {canEdit && (
                        <DropdownMenuItem onSelect={() => setEditing(org)}>
                          <Pencil /> Rename or change logo
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => switchTo(org.id, { to: "/settings?tab=organization", silent: isActive })}>
                        <Settings /> Workspace settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onSelect={() => setLeaving(org)}>
                        <LogOut /> Leave workspace
                      </DropdownMenuItem>
                      {canDelete && (
                        <DropdownMenuItem destructive onSelect={() => setDeleting(org)}>
                          <Trash2 /> Delete workspace
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <EditWorkspaceDialog organization={editing} onOpenChange={(open) => !open && setEditing(null)} />
      <LeaveWorkspaceDialog organization={leaving} onOpenChange={(open) => !open && setLeaving(null)} />
      <DeleteWorkspaceDialog organization={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </div>
  );
}
