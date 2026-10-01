import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { E2E_EMAIL_PATTERN } from "./helpers";

/**
 * E2E tests create real accounts in the database. Remove them (sessions, accounts and
 * memberships cascade) so test runs never leave data behind.
 */
export default async function globalTeardown() {
  loadEnvConfig(process.cwd());
  if (!process.env.DATABASE_URL) return;
  const sql = neon(process.env.DATABASE_URL);
  await sql`delete from organizations where id in (
    select m.organization_id from organization_members m join users u on u.id = m.user_id where u.email like ${E2E_EMAIL_PATTERN}
  )`;
  await sql`delete from users where email like ${E2E_EMAIL_PATTERN}`;
}
