import { formatLong } from "@/lib/dates";
import { formatDays, toDateKey } from "@/lib/time-off";
import { uid } from "@/lib/utils";
import {
  canReviewLeave,
  indexes,
  leaveBalances,
  leaveDaysFor,
  overlappingLeave,
} from "@/store/selectors";
import { getState, setState } from "@/store/store";
import type { Holiday, HolidayCalendar, ID, LeaveRequest, LeaveType } from "@/types";
import type { HolidayCandidate } from "@/lib/holidays";
import type { HolidayInput } from "@/validators/holiday.validator";
import type { LeaveRequestInput, LeaveReviewInput, LeaveTypeInput } from "@/validators/leave.validator";
import { actorId, now, replaceById } from "./internal";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/* ---------------------------------- Requests --------------------------------- */

export function requestLeave(input: LeaveRequestInput): Result<LeaveRequest> {
  const state = getState();
  const me = actorId(state);
  const type = state.leaveTypes.find((t) => t.id === input.typeId);
  if (!type) return { ok: false, error: "That leave type no longer exists." };

  const days = leaveDaysFor(state, me, { start: input.startDate, end: input.endDate, halfDay: input.halfDay });
  if (days === 0) return { ok: false, error: "Those dates are all weekends or holidays — no leave needed." };

  const clash = overlappingLeave(state, me, input)[0];
  if (clash) {
    return { ok: false, error: `You already have ${clash.status.toLowerCase()} leave from ${formatLong(clash.startDate)} to ${formatLong(clash.endDate)}.` };
  }

  const year = Number(input.startDate.slice(0, 4));
  const balance = leaveBalances(state, me, year).find((b) => b.type.id === type.id);
  if (balance?.remaining != null && days > balance.remaining) {
    return { ok: false, error: `Only ${formatDays(Math.max(balance.remaining, 0))} of ${type.name.toLowerCase()} left in ${year}.` };
  }

  const autoApproved = !type.requiresApproval;
  const request: LeaveRequest = {
    id: uid("lr"),
    userId: me,
    typeId: type.id,
    startDate: input.startDate,
    endDate: input.endDate,
    halfDay: input.halfDay,
    days,
    reason: input.reason,
    status: autoApproved ? "Approved" : "Pending",
    reviewerId: null,
    reviewNote: "",
    reviewedAt: autoApproved ? now() : null,
    createdAt: now(),
  };
  setState((s) => ({ ...s, leaveRequests: [request, ...s.leaveRequests] }));
  return { ok: true, value: request };
}

/** Members can cancel their own pending requests, or approved ones that haven't ended yet. */
export function canCancelLeave(request: LeaveRequest, userId: ID): boolean {
  if (request.userId !== userId) return false;
  if (request.status === "Pending") return true;
  return request.status === "Approved" && request.endDate >= toDateKey(new Date());
}

export function cancelLeave(id: ID): boolean {
  const state = getState();
  const request = state.leaveRequests.find((r) => r.id === id);
  if (!request || !canCancelLeave(request, actorId(state))) return false;
  setState((s) => ({ ...s, leaveRequests: replaceById(s.leaveRequests, id, (r) => ({ ...r, status: "Cancelled" })) }));
  return true;
}

export function reviewLeave(id: ID, review: LeaveReviewInput): Result<LeaveRequest> {
  const state = getState();
  const reviewer = indexes(state).users.get(actorId(state));
  const request = state.leaveRequests.find((r) => r.id === id);
  if (!reviewer || !request) return { ok: false, error: "Request not found." };
  if (!canReviewLeave(reviewer, request)) return { ok: false, error: "Only owners and admins can review other people's pending requests." };
  const updated: LeaveRequest = { ...request, status: review.decision, reviewerId: reviewer.id, reviewNote: review.note, reviewedAt: now() };
  setState((s) => ({ ...s, leaveRequests: replaceById(s.leaveRequests, id, () => updated) }));
  return { ok: true, value: updated };
}

/* -------------------------------- Leave types -------------------------------- */

export function createLeaveType(input: LeaveTypeInput): LeaveType {
  const type: LeaveType = { id: uid("lt"), ...input, name: input.name.trim() };
  setState((s) => ({ ...s, leaveTypes: [...s.leaveTypes, type] }));
  return type;
}

