import { describe, expect, it } from "vitest";
import type { OrganizationMember, Role } from "@/types";
import { canChangeRole, canLeave, canManageMember, LAST_OWNER_MESSAGE, slugify, uniqueSlug } from "./organizations";

const member = (id: string, role: Role, status: OrganizationMember["status"] = "Active"): OrganizationMember => ({
  id,
  organizationId: "org",
  userId: `u_${id}`,
  role,
  status,
  joinedAt: "2026-01-01",
  holidayCalendarId: null,
});

describe("slugify", () => {
  it("turns names into URL-safe slugs", () => {
    expect(slugify("Dream Kasper LLP")).toBe("dream-kasper-llp");
    expect(slugify("  Acme Creative, Inc.  ")).toBe("acme-creative-inc");
    expect(slugify("Café Ünïcode")).toBe("cafe-unicode");
  });

  it("finds the first free variant", () => {
    expect(uniqueSlug("acme", ["acme", "acme-2"])).toBe("acme-3");
    expect(uniqueSlug("", [])).toBe("workspace");
  });
});

describe("owner rule", () => {
  const owner = member("owner", "Owner");
  const admin = member("admin", "Admin");
  const plain = member("plain", "Member");
  const team = [owner, admin, plain];

  it("never demotes the final owner", () => {
    const check = canChangeRole(owner, owner, "Admin", team);
    expect(check).toEqual({ ok: false, reason: LAST_OWNER_MESSAGE });
  });

  it("never removes or deactivates the final owner", () => {
    const secondOwner = member("owner2", "Owner");
    expect(canManageMember(secondOwner, owner, [owner, secondOwner]).ok).toBe(true);
    expect(canManageMember(owner, owner, team).ok).toBe(false);
    // An invited owner doesn't keep the workspace running.
    const invitedOwner = member("owner3", "Owner", "Invited");
    expect(canManageMember(invitedOwner, owner, [owner, invitedOwner]).ok).toBe(false);
  });

  it("allows stepping down once another owner exists", () => {
    const secondOwner = member("owner2", "Owner");
    expect(canChangeRole(owner, owner, "Admin", [...team, secondOwner]).ok).toBe(true);
  });

  it("stops the final owner from leaving", () => {
    expect(canLeave(owner, team).ok).toBe(false);
    expect(canLeave(plain, team).ok).toBe(true);
  });

  it("keeps admins away from owners and the Owner role", () => {
    expect(canChangeRole(admin, owner, "Member", team).ok).toBe(false);
    expect(canChangeRole(admin, plain, "Owner", team).ok).toBe(false);
    expect(canChangeRole(admin, plain, "Admin", team).ok).toBe(true);
    expect(canChangeRole(plain, admin, "Member", team).ok).toBe(false);
  });
});
