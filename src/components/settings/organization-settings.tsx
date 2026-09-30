"use client";

import { ArrowRight, Info, LogOut, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AvatarStack } from "@/components/shared/avatar";
import { WorkingWeekEditor } from "@/components/time-off/working-week-editor";
import { DeleteWorkspaceDialog } from "@/components/workspace/delete-workspace-dialog";
import { LeaveWorkspaceDialog } from "@/components/workspace/leave-workspace-dialog";
import { OrganizationAvatar } from "@/components/workspace/organization-avatar";
import { WorkspaceForm } from "@/components/workspace/workspace-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { canDeleteOrganization, canEditOrganization } from "@/lib/organizations";
import { wait } from "@/lib/utils";
import { updateOrganization } from "@/store/actions/organizations";
import { setDefaultHolidayCalendar } from "@/store/actions/time-off";
import { useWorkspace } from "@/store/hooks";

const NONE = "__none__";

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

function Section({ title, description, children, aside }: { title: string; description: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-border py-7 first:border-t-0 first:pt-0 last:pb-0 lg:grid-cols-[220px_1fr] lg:gap-8">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {aside}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Settings of the *active* organization. Switching workspace switches what this edits. */
export function OrganizationSettings() {
  const state = useWorkspace();
  const org = state.organization;
  const canEdit = canEditOrganization(state.membership).ok;
  const canDelete = canDeleteOrganization(state.membership).ok;
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const active = state.users.filter((u) => u.status !== "Inactive");
  const owners = state.users.filter((u) => u.role === "Owner");

  return (
    <div>
      <div className="mb-7 flex items-center gap-4">
        <OrganizationAvatar organization={org} size="xl" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{org.name}</p>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge className="bg-primary-light text-primary">{org.plan} plan</Badge>
            {plural(state.users.length, "member")} · {plural(state.projects.length, "project")} · {plural(state.clients.length, "client")}
          </p>
        </div>
      </div>

      {!canEdit && (
        <p className="mb-6 flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" /> You&apos;re a {state.membership?.role ?? "Member"} here. Only owners and admins can change
          workspace settings.
        </p>
      )}

      <Section title="General" description="Name, URL and branding shown across the workspace.">
        <WorkspaceForm
          key={org.id}
          organization={org}
          readOnly={!canEdit}
          idPrefix="org"
          className="max-w-xl"
          onSubmit={async (values) => {
            await wait(300);
            const result = updateOrganization(org.id, values);
            if (!result.ok) return result.error;
            toast.success("Workspace updated");
          }}
        >
          {({ isSubmitting, isDirty }) =>
            canEdit && (
              <div className="mt-5">
                <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                  Save changes
                </Button>
              </div>
            )
          }
        </WorkspaceForm>
      </Section>

      <Section title="Members" description="People with access to this workspace and their roles.">
        <div className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <AvatarStack users={active} max={5} size="md" />
            <div className="text-sm">
              <p className="font-medium">{plural(active.length, "active member")}</p>
              <p className="text-muted-foreground">
                {owners.length} {owners.length === 1 ? "owner" : "owners"} · your role: {state.membership?.role}
              </p>
            </div>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/team">
              Manage members <ArrowRight />
            </Link>
          </Button>
        </div>
      </Section>

      <Section title="Working week" description="Leave is only counted on these days in this workspace.">
        <WorkingWeekEditor readOnly={!canEdit} />
      </Section>

      <Section
        title="Holiday calendar"
        description="Members follow this calendar unless they pick another in Time Off."
        aside={
          canEdit && (
            <Link href="/time-off?tab=policies" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Manage holidays <ArrowRight className="size-3.5" />
            </Link>
          )
        }
      >
        {state.holidayCalendars.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No holiday calendars yet — only company-wide holidays apply. Import one from Time Off → Holidays.
          </p>
        ) : (
          <Select
            className="max-w-xs"
            aria-label="Default holiday calendar"
            disabled={!canEdit}
            value={org.defaultHolidayCalendarId ?? NONE}
            onValueChange={(v) => {
              const result = setDefaultHolidayCalendar(v === NONE ? null : v);
              if (result && !result.ok) toast.error(result.error);
              else toast.success("Default holiday calendar updated");
            }}
            options={[{ value: NONE, label: "None" }, ...state.holidayCalendars.map((c) => ({ value: c.id, label: c.name }))]}
          />
        )}
      </Section>

      <Section title="Danger zone" description="Leaving or deleting affects only this workspace.">
        <div className="divide-y divide-border rounded-xl border border-red-200 dark:border-red-500/30">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Leave workspace</p>
              <p className="text-xs text-muted-foreground">You&apos;ll lose access to {org.name}. Your other workspaces stay as they are.</p>
            </div>
            <Button variant="secondary" onClick={() => setLeaving(true)}>
              <LogOut /> Leave
            </Button>
          </div>
          {canDelete && (
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Delete workspace</p>
                <p className="text-xs text-muted-foreground">Permanently removes all of its clients, projects, tasks and time off.</p>
              </div>
              <Button variant="danger" onClick={() => setDeleting(true)}>
                <Trash2 /> Delete
              </Button>
            </div>
          )}
        </div>
      </Section>

      <LeaveWorkspaceDialog organization={leaving ? org : null} onOpenChange={(open) => !open && setLeaving(false)} />
      <DeleteWorkspaceDialog organization={deleting ? org : null} onOpenChange={(open) => !open && setDeleting(false)} />
    </div>
  );
}
