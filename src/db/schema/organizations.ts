import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Workspaces (Better Auth organization plugin's `organization` model).
 * Mirrors `Organization` in src/types. `website`, `plan`, `working_days` and
 * `default_holiday_calendar_id` are FlowDesk additions (organization `additionalFields`).
 * Org-owned tables (clients, projects, holiday_calendars, …) reference it via `organization_id`.
 */
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  website: text("website").notNull().default(""),
  plan: text("plan").notNull().default("Free"),
  /** `Date#getDay()` numbers, 0 = Sunday. */
  workingDays: integer("working_days").array().notNull().default([1, 2, 3, 4, 5]),
  /** FK to holiday_calendars is added once that table exists. */
  defaultHolidayCalendarId: text("default_holiday_calendar_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
});
