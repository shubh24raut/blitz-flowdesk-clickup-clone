import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";

export function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

/** "Oct 8" (adds the year when it differs from the current one). */
export function formatShort(value: string | null | undefined): string {
  if (!value) return "";
  const date = toDate(value);
  if (!isValid(date)) return "";
  return date.getFullYear() === new Date().getFullYear()
    ? format(date, "MMM d")
    : format(date, "MMM d, yyyy");
}

/** "15 Oct 2026" */
export function formatLong(value: string | null | undefined): string {
  if (!value) return "";
  const date = toDate(value);
  return isValid(date) ? format(date, "d MMM yyyy") : "";
}

/** "2 hours ago" / "just now" */
export function formatRelative(value: string): string {
  const date = toDate(value);
  if (!isValid(date)) return "";
  if (Math.abs(Date.now() - date.getTime()) < 60_000) return "just now";
  return `${formatDistanceToNowStrict(date)} ago`;
}

/** yyyy-MM-dd for `<input type="date">`. */
export function toInputDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = toDate(value);
  return isValid(date) ? format(date, "yyyy-MM-dd") : "";
}

/** Converts an input value (yyyy-MM-dd) to an ISO string at local midday. */
export function fromInputDate(value: string): string | null {
  if (!value) return null;
  const date = parseISO(value);
  if (!isValid(date)) return null;
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

export function daysUntil(value: string): number {
  return differenceInCalendarDays(startOfDay(toDate(value)), startOfDay(new Date()));
}

export type DueTone = "overdue" | "soon" | "normal";

export function dueTone(value: string | null, completed = false): DueTone {
  if (!value || completed) return "normal";
  const days = daysUntil(value);
  if (days < 0) return "overdue";
  if (days <= 3) return "soon";
  return "normal";
}
