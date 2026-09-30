import type { ClientStatus, HolidayKind, LeaveStatus, Priority, ProjectStatus, Role } from "@/types";

export const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];

export const PRIORITY_STYLES: Record<Priority, { dot: string; badge: string; color: string }> = {
  Low: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    color: "#22C55E",
  },
  Medium: {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    color: "#F59E0B",
  },
  High: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    color: "#EF4444",
  },
  Urgent: {
    dot: "bg-rose-700",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    color: "#BE123C",
  },
};

export const PRIORITY_RANK: Record<Priority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

/** Palette offered when picking a stage / project / client color. */
export const COLOR_OPTIONS = [
  "#94A3B8",
  "#8B5CF6",
  "#5B5CF6",
  "#3B82F6",
  "#06B6D4",
  "#22C55E",
  "#F59E0B",
  "#F97316",
  "#EF4444",
  "#EC4899",
] as const;

const TAG_TONES = [
  "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  "bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300",
  "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
];

const KNOWN_TAGS: Record<string, number> = {
  research: 0,
  planning: 0,
  design: 0,
  development: 1,
  technical: 0,
  qa: 5,
  review: 4,
  content: 3,
  marketing: 3,
  bug: 3,
};

export function tagTone(tag: string): string {
  const known = KNOWN_TAGS[tag.toLowerCase()];
  if (known !== undefined) return TAG_TONES[known];
  let hash = 0;
  for (const ch of tag) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TAG_TONES[hash % TAG_TONES.length];
}

export const CLIENT_STATUSES: ClientStatus[] = ["Active", "Inactive", "Lead"];

export const CLIENT_STATUS_STYLES: Record<ClientStatus, string> = {
  Active: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  Inactive: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  Lead: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
};

export const PROJECT_STATUSES: ProjectStatus[] = ["Active", "On Hold", "Completed", "Archived"];

export const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  Active: "bg-primary-light text-primary",
  "On Hold": "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  Completed: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  Archived: "bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-300",
};

export const ROLES: Role[] = ["Owner", "Admin", "Member"];

export const LANGUAGES = ["English", "Hindi", "Español", "Français", "Deutsch"];

export const DEMO_CREDENTIALS = { email: "demo@flowdesk.com", password: "password" };

export const LEAVE_STATUS_STYLES: Record<LeaveStatus, string> = {
  Pending: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  Approved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  Rejected: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  Cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-300",
};

export const HOLIDAY_KIND_LABELS: Record<HolidayKind, string> = {
  public: "Public holiday",
  optional: "Optional",
  company: "Company holiday",
};

export const HOLIDAY_KIND_STYLES: Record<HolidayKind, string> = {
  public: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  optional: "bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-300",
  company: "bg-primary-light text-primary",
};

/** Monday-first order for working-day pickers; values are `Date#getDay()` numbers. */
export const WEEKDAYS: Array<{ value: number; short: string; long: string }> = [
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
  { value: 0, short: "Sun", long: "Sunday" },
];
