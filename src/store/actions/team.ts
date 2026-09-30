import { setState } from "@/store/store";
import type { User } from "@/types";
import { actorId, replaceById } from "./internal";

/*
 * Membership changes (invite, role, status, remove, leave) live in `./organizations`
 * because they belong to a user *in an organization*. This file only edits the account.
 */

export {
  addOrganizationMember as inviteMember,
  removeOrganizationMember,
  setOrganizationMemberStatus,
  updateOrganizationMemberRole,
} from "./organizations";

/** Account fields are shared across every workspace the user belongs to. */
export function updateProfile(patch: Partial<Pick<User, "name" | "email" | "title" | "avatarUrl">>) {
  setState((s) => {
    const me = actorId(s);
    return { ...s, users: replaceById(s.users, me, (u) => ({ ...u, ...patch })) };
  });
}
