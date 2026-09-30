import type { ID, OrganizationMember } from "@/types";

/** Seed records are written without `organizationId`; `inOrganization` stamps it on. */
export type Unscoped<T> = Omit<T, "organizationId">;

export const DREAM_KASPER_ID = "org_dreamkasper";
export const NORTHWIND_ID = "org_northwind";

export function inOrganization<T extends { organizationId: ID }>(organizationId: ID, items: Unscoped<T>[]): T[] {
  return items.map((item) => ({ ...item, organizationId }) as T);
}

/** Deterministic membership ids so seeds and migrations agree. */
export function membershipId(organizationId: ID, userId: ID): ID {
  return `om_${organizationId.replace(/^org_/, "")}_${userId.replace(/^u_/, "")}`;
}

export function membership(
  organizationId: ID,
  userId: ID,
  fields: Pick<OrganizationMember, "role" | "status" | "joinedAt"> & { holidayCalendarId?: ID | null },
): OrganizationMember {
  return { id: membershipId(organizationId, userId), organizationId, userId, holidayCalendarId: null, ...fields };
}
