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
}

export interface Organization {
  id: ID;
  name: string;
  website: string;
  plan: "Free" | "Pro" | "Business";
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
  settings: Settings;
}
