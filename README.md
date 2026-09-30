# FlowDesk

A project-management SaaS for client work — custom workflow stages per project, a ClickUp-style Kanban board, rich task details, calendar, team and reports.

**The UI currently runs on mock data** in the browser and persists to `localStorage`. The backend stack (below) is installed and its folders are scaffolded, but no APIs, schemas or auth are implemented yet.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with:

| Email | Password |
| --- | --- |
| `demo@flowdesk.com` | `password` |

Any valid-looking email and password (6+ characters) also works. An existing member's email signs in as that member; an unknown email creates a new member. "Continue with Google" signs in as the demo user.

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm test` / `npm run test:watch` | Vitest unit tests (`src/**/*.test.ts(x)`) |
| `npm run test:e2e` | Playwright tests in `e2e/` (first run: `npx playwright install chromium`) |
| `npm run db:generate` / `db:migrate` / `db:push` / `db:studio` | Drizzle Kit against `DATABASE_URL` |

Copy `.env.example` to `.env.local` before working on anything backend-related.

To start over, use **Settings → Data → Reset demo data** (or *Reset demo data* in the avatar menu).

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
- **Dashboard:** metrics with a This week / This month / All time range, task progress donut, recent activity, upcoming deadlines, My Tasks (complete from the list), project progress.
- **Clients:** search, status filter, bulk select, add / edit / delete / change status. The detail page has contacts, editable notes, projects and activity.
- **Projects:** grid with status tabs, client filter and sort. Create from a workflow template, edit, star, archive, delete.
- **Project tabs:** Overview, Tasks (board/list), Files, Discussions, Timeline (Gantt-style), Activity (filterable), Settings.
- **Custom stages:** add, rename, recolor, reorder by drag, mark or unmark as completed, and delete with a "move tasks to…" prompt. Available from project settings and from each board column's menu.
- **Kanban:** drag between columns, reorder within a column, and use the keyboard (Space to pick up, arrows to move, Enter to open). Also: quick-add per column, add stage inline, search, filters, group by Stage or Priority, and a Board/List toggle.
- **Task drawer:** a right-side drawer on desktop (expandable) and a full-screen sheet on mobile. You can edit the stage, priority, assignees, due date, tags, title and a markdown description. It also has a sortable checklist, comments with replies, @mentions, reactions, emoji and file attachments, a Files tab (images, videos, PDFs, code with previews), and an Activity history.
- **Global:** a Tasks page across projects, a Calendar (month/week/day, click a task to open it, double-click a day to create one), Team (invite, change role, deactivate, remove), and Reports (Recharts).
- **Settings:** Profile (with photo upload), Organization, Appearance (Light/Dark/System), Notifications.
- **Across the app:** Ctrl/⌘+K search palette, notifications, toasts, empty states, skeletons and confirmation dialogs. Layouts are responsive at 375 / 768 / 1024 / 1440+. Tablet uses an icon sidebar; mobile uses a bottom nav with a FAB.

## Architecture

```
src/
  app/
    (auth)/            login, signup, forgot-password
    (dashboard)/       Authenticated shell: dashboard, clients, projects, tasks, calendar, team, reports, settings
    api/               Route Handlers (scaffolded, empty): auth, clients, projects, tasks, comments, notifications, uploads
  components/
    ui/                shadcn/ui primitives (button, dialog, dropdown, tabs, …)
    shared/            Avatars, badges, pickers, rich text, activity feed, …
    layout/            Sidebar, topbar, mobile nav, search palette, notifications
    tasks/ projects/ clients/ team/ calendar/ dashboard/ reports/ settings/
    comments/ attachments/ auth/
    providers/         App providers, UI provider (drawer / dialogs / search mounted once)
  controllers/         HTTP layer: parse + validate request, call a service, shape the response   (placeholders)
  services/            Business rules and orchestration; talks only to repositories                (placeholders)
  repositories/        Drizzle queries, no business rules                                          (placeholders)
  validators/          Zod request schemas shared by controllers and forms                          (placeholders)
  db/
    index.ts           Drizzle client over Neon (server-only)
    schema/            One file per table, re-exported from schema/index.ts                        (placeholders)
    migrations/        Output of `npm run db:generate`
  lib/                 utils, dates, and integration clients: auth, auth-client, cloudinary, firebase, resend,
                       permissions, errors (integration files are placeholders)
  constants/           Priorities, statuses, colors, roles, demo credentials
  hooks/               Shared client hooks (useProject, useLogout)
  store/               Client-side mock data layer (see below)
    store.ts           useSyncExternalStore store + localStorage persistence
    hooks.ts           useAppState, useCurrentUser, useHydrated
    selectors.ts       Pure derived views
    actions/           Mutations the UI calls (createTask, moveTask, addStage, …)
    seed/              Seed data (users, clients, projects + stages, tasks, comments, activity)
  types/               Domain types shared by UI and (later) the API
e2e/                   Playwright specs
```

Server request flow, once implemented:

```
app/api/**/route.ts → controllers/*.controller.ts → services/*.service.ts → repositories/*.repository.ts → db (Drizzle) → Neon
```

### Data flow today, and swapping in the backend

- Components **read** state with `useAppState()` / `useCurrentUser()` and derive views with the pure functions in `src/store/selectors.ts`.
- Components **never write state directly**. Every mutation goes through an action in `src/store/actions/*`, for example `createTask`, `updateTask`, `moveTask`, `addStage`, `deleteStage(id, moveTo)`, `addComment`, `addAttachments` and `inviteMember`. Actions also record activity entries.
- `src/store/store.ts` is a small `useSyncExternalStore` store. Writes to `localStorage` are debounced and flushed when the page is hidden.

To connect the real backend, re-implement the actions in `src/store/actions` as calls to `/api/*` (with optimistic updates, or a query cache) and replace `useAppState` reads with data fetching; then `src/store/seed` can go. The shapes in `src/types` are designed to map onto the Drizzle tables in `src/db/schema`. Stages are their own collection keyed by `projectId`, and tasks reference `stageId` plus an `order`, so there is no fixed status enum.

## Demo-mode limitations

- **Uploads stay in the browser.** Images of 350 KB or less and text/code files of 64 KB or less are stored inline, so their previews survive a reload. Larger files, videos and PDFs use `URL.createObjectURL`: they preview during the session, and after a reload they show "Preview not available".
- **Storage is limited.** `localStorage` holds about 5 MB. If it fills up, a console warning is logged and new changes stop persisting until you reset the demo data.
- **Some things are simulated.** Notifications are sample data. Invites, password reset and the language setting show a toast only.
