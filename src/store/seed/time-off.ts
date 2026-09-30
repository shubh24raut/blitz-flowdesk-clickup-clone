import { addDays } from "date-fns";
import { countLeaveDays, daysOffFrom, isWorkingDay, toDateKey } from "@/lib/time-off";
import type { DateKey, Holiday, HolidayCalendar, LeaveRequest, LeaveStatus, LeaveType } from "@/types";
import type { Unscoped } from "./organizations";
import { daysFromNow, hoursAgo } from "./time";

export const SEED_WORKING_DAYS = [1, 2, 3, 4, 5];
export const SEED_HOLIDAY_CALENDAR_ID = "hc_india";

export function seedHolidayCalendars(): Unscoped<HolidayCalendar>[] {
  return [{ id: SEED_HOLIDAY_CALENDAR_ID, name: "India — Maharashtra", countryCode: "IN", regionCode: "MH" }];
}

/** Fixed-date holidays for this year and next, so the demo never runs out. Movable ones come from "Import". */
const FIXED_INDIA_HOLIDAYS: Array<[month: number, day: number, name: string]> = [
  [1, 26, "Republic Day"],
  [5, 1, "Maharashtra Day"],
  [8, 15, "Independence Day"],
  [10, 2, "Gandhi Jayanti"],
  [12, 25, "Christmas Day"],
];

const dayKey = (offset: number) => toDateKey(addDays(new Date(), offset));

/** First Monday–Friday on or after `offset` days from today. */
function weekdayKey(offset: number): DateKey {
  let day = addDays(new Date(), offset);
  while (!SEED_WORKING_DAYS.includes(day.getDay())) day = addDays(day, 1);
  return toDateKey(day);
}

export function seedHolidays(): Unscoped<Holiday>[] {
  const year = new Date().getFullYear();
  const national = [year, year + 1].flatMap((y) =>
    FIXED_INDIA_HOLIDAYS.map(([m, d, name]): Unscoped<Holiday> => {
      const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      return { id: `hol_${date}`, calendarId: SEED_HOLIDAY_CALENDAR_ID, name, date, kind: "public" };
    }),
  );
  return [
    ...national,
    { id: "hol_offsite", calendarId: null, name: "Team offsite — office closed", date: weekdayKey(24), kind: "company" },
    { id: "hol_founders", calendarId: null, name: "Founders' Day", date: weekdayKey(52), kind: "company" },
  ];
}

export function seedLeaveTypes(): Unscoped<LeaveType>[] {
  return [
    { id: "lt_casual", name: "Casual leave", color: "#5B5CF6", allowance: 12, paid: true, requiresApproval: true },
    { id: "lt_sick", name: "Sick leave", color: "#F59E0B", allowance: 8, paid: true, requiresApproval: false },
    { id: "lt_earned", name: "Earned leave", color: "#22C55E", allowance: 15, paid: true, requiresApproval: true },
    { id: "lt_unpaid", name: "Unpaid leave", color: "#94A3B8", allowance: null, paid: false, requiresApproval: true },
  ];
}

/** Starts at the first working day on/after `offset` and spans `count` working days. */
function workingSpan(offset: number, count: number, daysOff: Set<DateKey>): { startDate: DateKey; endDate: DateKey } {
  let cursor = offset;
  while (!isWorkingDay(dayKey(cursor), SEED_WORKING_DAYS, daysOff)) cursor++;
  const startDate = dayKey(cursor);
  let taken = 1;
  while (taken < count) {
    cursor++;
    if (isWorkingDay(dayKey(cursor), SEED_WORKING_DAYS, daysOff)) taken++;
  }
  return { startDate, endDate: dayKey(cursor) };
}

export function seedLeaveRequests(): Unscoped<LeaveRequest>[] {
  const daysOff = daysOffFrom(seedHolidays());
  const make = (
    id: string,
    userId: string,
    typeId: string,
    offset: number,
    count: number,
    status: LeaveStatus,
    reason: string,
    extra: Partial<LeaveRequest> = {},
  ): Unscoped<LeaveRequest> => {
    const span = workingSpan(offset, count, daysOff);
    const halfDay = extra.halfDay ?? false;
    const reviewed = status === "Approved" || status === "Rejected";
    return {
      id,
      userId,
      typeId,
      ...span,
      halfDay,
      days: countLeaveDays({ start: span.startDate, end: span.endDate, halfDay, workingDays: SEED_WORKING_DAYS, daysOff }),
      reason,
      status,
      reviewerId: reviewed ? "u_shubham" : null,
      reviewNote: "",
      reviewedAt: reviewed ? hoursAgo(30) : null,
      createdAt: daysFromNow(Math.min(offset, 0) - 7),
      ...extra,
    };
  };

  return [
    make("lr_karan_sick", "u_karan", "lt_sick", 0, 1, "Approved", "Down with a fever.", { reviewerId: null, reviewedAt: hoursAgo(3) }),
    make("lr_isha_trip", "u_isha", "lt_earned", 5, 4, "Approved", "Family trip to Kerala."),
    make("lr_ananya", "u_ananya", "lt_casual", 12, 2, "Pending", "Cousin's wedding."),
    make("lr_vikram", "u_vikram", "lt_earned", 19, 5, "Pending", "Visiting my parents in Jaipur."),
    make("lr_rohan_half", "u_rohan", "lt_casual", 3, 1, "Pending", "Bank appointment in the morning.", { halfDay: true }),
    make("lr_shubham_past", "u_shubham", "lt_casual", -34, 2, "Approved", "Long weekend.", { reviewerId: "u_rohan" }),
    make("lr_sneha_rejected", "u_sneha", "lt_casual", -10, 3, "Rejected", "Short break.", { reviewNote: "Release week — can we move this by a week?" }),
  ];
}
