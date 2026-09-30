// Drizzle table definitions: organizations.
// Mirrors `Organization` in src/types: id, name, slug (unique), logo_url, website, plan,
// working_days, default_holiday_calendar_id, created_at, updated_at. Org-owned tables
// (clients, projects, holiday_calendars, holidays, leave_types, leave_requests,
// activity_logs, notifications) reference it through `organization_id`.

export {};
