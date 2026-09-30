// Drizzle table definitions: organization-members.
// Mirrors `OrganizationMember` in src/types: the user ↔ organization join that carries the
// per-workspace role ("Owner" | "Admin" | "Member"), status, joined_at and the member's
// holiday_calendar_id. Unique on (organization_id, user_id). Users never hold a global role.

export {};
