# FlowDesk

A project-management SaaS for client work — custom workflow stages per project, a ClickUp-style Kanban board, rich task details, calendar, team and reports. A user can belong to several **workspaces** (organizations), each fully isolated with its own clients, projects, team and time off.

**The UI currently runs on mock data** in the browser and persists to `localStorage`. The backend stack (below) is installed and its folders are scaffolded, but no APIs, schemas or auth are implemented yet.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 for the public landing page, then **Get started** to create an account. There is no demo data and no demo login: every account is real.

## How auth works

1. **Better Auth** handles identity. `src/lib/auth.ts` is the server config (Drizzle adapter on Neon, email + password, the organization plugin, email hooks); `src/lib/auth-client.ts` is the browser client; `/api/auth/*` is served by `src/app/api/auth/[...all]/route.ts`. Tables: `users`, `sessions`, `accounts`, `verifications`, `organizations`, `organization_members`, `invitations`.
2. **Sign up / sign in** (`src/app/(auth)/signup`, `login`) call `authClient.signUp.email` / `authClient.signIn.email`. Better Auth sets an httpOnly session cookie.
3. **`useAuthSync`** (`src/hooks/use-auth-sync.ts`) makes that session the source of truth: it mirrors the signed-in user into the local store (same user id) and signs the local store out when the real session ends. The dashboard shell, onboarding and auth pages route on its status (`loading` / `signed-out` / `signed-in`).
4. **Log out** (`src/hooks/use-logout.ts`) calls `authClient.signOut()` and then ends the local session.
5. **Emails** (Resend, `src/lib/resend.ts` + `src/lib/emails.ts`): password reset (`/forgot-password` → `/reset-password`), email verification on sign-up, and workspace invitations (`/accept-invitation/[id]`). Reserved test addresses (`@example.com`, `*.test`) are never emailed.

A new account has no workspace, so it lands on onboarding ("Create your first workspace").

