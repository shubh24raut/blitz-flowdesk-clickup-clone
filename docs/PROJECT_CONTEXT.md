# FlowDesk — Project Context

> Paste this whole document into a new conversation to give an assistant the full picture.
> Snapshot date: 30 Sep 2026.

## 1. What FlowDesk is

FlowDesk is a project-management SaaS for agencies and teams that do client work, similar in spirit to ClickUp. The main ideas:

- **Clients → Projects → Tasks.** Every project can belong to a client.
- **Custom workflow stages per project.** There is no fixed status enum: each project has its own ordered stages (e.g. Backlog → Design → Development → QA → Client Review → Done), and any stage can be marked "completed".
- **ClickUp-style Kanban board** with drag and drop, plus list, calendar and timeline views.
- **Team, time off (leave + holidays), reports and settings** around that.

FlowDesk is **multi-organization**: a user can belong to several workspaces (organizations) and switch between them. Each workspace is fully isolated: its own clients, projects, tasks, team, roles, time-off policies, holidays and settings. The main demo workspace is "Dream Kasper LLP", an Indian team of 8 people; a tiny second workspace, "Northwind Studio", exists for trying out switching.

## 2. Current status (important)

| Area | Status |
|---|---|
| UI / frontend | **Done and working.** Every feature below is usable. |
| Data | **Mock only.** All data lives in the browser (`localStorage`) through a small client-side store. There is no API and no database yet. |
| Backend | **Scaffolded, not implemented.** Folders and placeholder files exist for route handlers, controllers, services, repositories, Drizzle schemas and integrations. They contain only a one-line comment plus `export {};`. |
| Auth | **Fake.** Any existing user's email signs you in as that user (any 6+ character password). `demo@flowdesk.com` / `password` signs in as Shubham. An unknown email creates an account with no workspace and goes to onboarding. |
| Workspaces | **Done (mock).** Memberships with per-workspace roles, workspace switcher, create / rename / leave / delete workspace, onboarding for users with no workspace. |
| Tests | Vitest unit tests (pure logic, organization scoping, role rules, localStorage migration) and Playwright end-to-end tests (sign-in, time off, workspace switching and creation) pass. |

The next big phase is building the real backend with the architecture in section 4 and swapping the mock store for API calls.

## 3. Tech stack (final, decided)

**Frontend**
- Next.js 16 (App Router), React 19, TypeScript 6 (strict)
- Tailwind CSS 4 (CSS-first config, tokens in `src/app/globals.css`, class-based dark mode)
- shadcn/ui conventions (`components.json`, primitives in `src/components/ui`) on the unified `radix-ui` package
- lucide-react icons, React Hook Form + Zod 4, dnd-kit, Recharts 3, Sonner (toasts), date-fns 4

**Backend (inside Next.js, not yet implemented)**
- Next.js Route Handlers → Controllers → Services → Repositories → Drizzle ORM → Neon PostgreSQL
- Zod validation shared between forms and controllers
- Auth: **Better Auth**
- Database: **Neon PostgreSQL**, ORM **Drizzle ORM**, migrations **Drizzle Kit**
- Storage: **Cloudinary** (images, logos, videos, attachments)
- Notifications: **PostgreSQL** (in-app), **Firebase Cloud Messaging** (push), **Resend** (email)
- National holidays: **date-holidays** npm package (offline data, ~200 countries plus their states)

**Testing:** Vitest (+ jsdom, Testing Library) and Playwright (Chromium).

**Explicitly NOT used:** MongoDB, Prisma, Express, NestJS, Redux. Don't suggest them.

> Note: Next.js 16 has breaking changes from older versions. The repo has an `AGENTS.md` telling coding agents to read `node_modules/next/dist/docs/` before writing Next-specific code. Don't assume Next 13/14 APIs.

## 4. Architecture

### 4.1 Target server flow (once the backend is built)

