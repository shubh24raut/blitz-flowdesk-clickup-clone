import { uid } from "@/lib/utils";
import { getState, setState } from "@/store/store";
import type { ID, Role, User } from "@/types";
import { actorId, now, replaceById, withActivity } from "./internal";

const COLORS = ["#5B5CF6", "#0EA5E9", "#EC4899", "#22C55E", "#F59E0B", "#8B5CF6", "#06B6D4", "#F97316"];

export function inviteMember(input: { name: string; email: string; role: Role; title?: string }): User {
  const state = getState();
  const user: User = {
    id: uid("u"),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    title: input.title?.trim() || "Team member",
    role: input.role,
    status: "Invited",
    color: COLORS[state.users.length % COLORS.length],
    joinedAt: now(),
  };
  setState((s) => withActivity({ ...s, users: [...s.users, user] }, { action: "invited", target: user.name }));
  return user;
}

export function updateMember(id: ID, patch: Partial<Pick<User, "role" | "status" | "title" | "name">>) {
  setState((s) => ({ ...s, users: replaceById(s.users, id, (u) => ({ ...u, ...patch })) }));
}

export function resendInvite(id: ID) {
  updateMember(id, { status: "Invited" });
}

/** Removes a member and unassigns them everywhere. The signed-in user cannot remove themselves. */
export function removeMember(id: ID): boolean {
  const state = getState();
  if (id === actorId(state)) return false;
  const user = state.users.find((u) => u.id === id);
  setState((s) =>
    withActivity(
      {
        ...s,
        users: s.users.filter((u) => u.id !== id),
        projects: s.projects.map((p) => ({ ...p, memberIds: p.memberIds.filter((m) => m !== id) })),
        tasks: s.tasks.map((t) => ({
          ...t,
          assigneeIds: t.assigneeIds.filter((m) => m !== id),
          checklist: t.checklist.map((c) => (c.assigneeId === id ? { ...c, assigneeId: null } : c)),
        })),
        leaveRequests: s.leaveRequests.filter((r) => r.userId !== id),
      },
      { action: "removed", target: user?.name ?? "a member" },
    ),
  );
  return true;
}

export function updateProfile(patch: Partial<Pick<User, "name" | "email" | "title" | "avatarUrl">>) {
  setState((s) => {
    const me = actorId(s);
    return { ...s, users: replaceById(s.users, me, (u) => ({ ...u, ...patch })) };
  });
}