**Not in the database yet:** workspaces and everything inside them (clients, projects, tasks, time off, …) are still kept in this browser's local store until each feature gets its own tables and API.

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm test` / `npm run test:watch` | Vitest unit tests (`src/**/*.test.ts(x)`) |
| `npm run test:e2e` | Playwright tests in `e2e/` (first run: `npx playwright install chromium`) |
| `npm run db:generate` / `db:migrate` / `db:push` / `db:studio` | Drizzle Kit against `DATABASE_URL` |

Copy `.env.example` to `.env.local` and fill in at least `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` (plus `RESEND_API_KEY` / `EMAIL_FROM` for emails), then run `npm run db:migrate`.

End-to-end tests sign up real `e2e.*@example.com` accounts; `e2e/global-teardown.ts` deletes them after every run.

## Stack

- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui (`components.json`, primitives in `src/components/ui`) on Radix UI · lucide-react · React Hook Form + Zod · dnd-kit · date-fns · Recharts · Sonner
- **Backend (inside Next.js):** Route Handlers → controllers → services → repositories → Drizzle ORM → Neon PostgreSQL, with Zod validation
- **Auth:** Better Auth
- **Storage:** Cloudinary (images, logos, videos, attachments)
- **Notifications:** PostgreSQL (in-app) · Firebase Cloud Messaging (push) · Resend (email)
- **Testing:** Vitest · Playwright

Not used: MongoDB, Prisma, Express, NestJS, Redux.

## What works

- **Auth (fake):** sign in, sign up, forgot password, Google button, sign out, route guard.
- **Workspaces:** switcher at the top of the sidebar (avatar only on the tablet sidebar; a sheet from **More** on phones), create workspace (name, editable URL slug, logo, website), first-workspace onboarding (`/onboarding`), and **Settings → Manage workspaces** (`/settings/workspaces`: open, rename/re-logo, leave, delete). Switching updates every screen in place; if you are viewing another workspace's project or client you are sent to `/projects` or `/clients`. Roles are per workspace, and every workspace must keep at least one Owner.
- **Dashboard:** metrics with a This week / This month / All time range, task progress donut, recent activity, upcoming deadlines, My Tasks (complete from the list), project progress.
- **Clients:** search, status filter, bulk select, add / edit / delete / change status. The detail page has contacts, editable notes, projects and activity.
- **Projects:** grid with status tabs, client filter and sort. Create from a workflow template, edit, star, archive, delete.
- **Project tabs:** Overview, Tasks (board/list), Files, Discussions, Timeline (Gantt-style), Activity (filterable), Settings.
- **Custom stages:** add, rename, recolor, reorder by drag, mark or unmark as completed, and delete with a "move tasks to…" prompt. Available from project settings and from each board column's menu.
- **Kanban:** drag between columns, reorder within a column, and use the keyboard (Space to pick up, arrows to move, Enter to open). Also: quick-add per column, add stage inline, search, filters, group by Stage or Priority, and a Board/List toggle.
- **Task drawer:** a right-side drawer on desktop (expandable) and a full-screen sheet on mobile. You can edit the stage, priority, assignees, due date, tags, title and a markdown description. It also has a sortable checklist, comments with replies, @mentions, reactions, emoji and file attachments, a Files tab (images, videos, PDFs, code with previews), and an Activity history.
- **Global:** a Tasks page across projects, a Calendar (month/week/day, click a task to open it, double-click a day to create one), Team (members of the active workspace: invite, change role, deactivate, remove, leave), and Reports (Recharts).
- **Time off:** leave types with fixed yearly allowances, requests (full or half day) that count only working days, and approval by Owners/Admins (never your own request). Also: balances, a "Who's out" view, national holidays imported per country/state (via `date-holidays`) plus company holidays, a configurable working week, and a holiday calendar per member. Holidays and approved leave appear on the Calendar and the Team page.
- **Settings:** Profile (with photo upload), Organization (for the *active* workspace: General, Members, Working week, Holiday calendar, Danger zone), Appearance (Light/Dark/System), Notifications.
- **Across the app:** Ctrl/⌘+K search palette, notifications, toasts, empty states, skeletons and confirmation dialogs. Layouts are responsive at 375 / 768 / 1024 / 1440+. Tablet uses an icon sidebar; mobile uses a bottom nav with a FAB.

## Architecture

```
src/
  app/
    page.tsx           Public landing page (server-rendered; auth-aware header/CTAs in components/landing)
    (auth)/            login, signup, forgot-password
    (dashboard)/       Authenticated shell: dashboard, clients, projects, tasks, calendar, team, reports, settings (+ settings/workspaces)
    onboarding/        First workspace for users who belong to none
    api/               Route Handlers (scaffolded, empty): auth, clients, projects, tasks, comments, notifications, uploads
  components/
    ui/                shadcn/ui primitives (button, dialog, dropdown, tabs, …)
    shared/            Avatars, badges, pickers, rich text, activity feed, …
    layout/            Sidebar, topbar, mobile nav, search palette, notifications
    tasks/ projects/ clients/ team/ calendar/ dashboard/ reports/ settings/
    comments/ attachments/ auth/ time-off/
    workspace/         Switcher, mobile sheet, create/edit/leave/delete dialogs, workspace form, org avatar
    providers/         App providers, UI provider (drawer / dialogs / search mounted once)
  controllers/         HTTP layer: parse + validate request, call a service, shape the response   (placeholders)
  services/            Business rules and orchestration; talks only to repositories                (placeholders)
  repositories/        Drizzle queries, no business rules                                          (placeholders)
  validators/          Zod request schemas shared by controllers and forms (leave, holiday, organization; others placeholders)
  db/
    index.ts           Drizzle client over Neon (server-only)
    schema/            One file per table, re-exported from schema/index.ts                        (placeholders)
    migrations/        Output of `npm run db:generate`
  lib/                 utils, dates, time-off (working-day rules), holidays (date-holidays lookup), organizations (slugs + role/Owner rules),
                       and integration clients: auth, auth-client, cloudinary, firebase, resend,
                       permissions, errors (integration files are placeholders)
  constants/           Priorities, statuses, colors, roles
  hooks/               Shared client hooks (useProject, useLogout)
  store/               Client-side mock data layer (see below)
    store.ts           useSyncExternalStore store + localStorage persistence
    hooks.ts           useWorkspace, useRootState, useCurrentUser, useUserWorkspaces, useHydrated
    organization.ts    Organization scoping: selectWorkspace, memberships, roles, safePathForWorkspace
    selectors.ts       Pure derived views over the active workspace (re-exports organization.ts)
    actions/           Mutations the UI calls (createTask, moveTask, addStage, createOrganization, switchOrganization, …)
    initial-state.ts   The empty store every browser starts with
  types/               Domain types shared by UI and (later) the API
