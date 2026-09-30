import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Accounts (Better Auth's `user` model). Identity only: no role and no organization —
 * workspace access and roles live in `organization_members`.
 * `title` and `color` are FlowDesk additions (see `user.additionalFields` in lib/auth.ts).
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  title: text("title").notNull().default("Team member"),
  color: text("color").notNull().default("#5B5CF6"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
