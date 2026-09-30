export type ID = string;
/** ISO-8601 timestamp or date string. */
export type ISODate = string;

export type Role = "Owner" | "Admin" | "Member";
export type MemberStatus = "Active" | "Invited" | "Inactive";

/**
 * An account (the identity Better Auth will provide). It carries no role or
 * workspace: access to an organization comes from an `OrganizationMember` row.
 */
export interface User {
  id: ID;
  name: string;
  email: string;
  title: string;
  /** Hex color used for the initials avatar. */
  color: string;
  /** Optional photo (data URL for locally uploaded avatars). */
  avatarUrl?: string;
  createdAt: ISODate;
}

export type OrganizationPlan = "Free" | "Pro" | "Business";

/** A workspace. Every client, project, holiday calendar and leave policy belongs to exactly one. */
export interface Organization {
  id: ID;
  name: string;
  /** Unique URL-safe handle, e.g. `dream-kasper` → flowdesk.app/dream-kasper. */
  slug: string;
  /** Data URL for locally uploaded logos; initials are shown when missing. */
  logoUrl?: string;
  website: string;
  plan: OrganizationPlan;
  /** Days of the week people normally work, as `Date#getDay()` numbers (0 = Sunday). */
  workingDays: number[];
  defaultHolidayCalendarId: ID | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** A user's membership in an organization. Role and status are per workspace, never global. */
export interface OrganizationMember {
  id: ID;
  organizationId: ID;
  userId: ID;
  role: Role;
  status: MemberStatus;
  joinedAt: ISODate;
  /** Holiday calendar this member follows in this workspace. `null` = organization default. */
  holidayCalendarId: ID | null;
}

/**
 * A user as seen inside one organization: account fields joined with their membership.
 * UI lists (team, pickers, avatars) work with this; `role` here is the membership role.
 */
export interface Member extends User {
  membershipId: ID;
  organizationId: ID;
  role: Role;
  status: MemberStatus;
  joinedAt: ISODate;
  holidayCalendarId: ID | null;
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
  organizationId: ID;
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
  organizationId: ID;
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
  organizationId: ID;
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
  /** Workspace the notification is about; the menu shows the active workspace's by default. */
  organizationId: ID;
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
  organizationId: ID;
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
  organizationId: ID;
  /** `null` for company-wide holidays that apply to every member. */
  calendarId: ID | null;
  name: string;
  date: DateKey;
  kind: HolidayKind;
}

export interface LeaveType {
  id: ID;
  organizationId: ID;
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
  organizationId: ID;
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

/**
 * The whole mock database, normalized like the future Postgres tables.
 * Stages, tasks, comments and attachments belong to an organization through their project.
 */
export interface AppState {
  version: number;
  session: Session | null;
  /** Workspace the UI is showing. Resolved against the user's memberships on read. */
  activeOrganizationId: ID | null;
  organizations: Organization[];
  organizationMembers: OrganizationMember[];
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

/**
 * Everything the UI may see while one organization is active: `AppState` scoped
 * to that organization by `selectWorkspace`. Components read this, never the raw state.
 */
export interface WorkspaceState {
  session: Session | null;
  settings: Settings;
  organization: Organization;
  /** The signed-in user's membership, or `null` when they belong to no organization. */
  membership: OrganizationMember | null;
  /** The signed-in user as a member of this organization (role = their role here). */
  currentUser: Member;
  /** Members of the organization (all statuses). */
  users: Member[];
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
}