```text
app/api/**/route.ts      (Route Handler — thin)
  → controllers/*.controller.ts     parse request, validate with Zod, call service, shape HTTP response
  → services/*.service.ts           business rules, permissions, orchestration, notifications
  → repositories/*.repository.ts    Drizzle queries only, no business rules
  → db (Drizzle client)             src/db/index.ts, Neon HTTP driver, server-only
  → Neon PostgreSQL
```

### 4.2 Current client data flow (mock phase)

- The persisted `AppState` is **normalized** like the future tables: `organizations`, `organizationMembers`, `users`, plus org-owned collections carrying `organizationId`. `activeOrganizationId` says which workspace the UI shows; it is resolved against the signed-in user's memberships (stored choice → first workspace → `null`, which sends the user to `/onboarding`).
- **Organization scoping lives in one place:** `selectWorkspace(state)` in `src/store/organization.ts` returns a `WorkspaceState` (the state filtered to the active organization, memoised per snapshot). Components read it with `useWorkspace()` / `useCurrentUser()` and derive views with the pure functions in `src/store/selectors.ts`, so no component filters by `organizationId` itself. `useRootState()` (unscoped) is only for workspace-level UI: switcher, onboarding, manage workspaces.
- Org selectors/helpers: `getActiveOrganization`, `getOrganizationsForUser`, `getUserWorkspaces`, `getCurrentMembership`, `getCurrentRole`, `isCurrentUserOwner`, `isCurrentUserAdmin`, `canManageOrganization`, `getOrganizationMembers/Clients/Projects/Tasks/LeaveRequests`, `resolveActiveOrganizationId`, `safePathForWorkspace` (where to go when the URL shows another workspace's project or client).
- Components **never write state directly.** Every mutation goes through an action in `src/store/actions/*` (e.g. `createTask`, `moveTask`, `requestLeave`, `reviewLeave`, and in `actions/organizations.ts`: `createOrganization`, `updateOrganization`, `switchOrganization`, `deleteOrganization`, `addOrganizationMember`, `updateOrganizationMemberRole`, `setOrganizationMemberStatus`, `removeOrganizationMember`, `leaveOrganization`). Actions stamp new records with the active `organizationId`, reject cross-workspace references (a project can't use another workspace's client; a task can't sit in another project's stage), and write activity-log entries.
- State is saved to `localStorage` (debounced), with versioned migrations in `src/store/migrations.ts` (`STATE_VERSION = 3`) so upgrades don't wipe demo data. v2 → v3 turned the single `organization` into the first workspace (Dream Kasper LLP), moved `User.role/status/holidayCalendarId` onto memberships and added `organizationId` to every org-owned record.
- **Plan for the switch:** re-implement the functions in `src/store/actions` as calls to `/api/*` (with optimistic updates or a query cache), replace `useWorkspace` reads with data fetching scoped to the active organization, then delete `src/store/seed`. Better Auth supplies only the user identity; workspace access and roles come from `organization_members`.
- Logic that doesn't depend on the UI is already kept outside React so the server can reuse it: `src/lib/time-off.ts` (working-day maths), `src/lib/organizations.ts` (slugs and role rules, including "every workspace keeps an Owner") and `src/validators/*` (Zod schemas).

### 4.3 Folder structure

```text
src/
├── app/
│   ├── page.tsx           public landing page (components/landing: header, CTAs, product preview)
│   ├── (auth)/            login, signup, forgot-password
│   ├── (dashboard)/       authenticated shell (layout guards the session and sends users with no workspace to /onboarding)
│   │   ├── dashboard/  clients/ clients/[clientId]/  projects/  projects/[projectId]/{overview,tasks,files,discussions,timeline,activity,settings}
│   │   ├── tasks/  calendar/  team/  time-off/  reports/  settings/  settings/workspaces/
│   ├── onboarding/        first-workspace screen
│   └── api/               auth, clients, projects, tasks, comments, notifications, uploads, leave, holidays   (empty, .gitkeep)
├── components/
│   ├── ui/                shadcn-style primitives (button, dialog, select, date-picker, tabs, …)
│   ├── layout/            sidebar, topbar, mobile nav, command search (Ctrl/⌘+K), notifications menu
│   ├── shared/            avatars, badges, pickers, markdown editor, empty state, page header, …
│   ├── tasks/ projects/ clients/ team/ calendar/ dashboard/ reports/ settings/
│   ├── comments/ attachments/ auth/ time-off/
│   ├── workspace/         switcher, mobile sheet, create / edit / leave / delete dialogs, workspace form, logo picker, org avatar
│   └── providers/         app providers, UI provider (task drawer / dialogs / search mounted once)
├── controllers/           client, project, task, comment, leave, holiday          (placeholders)
├── services/              client, project, task, notification, permission, leave, holiday, availability (placeholders)
├── repositories/          client, project, task, comment, leave, holiday          (placeholders)
├── validators/            leave + holiday + organization (real Zod schemas); client/project/task/comment (placeholders)
├── db/
│   ├── index.ts           Drizzle client over Neon (real, not yet imported anywhere)
│   ├── schema/            auth, users, organizations, organization-members, clients, projects, project-stages,
│   │                      tasks, comments, attachments, notifications, activity-logs,
│   │                      holiday-calendars, holidays, leave-types, leave-requests   (placeholders, barrel in index.ts)
│   └── migrations/        drizzle-kit output
├── lib/                   utils, dates, time-off (pure rules), holidays (date-holidays wrapper), organizations (slugs, role rules),
│                          auth, auth-client, cloudinary, firebase, resend, permissions, errors (placeholders)
├── constants/             priorities, statuses, colors, roles, leave/holiday styles, weekdays
├── hooks/                 useProject, useLogout
├── store/                 mock data layer: store.ts, hooks.ts, organization.ts (scoping), selectors.ts, migrations.ts, actions/, seed/
└── types/                 domain types shared by UI and (later) the API
e2e/                       Playwright specs
drizzle.config.ts  vitest.config.ts  playwright.config.ts  components.json  .env.example
```

Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e`, `db:generate`, `db:migrate`, `db:push`, `db:studio`.

Environment variables (see `.env.example`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, Google OAuth keys, Cloudinary keys, `RESEND_API_KEY`, `EMAIL_FROM`, Firebase web keys + VAPID key, Firebase Admin credentials, `NEXT_PUBLIC_APP_URL`.

## 5. Domain model (current TypeScript types)

These types were designed to map directly onto future Drizzle tables. IDs are strings, timestamps are ISO strings, and **calendar dates for time off are `yyyy-MM-dd` "DateKey" strings** (no timezone).

```ts
type Role = "Owner" | "Admin" | "Member";
type MemberStatus = "Active" | "Invited" | "Inactive";

// Accounts vs. workspace access: a User has no role; access and role come from OrganizationMember.
User          { id, name, email, title, color, avatarUrl?, createdAt }
Organization  { id, name, slug /* unique, flowdesk.app/<slug> */, logoUrl?, website, plan: "Free"|"Pro"|"Business",
                workingDays: number[] /* Date#getDay, 0 = Sun */, defaultHolidayCalendarId: ID | null, createdAt, updatedAt }
OrganizationMember { id, organizationId, userId, role: Role, status: MemberStatus, joinedAt, holidayCalendarId: ID | null /* null = org default */ }
Member        = User & { membershipId, organizationId, role, status, joinedAt, holidayCalendarId }   // UI view: a user inside one workspace

// organizationId is on every org-owned record. Stage, Task, Comment and Attachment belong to an organization through their project.
Client        { id, organizationId, name, contactPerson, email, phone, website, industry, address, status: "Active"|"Inactive"|"Lead", color, notes, contacts: ClientContact[], createdAt }
Project       { id, organizationId, name, description, clientId: ID|null, status: "Active"|"On Hold"|"Completed"|"Archived", color, startDate, dueDate, memberIds: ID[], starred, key /* "FD" → FD-123 */, createdAt }
Stage         { id, projectId, name, color, order, isCompleted }          // per-project workflow columns
Task          { id, number, projectId, stageId, order, title, description (markdown), priority: "Low"|"Medium"|"High"|"Urgent",
                assigneeIds: ID[], dueDate, tags: string[], checklist: ChecklistItem[], createdById, createdAt, updatedAt, completedAt }
ChecklistItem { id, text, done, assigneeId }
Comment       { id, projectId, taskId: ID|null /* null = project discussion */, parentId, authorId, body, reactions: {emoji, userIds}[], createdAt, editedAt }
Attachment    { id, projectId, taskId, commentId, name, kind: "image"|"video"|"pdf"|"code"|"file", mimeType, size, url, textContent?, uploadedById, createdAt }
Activity      { id, organizationId, actorId, action, target?, from?, to?, projectId, taskId, clientId, createdAt }
AppNotification { id, organizationId, actorId, message, href, read, createdAt }       // sample data; the menu shows the active workspace's

// Time off
HolidayCalendar { id, organizationId, name, countryCode: string|null /* "IN" */, regionCode: string|null /* "MH" */ }
Holiday         { id, organizationId, calendarId: ID|null /* null = company-wide, applies to everyone */, name, date: DateKey, kind: "public"|"optional"|"company" }
LeaveType       { id, organizationId, name, color, allowance: number|null /* days per year; null = no limit */, paid, requiresApproval }
LeaveRequest    { id, organizationId, userId, typeId, startDate: DateKey, endDate: DateKey, halfDay /* single-day only */, days /* fixed at submission */,
                  reason, status: "Pending"|"Approved"|"Rejected"|"Cancelled", reviewerId, reviewNote, reviewedAt, createdAt }

AppState { version, session, activeOrganizationId, organizations, organizationMembers, users, clients, projects, stages, tasks,
           comments, attachments, activities, notifications, holidayCalendars, holidays, leaveTypes, leaveRequests, settings }
```

## 6. Features (all working on mock data)

**Across the app:** responsive layout (375 / 768 / 1024 / 1440+; icon sidebar on tablet, bottom nav + FAB on phones), light/dark/system theme, Ctrl/⌘+K search palette, notifications menu, toasts, empty states, skeletons, confirmation dialogs.

- **Landing page (`/`):** public, server-rendered marketing page — hero with an in-code product preview, features grid, spotlights (custom workflows, workspaces, time off), how it works, final CTA and footer. The header and CTAs are auth-aware ("Open FlowDesk" when signed in); "Try the live demo" signs in as the demo user.
- **Auth (fake):** sign in, sign up, forgot password, "Continue with Google", sign out, route guard. New users go sign-up → `/onboarding` (create first workspace) → empty dashboard.
- **Workspaces:** switcher at the top of the sidebar (avatar only on the tablet sidebar; "More → Workspace" sheet on phones) listing each workspace with your role there, a check on the current one and unread-notification counts for the others. Switching is instant (toast "Switched to …") and every screen follows; if you are on another workspace's project or client you are redirected to `/projects` or `/clients`, and a task drawer from the old workspace closes. **Create workspace** dialog (name, auto-generated editable slug with duplicate check, logo upload or initials, website) makes you Owner, adds default leave types and switches to it. `/onboarding` for users with no workspace ("I have an invitation" is prepared visually). `/settings/workspaces` lists your workspaces with role, member and project counts, and Open / Rename or change logo / Workspace settings / Leave / Delete (by role).
- **Dashboard:** metrics (week / month / all time), task progress donut, recent activity, upcoming deadlines, My Tasks, project progress.
- **Clients:** search, status filter, bulk select, CRUD, status changes; detail page with contacts, notes, projects and activity.
- **Projects:** grid with status tabs, client filter and sort; create from a workflow template (Agency delivery, Product build, Simple); edit, star, archive, delete. Project tabs: Overview, Tasks (board/list), Files, Discussions, Timeline (Gantt-style), Activity, Settings.
- **Custom stages:** add, rename, recolor, reorder by drag, mark completed, delete with a "move tasks to…" prompt.
- **Kanban:** drag between and within columns, keyboard support, quick add, inline add-stage, search, filters, group by Stage or Priority, Board/List toggle.
- **Task drawer:** right-side drawer on desktop, full-screen sheet on phones. Edit stage, priority, assignees, due date, tags, title and markdown description; sortable checklist; comments with replies, @mentions, reactions and attachments; Files tab with previews; activity history.
- **Global Tasks page**, **Calendar** (month/week/day; shows tasks, holidays and who's on leave; double-click a day to create a task; "Time off" shortcut per day), **Team** (members of the active workspace: invite, change role, deactivate, remove, leave; "Out today" count and "On leave" badges), **Reports** (Recharts).
- **Settings:** Profile (photo upload), Organization (the *active* workspace: General, Members, Working week, Holiday calendar, Danger zone), Appearance, Notifications, Data (reset demo data).

### 6.1 Time off module

Route: `/time-off` with tabs `?tab=mine | approvals | team | holidays | policies`.

- **My leave:** one balance card per leave type (left / allowance, used, pending), my requests (cancellable), upcoming holidays.
- **Approvals** (Owner/Admin only): pending requests with quick Approve/Reject (optional note), plus recent decisions.
- **Who's out:** 14-day availability strip and approved leave for the next 60 days.
- **Holidays:** filter by calendar and year. Admins can add, edit and delete holidays and **import national holidays** by country and optional state (date-holidays is loaded only when the import dialog opens; the dialog shows a preview before importing).
- **Policies** (Owner/Admin only): working week, leave types (allowance, paid, needs approval), holiday calendars (set default, delete), and which calendar each member follows.
- **Request dialog:** counts working days as you pick dates and shows "Not counted: 2 weekend days, Gandhi Jayanti (Oct 2)". The date picker marks holidays with a dot and dims weekends.
- **Leave detail drawer:** click any request row (URL `?leave=<id>`, so it can be linked from notifications). It shows the summary and reason; the person's balance (Allowance / Taken / Pending / Left); a day-by-day list (counted / weekend / holiday, plus who else is off each day); history (requested, approved or rejected by whom, with note, or auto-approved or cancelled); and actions (Approve / Reject / Cancel).

**Business rules (currently in `src/store/actions/time-off.ts`; they will move to `leave.service.ts`):**
1. Leave days = working days in the range, excluding non-working weekdays and `public` / `company` holidays on the **requester's** calendar. `optional` holidays are informational and still count. A half day = 0.5 and is allowed only for single-day requests.
2. A request that falls entirely on days off is rejected ("no leave needed").
3. No overlap with the requester's own Pending or Approved requests.
4. **Fixed yearly allowance** (no accrual, no carry-over yet). A request counts toward the year it starts in. Remaining = allowance − approved − pending. A request can't exceed what's remaining.
5. Leave types with `requiresApproval = false` (e.g. Sick leave) are approved on submission.
6. **Only Owners and Admins can approve or reject, and never their own request.**
7. Members can cancel their own Pending requests, or Approved ones that haven't ended.
8. `days` is fixed when the request is submitted; later holiday or working-week changes don't change existing requests. (Known limit: the "Not counted" explanation is computed live, so it can drift if holidays are edited afterwards.)
9. Each member follows one holiday calendar per workspace (stored on the membership; or the organization default), plus company-wide holidays.
10. Removing a member from a workspace deletes their leave requests in that workspace only; deleting a calendar moves its members to the default.
11. Everything above is per workspace: working week, leave types, calendars, holidays, requests and approvers never cross workspaces.

Seed data (Dream Kasper LLP): India — Maharashtra calendar (fixed-date public holidays for this year and next), two company holidays, four leave types (Casual 12, Sick 8 auto-approved, Earned 15, Unpaid unlimited), and sample requests (pending, approved, rejected, someone on leave today). Northwind Studio has its own England calendar and leave types (Annual 20, Sick unlimited).

## 7. Roles and demo logins

Roles are **per workspace** (on `OrganizationMember`), resolved from `currentUserId + activeOrganizationId`. The same person can be Owner in one workspace and Member in another.

| Role | Can do |
|---|---|
| Owner | Everything, including granting/removing the Owner role and deleting the workspace. **Every workspace must keep at least one active Owner**: the last Owner can't be demoted, deactivated, removed or leave (the UI explains why). |
| Admin | Edit workspace settings, manage team (invite, change Admin/Member roles, deactivate, remove — not Owners), approve leave, manage time-off policies and holidays. |
| Member | Everything project-related; request and cancel their own leave; view holidays and who's out. No Approvals or Policies tabs. |

Demo users (any 6+ character password): `demo@flowdesk.com` (Shubham Raut — Owner of Dream Kasper LLP, Member of Northwind Studio), `rohan@dreamkasper.com` (Admin), `sneha@dreamkasper.com` (Admin), `ananya@`, `karan@`, `isha@`, `vikram@dreamkasper.com` (Members), `chloe@northwind.studio` (Owner of Northwind Studio only).

## 8. Conventions

- Keep responsibilities separated: UI → store actions today, and controller → service → repository on the server later. No business rules in components or repositories.
- Zod schemas live in `src/validators/*.validator.ts` and are used by forms (React Hook Form + `zodResolver`) and, later, controllers.
- Pure domain logic goes in `src/lib/` with no React imports, so it's testable and reusable on the server (e.g. `lib/time-off.ts` has unit tests).
- UI uses the shared primitives in `components/ui` (custom `Select` on Radix, custom `DatePicker`, `Dialog` that becomes a bottom sheet on phones, `ConfirmDialog`), with design tokens rather than raw colors. It must work in both light and dark mode.
- Org scoping belongs in selectors/actions (`store/organization.ts`), never in components. New org-owned data gets an `organizationId` and a scoped slice in `selectWorkspace`.
- Drawers for detail views (tasks, leave requests), dialogs for create/edit forms, and URL query params for linkable state (`?tab=`, `?leave=`, `?request=<date>`).

## 9. Open topics and likely next steps

1. **Backend phase:** Drizzle schemas for all tables (the Better Auth tables plus `organizations` and `organization_members`, with `organization_id` on org-owned tables), repositories, services, controllers and route handlers; then replace `store/actions` with API calls. Every query must be scoped by the active organization.
2. **Auth:** Better Auth with email/password + Google for identity only; workspace access and roles from `organization_members`; session + membership checks in route handlers. Decide how the active organization travels (session field, cookie or URL).
3. **Permissions:** extend the pure rules in `lib/organizations.ts` into a `lib/permissions.ts` role → permission map used by `permission.service.ts`.
4. **Invitations:** real invite emails and accepting them (the onboarding "I have an invitation" screen is a placeholder).
5. **Notifications:** leave requested → approvers; approved/rejected → requester; task assignment, mentions and due dates. In-app (PostgreSQL) + FCM push + Resend email, driven by `notification.service.ts`. Leave notifications should link to `/time-off?leave=<id>`.
6. **Uploads:** move attachments, avatars and workspace logos to Cloudinary (signed uploads).
7. **Time-off extensions (not built yet):** accrual and carry-over (currently a fixed yearly allowance), per-team approvers or managers (currently any Owner/Admin), warnings when a task's due date or assignee falls on a holiday or approved leave, storing the skipped-days breakdown on the request, and an `availability.service.ts` for "is this person working on date D?".
8. **Driver choice:** `db/index.ts` uses Neon's HTTP driver, which has no interactive transactions. Operations like reordering tasks may need the WebSocket driver.

## 10. How to help in discussions

- Stay within the stack above (no Prisma, MongoDB, Express, NestJS or Redux).
- Respect the layering (route handler → controller → service → repository → Drizzle).
- When proposing schema, keep field names aligned with the TypeScript types in section 5, since the UI already depends on them.
- Keep data isolated per organization; never put a single `organizationId` or a global role on `User`.
- The frontend is finished, so prefer changes that fit the existing screens rather than redesigns.