e2e/                   Playwright specs
```

Server request flow, once implemented:

```
app/api/**/route.ts → controllers/*.controller.ts → services/*.service.ts → repositories/*.repository.ts → db (Drizzle) → Neon
```

### Data flow today, and swapping in the backend

- The persisted state is **normalized** like the future tables: `organizations`, `organizationMembers`, `users`, and org-owned records (`clients`, `projects`, `activities`, `notifications`, `holidayCalendars`, `holidays`, `leaveTypes`, `leaveRequests`) carrying `organizationId`. Stages, tasks, comments and attachments belong to an organization through their project. `activeOrganizationId` picks the workspace shown and is resolved against the user's memberships (falling back to their first workspace, or to onboarding).
- Components **read** state with `useWorkspace()` / `useCurrentUser()`. `useWorkspace()` returns the state already scoped to the active organization (`selectWorkspace` in `src/store/organization.ts`, the only place that filters by `organizationId`), and the pure functions in `src/store/selectors.ts` derive views from it. `useRootState()` is the unscoped state, used only by workspace-level UI (switcher, onboarding, workspace management).
- Roles live on the **membership** (`OrganizationMember.role`), never on `User`. `useCurrentUser()` returns a `Member` (user + membership) whose `role` is the role in the active workspace. Role rules (including "at least one Owner") are pure functions in `src/lib/organizations.ts`.
- Components **never write state directly**. Every mutation goes through an action in `src/store/actions/*`, for example `createTask`, `updateTask`, `moveTask`, `addStage`, `deleteStage(id, moveTo)`, `addComment`, `addAttachments`, `createOrganization`, `switchOrganization`, `updateOrganizationMemberRole` and `leaveOrganization`. Actions stamp new records with the active `organizationId`, reject cross-workspace references (e.g. a project using another workspace's client), and record activity entries.
- Time-off rules that don't depend on the UI (working days, leave-day counting) live in `src/lib/time-off.ts`, and form payloads in `src/validators/{leave,holiday}.validator.ts`, so the future `leave.service.ts` and controllers can reuse them as-is.
- `src/store/store.ts` is a small `useSyncExternalStore` store. Writes to `localStorage` are debounced and flushed when the page is hidden. Saved state is versioned (`STATE_VERSION = 5`); saves from another version are discarded.

To connect the real backend, re-implement the actions in `src/store/actions` as calls to `/api/*` (with optimistic updates, or a query cache) and replace `useWorkspace` reads with data fetching scoped to the active organization; then the local store can go. Better Auth will provide the user identity only; workspace access and roles come from the `organization_members` table. The shapes in `src/types` are designed to map onto the Drizzle tables in `src/db/schema`. Stages are their own collection keyed by `projectId`, and tasks reference `stageId` plus an `order`, so there is no fixed status enum.

## Local-store limitations

- **Uploads stay in the browser.** Images of 350 KB or less and text/code files of 64 KB or less are stored inline, so their previews survive a reload. Larger files, videos and PDFs use `URL.createObjectURL`: they preview during the session, and after a reload they show "Preview not available".
- **Storage is limited.** `localStorage` holds about 5 MB. If it fills up, a console warning is logged and new changes stop persisting.
- **Some things are simulated.** In-app notifications, inviting from the Team page and the language setting are local only. (Password reset and invitation emails are real — see "How auth works".)
