import { addDays, format, isValid, parseISO } from "date-fns";
import type { DateKey, Holiday } from "@/types";

/**
 * Pure time-off rules shared by the UI today and the server services later.
 * Dates are `yyyy-MM-dd` keys so they never shift across timezones.
 */

export function toDateKey(date: Date): DateKey {
  return format(date, "yyyy-MM-dd");
}

export function fromDateKey(key: DateKey): Date {
  return parseISO(key);
}

export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));
}

/** Every date key from `start` to `end`, inclusive. Empty when `end` is before `start`. */
export function eachDateKey(start: DateKey, end: DateKey): DateKey[] {
  const keys: DateKey[] = [];
  for (let d = fromDateKey(start); toDateKey(d) <= end; d = addDays(d, 1)) keys.push(toDateKey(d));
  return keys;
}

/** Holidays that give the day off. Optional holidays are informational only. */
export function daysOffFrom(holidays: Array<Pick<Holiday, "date" | "kind">>): Set<DateKey> {
  return new Set(holidays.filter((h) => h.kind !== "optional").map((h) => h.date));
}

export function isWorkingDay(key: DateKey, workingDays: number[], daysOff: Set<DateKey>): boolean {
  return workingDays.includes(fromDateKey(key).getDay()) && !daysOff.has(key);
}

/** Working days a leave request consumes: weekends and days off are free, a half day counts 0.5. */
export function countLeaveDays(input: {
  start: DateKey;
  end: DateKey;
  halfDay: boolean;
  workingDays: number[];
  daysOff: Set<DateKey>;
}): number {
  const days = eachDateKey(input.start, input.end).filter((k) => isWorkingDay(k, input.workingDays, input.daysOff)).length;
  return input.halfDay && days > 0 ? 0.5 : days;
}

export function rangesOverlap(
  a: { startDate: DateKey; endDate: DateKey },
  b: { startDate: DateKey; endDate: DateKey },
): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

export function formatDays(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}
