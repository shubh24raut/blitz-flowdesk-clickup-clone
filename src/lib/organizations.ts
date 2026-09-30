import type { ID, MemberStatus, OrganizationMember, Role } from "@/types";

/**
 * Pure organization rules: slugs and who may change which membership.
 * No store access, so the future services layer can enforce the same rules server-side.
 */

/* ----------------------------------- Slugs ----------------------------------- */

export const SLUG_MAX_LENGTH = 48;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Acme Creative, Inc." → "acme-creative-inc" */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

/** First free variant of `base`: `acme`, `acme-2`, `acme-3`, … */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = base || "workspace";
  if (!used.has(root)) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root.slice(0, SLUG_MAX_LENGTH - String(n).length - 1)}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}

/* ----------------------------------- Roles ----------------------------------- */

/** Better Auth's organization plugin stores roles lowercase; the UI uses `Owner` | `Admin` | `Member`. */
export type DbRole = "owner" | "admin" | "member";

export function roleFromDb(role: string): Role {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}

export function roleToDb(role: Role): DbRole {
  return role.toLowerCase() as DbRole;
}

export const LAST_OWNER_MESSAGE =
  "Every workspace must have at least one Owner. Assign another Owner before changing this role.";

export type Check = { ok: true } | { ok: false; reason: string };

const allow: Check = { ok: true };
const deny = (reason: string): Check => ({ ok: false, reason });

/** Members who can use the workspace. Inactive members keep their history but lose access. */
export function hasAccess(status: MemberStatus): boolean {
  return status !== "Inactive";
}

export function isAdminRole(role: Role | null | undefined): boolean {
  return role === "Owner" || role === "Admin";
}

/** Active owners — the ones who can keep a workspace running. */
export function activeOwnerCount(members: OrganizationMember[]): number {
  return members.filter((m) => m.role === "Owner" && m.status === "Active").length;
}

/** Would losing `target` as an active owner leave the workspace without one? */
export function isLastOwner(target: OrganizationMember, members: OrganizationMember[]): boolean {
  return target.role === "Owner" && target.status === "Active" && activeOwnerCount(members) <= 1;
}

/**
 * Owners manage everyone; admins manage admins and members but can't touch owners
 * or hand out the Owner role. Nobody changes their own role except an owner stepping
 * down while another owner remains.
 */
export function canChangeRole(actor: OrganizationMember | null, target: OrganizationMember, next: Role, members: OrganizationMember[]): Check {
  if (!actor || !isAdminRole(actor.role)) return deny("Only owners and admins can change roles.");
  if (target.role === next) return allow;
  if (actor.role !== "Owner" && (target.role === "Owner" || next === "Owner")) return deny("Only owners can change who is an Owner.");
  if (actor.id === target.id && actor.role !== "Owner") return deny("You can't change your own role.");
  if (target.role === "Owner" && isLastOwner(target, members)) return deny(LAST_OWNER_MESSAGE);
  return allow;
}

/** Deactivating or removing someone. Leaving is `canLeave`, not this. */
export function canManageMember(actor: OrganizationMember | null, target: OrganizationMember, members: OrganizationMember[]): Check {
  if (!actor || !isAdminRole(actor.role)) return deny("Only owners and admins can manage members.");
  if (actor.id === target.id) return deny("Use “Leave workspace” to remove yourself.");
  if (target.role === "Owner" && actor.role !== "Owner") return deny("Only owners can manage other owners.");
  if (isLastOwner(target, members)) return deny("Every workspace must have at least one Owner.");
  return allow;
}

export function canLeave(member: OrganizationMember | null, members: OrganizationMember[]): Check {
  if (!member) return deny("You're not a member of this workspace.");
  if (isLastOwner(member, members)) {
    return deny("You're the only Owner. Make someone else an Owner first, or delete the workspace.");
  }
  return allow;
}

export function canEditOrganization(member: OrganizationMember | null): Check {
  return member && isAdminRole(member.role) ? allow : deny("Only owners and admins can change workspace settings.");
}

export function canDeleteOrganization(member: OrganizationMember | null): Check {
  return member?.role === "Owner" ? allow : deny("Only owners can delete a workspace.");
}

/** Convenience for lists: the members of one organization. */
export function membersOf(members: OrganizationMember[], organizationId: ID): OrganizationMember[] {
  return members.filter((m) => m.organizationId === organizationId);
}
