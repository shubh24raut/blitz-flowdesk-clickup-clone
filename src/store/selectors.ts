import { countLeaveDays, daysOffFrom, eachDateKey, fromDateKey, rangesOverlap } from "@/lib/time-off";
import { isAdminRole } from "@/lib/organizations";
import type { Client, DateKey, Holiday, ID, LeaveRequest, LeaveType, Member, Project, Stage, Task, WorkspaceState } from "@/types";

export * from "./organization";

/*
 * Selectors below take a `WorkspaceState` (see `selectWorkspace`), so everything
 * they return is already limited to the active organization.
 */

interface Indexes {
  users: Map<ID, Member>;
  clients: Map<ID, Client>;
  projects: Map<ID, Project>;
  stages: Map<ID, Stage>;
  stagesByProject: Map<ID, Stage[]>;
  tasksByStage: Map<ID, Task[]>;
  tasksByProject: Map<ID, Task[]>;
  commentCount: Map<ID, number>;
  attachmentCount: Map<ID, number>;
}

const cache = new WeakMap<WorkspaceState, Indexes>();

function group<T>(items: T[], key: (item: T) => ID): Map<ID, T[]> {
  const map = new Map<ID, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

function count<T>(items: T[], key: (item: T) => ID | null): Map<ID, number> {
  const map = new Map<ID, number>();
  for (const item of items) {
    const k = key(item);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

/** Lookup tables derived from state, memoised per state snapshot. */
export function indexes(state: WorkspaceState): Indexes {
  const hit = cache.get(state);
  if (hit) return hit;
  const stagesByProject = group(state.stages, (s) => s.projectId);
  for (const list of stagesByProject.values()) list.sort((a, b) => a.order - b.order);
  const tasksByStage = group(state.tasks, (t) => t.stageId);
  for (const list of tasksByStage.values()) list.sort((a, b) => a.order - b.order);
  const built: Indexes = {
    users: new Map(state.users.map((u) => [u.id, u])),
    clients: new Map(state.clients.map((c) => [c.id, c])),
    projects: new Map(state.projects.map((p) => [p.id, p])),
    stages: new Map(state.stages.map((s) => [s.id, s])),
    stagesByProject,
    tasksByStage,
    tasksByProject: group(state.tasks, (t) => t.projectId),
    commentCount: count(state.comments, (c) => c.taskId),
    attachmentCount: count(state.attachments, (a) => a.taskId),
  };
  cache.set(state, built);
  return built;
}

export function getProjectStages(state: WorkspaceState, projectId: ID): Stage[] {
  return indexes(state).stagesByProject.get(projectId) ?? [];
}

export function getStageTasks(state: WorkspaceState, stageId: ID): Task[] {
  return indexes(state).tasksByStage.get(stageId) ?? [];
}

export function getProjectTasks(state: WorkspaceState, projectId: ID): Task[] {
  return indexes(state).tasksByProject.get(projectId) ?? [];
}

export function isTaskDone(state: WorkspaceState, task: Task): boolean {
  return indexes(state).stages.get(task.stageId)?.isCompleted ?? false;
}

export function taskKey(state: WorkspaceState, task: Task): string {
  const project = indexes(state).projects.get(task.projectId);
  return `${project?.key ?? "T"}-${task.number}`;
}

export function projectProgress(state: WorkspaceState, projectId: ID) {
  const tasks = getProjectTasks(state, projectId);
  const done = tasks.filter((t) => isTaskDone(state, t)).length;
  return {
    total: tasks.length,
    done,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}

export function getUsers(state: WorkspaceState, ids: ID[]): Member[] {
  const map = indexes(state).users;
  return ids.map((id) => map.get(id)).filter((u): u is Member => Boolean(u));
}

export function clientProjects(state: WorkspaceState, clientId: ID): Project[] {
  return state.projects.filter((p) => p.clientId === clientId);
}

/** Buckets a task into a generic phase so dashboards work across custom workflows. */
export type Phase = "To Do" | "In Progress" | "Review" | "Done";

export function taskPhase(state: WorkspaceState, task: Task): Phase {
  const stage = indexes(state).stages.get(task.stageId);
  if (!stage) return "To Do";
  if (stage.isCompleted) return "Done";
  if (/review|qa|test|approv/i.test(stage.name)) return "Review";
  if (stage.order === 0) return "To Do";
  return "In Progress";
}

/* ---------------------------------- Time off --------------------------------- */

export function holidayCalendarIdFor(state: WorkspaceState, userId: ID): ID | null {
  const user = indexes(state).users.get(userId);
  return user?.holidayCalendarId ?? state.organization.defaultHolidayCalendarId;
}

/** Company-wide holidays plus the member's own holiday calendar, sorted by date. */
export function holidaysFor(state: WorkspaceState, userId: ID): Holiday[] {
  const calendarId = holidayCalendarIdFor(state, userId);
  return state.holidays
    .filter((h) => h.calendarId === null || h.calendarId === calendarId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function leaveDaysFor(state: WorkspaceState, userId: ID, range: { start: DateKey; end: DateKey; halfDay: boolean }): number {
  return countLeaveDays({
    ...range,
    workingDays: state.organization.workingDays,
    daysOff: daysOffFrom(holidaysFor(state, userId)),
  });
}

/** What a date range skips: non-working weekdays, and holidays that fall on working days. */
export function skippedDaysFor(state: WorkspaceState, userId: ID, range: { start: DateKey; end: DateKey }): { weekendDays: number; holidays: Holiday[] } {
  const { workingDays } = state.organization;
  const offByDate = new Map(holidaysFor(state, userId).filter((h) => h.kind !== "optional").map((h) => [h.date, h]));
  let weekendDays = 0;
  const holidays: Holiday[] = [];
  for (const key of eachDateKey(range.start, range.end)) {
    if (!workingDays.includes(fromDateKey(key).getDay())) weekendDays++;
    else if (offByDate.has(key)) holidays.push(offByDate.get(key)!);
  }
  return { weekendDays, holidays };
}

export interface LeaveBalance {
  type: LeaveType;
  used: number;
  pending: number;
  /** `null` when the leave type has no allowance. */
  remaining: number | null;
}

/** Fixed yearly allowance: requests count toward the year they start in. */
export function leaveBalances(state: WorkspaceState, userId: ID, year: number): LeaveBalance[] {
  const prefix = String(year);
  const mine = state.leaveRequests.filter((r) => r.userId === userId && r.startDate.startsWith(prefix));
  return state.leaveTypes.map((type) => {
    const ofType = mine.filter((r) => r.typeId === type.id);
    const sum = (status: LeaveRequest["status"]) => ofType.filter((r) => r.status === status).reduce((n, r) => n + r.days, 0);
    const used = sum("Approved");
    const pending = sum("Pending");
    return { type, used, pending, remaining: type.allowance === null ? null : type.allowance - used - pending };
  });
}

/** Approved leave covering a date. */
export function approvedLeaveOn(state: WorkspaceState, date: DateKey): LeaveRequest[] {
  return state.leaveRequests.filter((r) => r.status === "Approved" && r.startDate <= date && date <= r.endDate);
}

/** Pending or approved requests of a member that clash with a date range. */
export function overlappingLeave(state: WorkspaceState, userId: ID, range: { startDate: DateKey; endDate: DateKey }, ignoreId?: ID): LeaveRequest[] {
  return state.leaveRequests.filter(
    (r) => r.userId === userId && r.id !== ignoreId && (r.status === "Pending" || r.status === "Approved") && rangesOverlap(r, range),
  );
}

/** `member.role` is the membership role in the active organization, never a global one. */
export function isTimeOffAdmin(member: Pick<Member, "role">): boolean {
  return isAdminRole(member.role);
}

/** Owners and admins review requests — never their own. */
export function canReviewLeave(reviewer: Pick<Member, "id" | "role">, request: LeaveRequest): boolean {
  return isTimeOffAdmin(reviewer) && reviewer.id !== request.userId && request.status === "Pending";
}