export function updateLeaveType(id: ID, input: LeaveTypeInput) {
  setState((s) => ({ ...s, leaveTypes: replaceById(s.leaveTypes, id, (t) => ({ ...t, ...input, name: input.name.trim() })) }));
}

/** Refuses when requests use the type, so history stays readable. */
export function deleteLeaveType(id: ID): boolean {
  if (getState().leaveRequests.some((r) => r.typeId === id)) return false;
  setState((s) => ({ ...s, leaveTypes: s.leaveTypes.filter((t) => t.id !== id) }));
  return true;
}

/* ---------------------------------- Holidays --------------------------------- */

export function addHoliday(input: HolidayInput): Holiday {
  const holiday: Holiday = { id: uid("hol"), ...input, name: input.name.trim() };
  setState((s) => ({ ...s, holidays: [...s.holidays, holiday] }));
  return holiday;
}

export function updateHoliday(id: ID, input: HolidayInput) {
  setState((s) => ({ ...s, holidays: replaceById(s.holidays, id, (h) => ({ ...h, ...input, name: input.name.trim() })) }));
}

export function deleteHoliday(id: ID) {
  setState((s) => ({ ...s, holidays: s.holidays.filter((h) => h.id !== id) }));
}

/**
 * Adds imported national holidays to the calendar for that country/region, creating it if needed.
 * Holidays already on the calendar (same date and name) are skipped, so re-importing is safe.
 */
export function importHolidays(
  source: { countryCode: string; regionCode: string | null; name: string },
  candidates: HolidayCandidate[],
): { calendar: HolidayCalendar; added: number } {
  const state = getState();
  const calendar: HolidayCalendar = state.holidayCalendars.find(
    (c) => c.countryCode === source.countryCode && c.regionCode === source.regionCode,
  ) ?? { id: uid("hc"), name: source.name, countryCode: source.countryCode, regionCode: source.regionCode };
  const existing = new Set(state.holidays.filter((h) => h.calendarId === calendar.id).map((h) => `${h.date}|${h.name}`));
  const fresh = candidates
    .filter((c) => !existing.has(`${c.date}|${c.name}`))
    .map((c): Holiday => ({ id: uid("hol"), calendarId: calendar.id, name: c.name, date: c.date, kind: c.kind }));

  setState((s) => {
    const isNew = !s.holidayCalendars.some((c) => c.id === calendar.id);
    return {
      ...s,
      holidayCalendars: isNew ? [...s.holidayCalendars, calendar] : s.holidayCalendars,
      holidays: [...s.holidays, ...fresh],
      organization: s.organization.defaultHolidayCalendarId
        ? s.organization
        : { ...s.organization, defaultHolidayCalendarId: calendar.id },
    };
  });
  return { calendar, added: fresh.length };
}

/** Deletes a calendar and its holidays; members on it fall back to the organization default. */
export function deleteHolidayCalendar(id: ID) {
  setState((s) => ({
    ...s,
    holidayCalendars: s.holidayCalendars.filter((c) => c.id !== id),
    holidays: s.holidays.filter((h) => h.calendarId !== id),
    users: s.users.map((u) => (u.holidayCalendarId === id ? { ...u, holidayCalendarId: null } : u)),
    organization:
      s.organization.defaultHolidayCalendarId === id
        ? { ...s.organization, defaultHolidayCalendarId: s.holidayCalendars.find((c) => c.id !== id)?.id ?? null }
        : s.organization,
  }));
}

/* ---------------------------------- Policies --------------------------------- */

export function setWorkingDays(workingDays: number[]) {
  setState((s) => ({ ...s, organization: { ...s.organization, workingDays: [...workingDays].sort((a, b) => a - b) } }));
}

export function setDefaultHolidayCalendar(id: ID | null) {
  setState((s) => ({ ...s, organization: { ...s.organization, defaultHolidayCalendarId: id } }));
}

/** `null` puts the member back on the organization default. */
export function setMemberHolidayCalendar(userId: ID, calendarId: ID | null) {
  setState((s) => ({ ...s, users: replaceById(s.users, userId, (u) => ({ ...u, holidayCalendarId: calendarId })) }));
}
