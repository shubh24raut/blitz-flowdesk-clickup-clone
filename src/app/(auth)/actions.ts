"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { demoEmails } from "@/store/seed";

/**
 * Whether `email` may use the demo login (any password, mock data).
 * Only the seeded demo people qualify, and never once a real account exists for the
 * address — a real account always requires its real password.
 */
export async function isDemoLoginAllowed(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!demoEmails().includes(normalized)) return false;
  const [real] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalized)).limit(1);
  return !real;
}
