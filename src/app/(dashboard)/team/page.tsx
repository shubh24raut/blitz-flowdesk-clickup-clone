"use client";

import { Ellipsis, Info, LogOut, MailPlus, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { LeaveWorkspaceDialog } from "@/components/workspace/leave-workspace-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { ROLES } from "@/constants";
import { formatLong } from "@/lib/dates";
import { canChangeRole, canManageMember, isAdminRole, LAST_OWNER_MESSAGE } from "@/lib/organizations";
import { toDateKey } from "@/lib/time-off";
import { cn } from "@/lib/utils";
import { removeOrganizationMember, setOrganizationMemberStatus, updateOrganizationMemberRole } from "@/store/actions/team";
import { approvedLeaveOn, isTaskDone, toMembership } from "@/store/selectors";
import { useCurrentUser, useWorkspace } from "@/store/hooks";
import type { Member, MemberStatus, Role } from "@/types";

const STATUS_STYLES: Record<MemberStatus, string> = {
  Active: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  Invited: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  Inactive: "bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-300",
};

const ON_LEAVE_CLASS = "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400";

const ROLE_STYLES: Record<Role, string> = {
  Owner: "bg-primary text-white",
  Admin: "bg-primary-light text-primary",
  Member: "bg-muted text-muted-foreground",
};

function TeamContent() {
  const state = useWorkspace();
  const me = useCurrentUser();
  const params = useSearchParams();
  const router = useRouter();
  const [inviteState, setInviteOpen] = useState(false);
  // `?invite=1` (sidebar "Invite members") opens the dialog even when already on this page.
  const inviteOpen = inviteState || params.get("invite") === "1";
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  const [removing, setRemoving] = useState<Member | null>(null);
  const [leaving, setLeaving] = useState(false);
  // Roles are per workspace: `me.role` is my role in the active organization.
  const canManage = isAdminRole(me.role);
  const outToday = new Set(approvedLeaveOn(state, toDateKey(new Date())).map((r) => r.userId));
  const memberships = useMemo(() => state.users.map(toMembership), [state.users]);

  const stats = useMemo(() => {
    const map = new Map<string, { open: number; done: number; projects: number }>();
    for (const u of state.users) map.set(u.id, { open: 0, done: 0, projects: state.projects.filter((p) => p.memberIds.includes(u.id)).length });
    for (const t of state.tasks) {
      const done = isTaskDone(state, t);
      for (const id of t.assigneeIds) {
        const s = map.get(id);
        if (s) s[done ? "done" : "open"]++;
      }
    }
    return map;
  }, [state]);

  const members = state.users.filter((u) => {
    const q = search.trim().toLowerCase();
    return (role === "all" || u.role === role) && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.title.toLowerCase().includes(q));
  });

  const roleCheck = (user: Member, next: Role) => canChangeRole(state.membership, toMembership(user), next, memberships);
  const manageCheck = (user: Member) => canManageMember(state.membership, toMembership(user), memberships);
  /** Roles I could move this person to, other than the one they have. */
  const roleOptions = (user: Member) => ROLES.filter((r) => r !== user.role && roleCheck(user, r).ok);
  const isLastOwner = (user: Member) => {
    const check = roleCheck(user, "Admin");
    return !check.ok && check.reason === LAST_OWNER_MESSAGE;
  };

  function changeRole(user: Member, next: Role) {
    if (next === user.role) return;
    const result = updateOrganizationMemberRole(user.membershipId, next);
    if (!result.ok) toast.error(result.error);
    else toast.success(`${user.name} is now ${next === "Admin" || next === "Owner" ? "an" : "a"} ${next}`);
  }

  function setStatus(user: Member, status: MemberStatus, message: string) {
    const result = setOrganizationMemberStatus(user.membershipId, status);
    if (!result.ok) toast.error(result.error);
    else toast.success(message);
  }

  function actions(user: Member) {
    const isMe = user.id === me.id;
    const manage = manageCheck(user);
    const disabled = !isMe && roleOptions(user).length === 0 && !manage.ok;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={`Actions for ${user.name}`} disabled={disabled} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30">
            <Ellipsis className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          {canManage && (
            <>
              <DropdownMenuLabel>Role in {state.organization.name}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={user.role} onValueChange={(v) => changeRole(user, v as Role)}>
                {ROLES.map((r) => (
                  <DropdownMenuRadioItem key={r} value={r} disabled={r !== user.role && !roleCheck(user, r).ok}>
                    <ShieldCheck /> {r}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              {isLastOwner(user) && (
                <p className="flex gap-2 px-2.5 pb-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" /> {LAST_OWNER_MESSAGE}
                </p>
              )}
            </>
          )}
          {!isMe && manage.ok && (
            <>
              <DropdownMenuSeparator />
              {user.status === "Invited" && (
                <DropdownMenuItem onSelect={() => toast.success(`Invite re-sent to ${user.email}`)}>
                  <MailPlus /> Resend invite
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => {
                  const next = user.status === "Inactive" ? "Active" : "Inactive";
                  setStatus(user, next, `${user.name} ${next === "Active" ? "reactivated" : "deactivated"}`);
                }}
              >
                <Users /> {user.status === "Inactive" ? "Reactivate" : "Deactivate"}
              </DropdownMenuItem>
              <DropdownMenuItem destructive onSelect={() => setRemoving(user)}>
                <Trash2 /> Remove from workspace
              </DropdownMenuItem>
            </>
          )}
          {isMe && (
            <>
              {canManage && <DropdownMenuSeparator />}
              <DropdownMenuItem destructive onSelect={() => setLeaving(true)}>
                <LogOut /> Leave workspace
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function roleCell(u: Member) {
    const options = roleOptions(u);
    if (options.length === 0) {
      const badge = <Badge className={ROLE_STYLES[u.role]}>{u.role}</Badge>;
      return canManage && isLastOwner(u) ? (
        <Tooltip content="Every workspace must have at least one Owner">
          <span tabIndex={0}>{badge}</span>
        </Tooltip>
      ) : (
        badge
      );
    }
    return (
      <select
        value={u.role}
        onChange={(e) => changeRole(u, e.target.value as Role)}
        aria-label={`Role for ${u.name}`}
        className={cn("h-7 cursor-pointer rounded-full border-0 px-2.5 text-xs font-medium outline-none", ROLE_STYLES[u.role])}
      >
        {ROLES.filter((r) => r === u.role || options.includes(r)).map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    );
  }

  const counts = {
    total: state.users.length,
    admins: state.users.filter((u) => u.role !== "Member").length,
    invited: state.users.filter((u) => u.status === "Invited").length,
    out: outToday.size,
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        title="Team"
        description={`Everyone in ${state.organization.name}.`}
        actions={
          canManage && (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus /> Invite Member
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Members", counts.total],
          ["Owners & admins", counts.admins],
          ["Pending invites", counts.invited],
          ["Out today", counts.out],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email or title…" className="sm:w-80" />
        <Select size="sm" value={role} onValueChange={(v) => setRole(v as typeof role)} aria-label="Filter by role" className="sm:w-40" options={[{ value: "all", label: "All roles" }, ...ROLES.map((r) => ({ value: r, label: r }))]} />
      </div>

      {members.length === 0 ? (
        <EmptyState icon={Users} title="No members found" description="Try a different search or role filter." />
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-3 pl-5 font-medium">Name</th>
                  <th className="hidden py-3 font-medium lg:table-cell">Email</th>
                  <th className="py-3 font-medium">Role</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 text-center font-medium">Projects</th>
                  <th className="py-3 text-center font-medium">Open tasks</th>
                  <th className="hidden py-3 font-medium xl:table-cell">Joined</th>
                  <th className="py-3 pr-5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((u) => {
                  const s = stats.get(u.id);
                  return (
                    <tr key={u.id} className="transition hover:bg-lavender">
                      <td className="py-3 pl-5">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={u} size="lg" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {u.name} {u.id === me.id && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                              {outToday.has(u.id) && <Badge className={cn("ml-1.5 h-5 px-2 text-[11px]", ON_LEAVE_CLASS)}>On leave</Badge>}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{u.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden py-3 text-muted-foreground lg:table-cell">{u.email}</td>
                      <td className="py-3">{roleCell(u)}</td>
                      <td className="py-3">
                        <Badge className={STATUS_STYLES[u.status]}>{u.status}</Badge>
                      </td>
                      <td className="py-3 text-center tabular-nums">{s?.projects ?? 0}</td>
                      <td className="py-3 text-center tabular-nums">{s?.open ?? 0}</td>
                      <td className="hidden py-3 text-muted-foreground xl:table-cell">{formatLong(u.joinedAt)}</td>
                      <td className="py-3 pr-5">
                        <div className="flex justify-end">{actions(u)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <ul className="space-y-3 md:hidden">
            {members.map((u) => {
              const s = stats.get(u.id);
              return (
                <li key={u.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                  <UserAvatar user={u} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {u.name} {u.id === me.id && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge className={ROLE_STYLES[u.role]}>{u.role}</Badge>
                      <Badge className={STATUS_STYLES[u.status]}>{u.status}</Badge>
                      {outToday.has(u.id) && <Badge className={ON_LEAVE_CLASS}>On leave</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {s?.open ?? 0} open · {s?.projects ?? 0} projects
                      </span>
                    </div>
                  </div>
                  {actions(u)}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open && params.get("invite")) router.replace("/team");
        }}
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.name}?`}
        description={`They will lose access to ${state.organization.name} and be unassigned from its tasks and projects. Their other workspaces aren't affected.`}
        confirmLabel="Remove member"
        onConfirm={() => {
          if (!removing) return;
          const result = removeOrganizationMember(removing.membershipId);
          if (result.ok) toast.success(`${removing.name} removed`);
          else toast.error(result.error);
        }}
      />
      <LeaveWorkspaceDialog organization={leaving ? state.organization : null} onOpenChange={(open) => !open && setLeaving(false)} />
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <TeamContent />
    </Suspense>
  );
}
