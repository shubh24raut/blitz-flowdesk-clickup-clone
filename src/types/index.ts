export type ID = string;
/** ISO-8601 timestamp or date string. */
export type ISODate = string;

export type Role = "Owner" | "Admin" | "Member";
export type MemberStatus = "Active" | "Invited" | "Inactive";

export interface User {
  id: ID;
  name: string;
  email: string;
  title: string;
  role: Role;
  status: MemberStatus;
  /** Hex color used for the initials avatar. */
  color: string;
  /** Optional photo (data URL for locally uploaded avatars). */
  avatarUrl?: string;
  joinedAt: ISODate;
  /** Holiday calendar this member follows. Falls back to the organization default. */
  holidayCalendarId?: ID | null;
}

export interface Organization {
  id: ID;
  name: string;
  website: string;
  plan: "Free" | "Pro" | "Business";
  /** Days of the week people normally work, as `Date#getDay()` numbers (0 = Sunday). */
  workingDays: number[];
  defaultHolidayCalendarId: ID | null;
}

export type ClientStatus = "Active" | "Inactive" | "Lead";

export interface ClientContact {
  id: ID;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface Client {
  id: ID;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  address: string;
  status: ClientStatus;
  color: string;
  notes: string;
  contacts: ClientContact[];
  createdAt: ISODate;
}

export type ProjectStatus = "Active" | "On Hold" | "Completed" | "Archived";

export interface Project {
  id: ID;
  name: string;
  description: string;
  clientId: ID | null;
  status: ProjectStatus;
  color: string;
  startDate: ISODate;
  dueDate: ISODate;
  memberIds: ID[];
  starred: boolean;
  /** Short key used to build task IDs, e.g. "FD" -> FD-123. */
  key: string;
  createdAt: ISODate;
}

export interface Stage {
  id: ID;
  projectId: ID;
  name: string;
  color: string;
  order: number;
  isCompleted: boolean;
}

export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface ChecklistItem {
  id: ID;
  text: string;
  done: boolean;
  assigneeId: ID | null;
}

export interface Task {
  id: ID;
  /** Human readable sequential number, rendered as `${project.key}-${number}`. */
  number: number;
  projectId: ID;
  stageId: ID;
  /** Position within its stage (0-based). */
  order: number;
  title: string;
  description: string;
  priority: Priority;
  assigneeIds: ID[];
  dueDate: ISODate | null;
  tags: string[];
  checklist: ChecklistItem[];
  createdById: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
  completedAt: ISODate | null;
}

export type AttachmentKind = "image" | "video" | "pdf" | "code" | "file";

export interface Attachment {
  id: ID;
  projectId: ID;
  taskId: ID | null;
  commentId: ID | null;
  name: string;
  kind: AttachmentKind;
  mimeType: string;
  size: number;
  /** Preview URL. Object URLs do not survive a reload; they are dropped on hydrate. */
  url: string | null;
  /** Text content for small code/JSON/text files so they can be previewed. */
  textContent?: string;
  uploadedById: ID;
  createdAt: ISODate;
}

export interface Reaction {
  emoji: string;
  userIds: ID[];
}

export interface Comment {
  id: ID;
  projectId: ID;
  /** `null` for project-level discussion posts. */
  taskId: ID | null;
  parentId: ID | null;
  authorId: ID;
  body: string;
  reactions: Reaction[];
  createdAt: ISODate;
  editedAt: ISODate | null;
}

export interface Activity {
  id: ID;
  actorId: ID;
  /** Verb phrase, e.g. "moved", "changed the priority of". */
  action: string;
  /** Quoted subject, e.g. a task title. */
  target?: string;
  from?: string;
  to?: string;
  projectId: ID | null;
  taskId: ID | null;
  clientId: ID | null;
  createdAt: ISODate;
}

export interface AppNotification {
  id: ID;
  actorId: ID;
  message: string;
  href: string;
  read: boolean;
  createdAt: ISODate;
}

/** Calendar date without a time or timezone: `yyyy-MM-dd`. */
export type DateKey = string;

/** A set of national or regional holidays that members can be assigned to. */
export interface HolidayCalendar {
  id: ID;
  name: string;
  /** ISO 3166 country code the calendar was imported from, e.g. "IN". */
  countryCode: string | null;
  /** State or region code within the country, e.g. "MH". */
  regionCode: string | null;
}

/** `public` and `company` holidays are days off; `optional` ones are informational. */
export type HolidayKind = "public" | "optional" | "company";

export interface Holiday {
  id: ID;
  /** `null` for company-wide holidays that apply to every member. */
  calendarId: ID | null;
  name: string;
  date: DateKey;
  kind: HolidayKind;
}

export interface LeaveType {
  id: ID;
  name: string;
  color: string;
  /** Days per calendar year. `null` means no limit (e.g. unpaid leave). */
  allowance: number | null;
  paid: boolean;
  /** When false, requests are approved as soon as they are submitted. */
  requiresApproval: boolean;
}

export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export interface LeaveRequest {
  id: ID;
  userId: ID;
  typeId: ID;
  startDate: DateKey;
  endDate: DateKey;
  /** Only allowed for single-day requests. */
  halfDay: boolean;
  /** Working days taken, fixed when the request is submitted. */
  days: number;
  reason: string;
  status: LeaveStatus;
  reviewerId: ID | null;
  reviewNote: string;
  reviewedAt: ISODate | null;
  createdAt: ISODate;
}

export type ThemePreference = "light" | "dark" | "system";

export interface NotificationPreferences {
  taskAssignments: boolean;
  comments: boolean;
  dueDateReminders: boolean;
  projectUpdates: boolean;
  emailDigest: boolean;
}

export interface Settings {
  theme: ThemePreference;
  language: string;
  notifications: NotificationPreferences;
}

export interface Session {
  userId: ID;
  signedInAt: ISODate;
}

export interface AppState {
  version: number;
  session: Session | null;
  organization: Organization;
  users: User[];
  clients: Client[];
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
  comments: Comment[];
  attachments: Attachment[];
  activities: Activity[];
  notifications: AppNotification[];
  holidayCalendars: HolidayCalendar[];
  holidays: Holiday[];
  leaveTypes: LeaveType[];
  leaveRequests: LeaveRequest[];
  settings: Settings;
}
