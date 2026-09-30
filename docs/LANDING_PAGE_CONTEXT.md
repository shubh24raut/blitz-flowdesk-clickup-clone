# FlowDesk — Landing Page Context

> Paste this document into a new conversation to give an assistant the full picture of FlowDesk's public landing page.
> For the rest of the product (stack, architecture, domain model), also paste `docs/PROJECT_CONTEXT.md`.
> Snapshot date: 30 Sep 2026.

## 1. Purpose

`/` is FlowDesk's public marketing page. It explains what FlowDesk is to first-time visitors and sends them into the app through one of two paths:

- **Get started** → `/signup` → `/onboarding` (create first workspace) → empty dashboard of the new workspace.
- **Try the live demo** → signs in immediately as the demo user (Shubham Raut, Owner of *Dream Kasper LLP*) → `/dashboard`.

Before this page existed, `/` only redirected to `/login` or `/dashboard`.

## 2. Files

| File | Kind | Role |
|---|---|---|
| `src/app/page.tsx` | Server Component | The page: `metadata`, all sections, copy arrays (`FEATURES`, `STEPS`), and the decorative spotlight visuals (`StagesVisual`, `WorkspacesVisual`, `TimeOffVisual`). |
| `src/components/landing/landing-actions.tsx` | Client Component (`"use client"`) | `LandingHeader` (sticky header + mobile menu) and `CtaButtons` (hero CTAs). Both are auth-aware. |
| `src/components/landing/product-preview.tsx` | Server Component | `ProductPreview`: a static, code-built mock of the app (window chrome, sidebar with workspace switcher, Kanban board). |
| `e2e/smoke.spec.ts` | Playwright | "landing page is public and links into the app" and "the live demo button signs in to the demo workspace". |

Shared pieces it reuses: `Logo` (`components/shared/logo`), `Button` (`components/ui/button`), `DEMO_CREDENTIALS` (`constants`), `signIn` (`store/actions/auth`), `useHydrated` / `useRootState` (`store/hooks`), lucide-react icons.

## 3. Rendering model

- The page is a **Server Component**, so the copy and layout are in the initial HTML (good for SEO and first paint). `metadata` is exported from it (only allowed in Server Components in Next 16):
  - title (absolute): `FlowDesk — Project management for client work`
  - description: clients, projects, tasks, team and time off in one place; custom stages per project; a separate workspace for every company.
- Only `LandingHeader` and `CtaButtons` are client code. They read the session from the mock store: `useSignedIn()` = `useHydrated() && useRootState().session !== null`. The server and the first client render show the **signed-out** variant; after hydration a signed-in visitor sees **Open FlowDesk** instead of the sign-up buttons.
- A signed-in visitor is **not** redirected away from `/`, so the page stays reachable from the logo.
- The demo button calls `signIn(DEMO_CREDENTIALS.email)`, toasts "Signed in to the demo as …", then `router.push("/dashboard")`.
- The page doesn't use the workspace data. The root layout still mounts `AppProviders` (theme sync, toaster, tooltips), so the landing page follows the **theme saved in the app's settings** (light / dark / system).

## 4. Page structure (top → bottom)

1. **Header** (`LandingHeader`, sticky, blurred background)
   - Logo → `/`.
   - Anchor nav: Features (`#features`), Workspaces (`#workspaces`), How it works (`#how-it-works`).
   - Signed out: **Log in** (ghost) → `/login`, **Get started** (primary) → `/signup`. Signed in: **Open FlowDesk →** → `/dashboard`.
   - Below `md`: a menu button (`aria-expanded`, `aria-controls="landing-menu"`) toggles a panel with the same links and buttons.
2. **Hero**
   - Pill: "Project management for client work".
   - H1: "Clients, projects and your team — **in one calm workspace.**" (second half in primary color).
   - Subtitle: every project gets its own workflow, a board teams enjoy, time off that plans around holidays, and each company in its own workspace.
   - `CtaButtons`: **Get started free →** (`/signup`) and **Try the live demo** (button). Signed in: **Open FlowDesk →**.
   - Note: "Free to try. The demo runs entirely in your browser — nothing to install."
   - `ProductPreview` below, over a soft gradient glow.
3. **Features** (`#features`): heading "Everything client work needs, nothing it doesn't" and a 6-card grid:
   Clients → Projects → Tasks · Your workflow, per project · A board that keeps up · Rich task details · Time off built in · Dashboards & reports.
   Below the grid: Ctrl/⌘+K search · Light & dark mode · Owner, Admin & Member roles.
4. **Spotlights** (lavender band), alternating text/visual:
   - *Custom workflows*: "Stages that match how each project really runs", with `StagesVisual` (draggable-looking stage list, Done marked Completed).
   - *Workspaces* (`#workspaces`): "One login, every company you work with", with `WorkspacesVisual` (switcher: Dream Kasper LLP ✓ Owner, Northwind Studio Member, Personal Workspace Owner).
   - *Time off*: "Leave that knows about weekends and holidays", with `TimeOffVisual` (three balance cards + "Fri → Mon · 2 days, Not counted: 2 weekend days").
5. **How it works** (`#how-it-works`): 3 numbered steps: Create your workspace → Add clients and projects → Invite your team.
6. **Final CTA** (purple band): "Bring your next project into FlowDesk" with **Create your workspace →** (`/signup`) and **Log in** (`/login`).
7. **Footer**: logo, links (Features, Workspaces, Log in, Sign up), "© {current year} FlowDesk".

## 5. The product preview

`ProductPreview` is decorative (`aria-hidden`) and uses the same design tokens as the app, so it matches both themes without image assets.

- Window chrome with a fake URL `flowdesk.app/dream-kasper`.
- Sidebar (≥ `md`): workspace switcher "DK · Dream Kasper LLP · Owner · 8 members", icon nav with Projects active.
- Board "Website Redesign" with tabs, and columns Backlog / Design / Development / Client Review (the last two only from `lg`). Cards have a tag, a title, an optional progress bar, a priority chip and initials avatars that match the seed people (SR, RK, AJ, KI, IM, SP).
- The card data is a local `COLUMNS` constant, so editing the preview never touches the real store.

## 6. Design rules followed

- Same tokens as the app (`bg-background`, `bg-card`, `bg-lavender`, `text-muted-foreground`, `text-primary`, `bg-primary-light`, `border-border`, `shadow-card/raised/overlay`), Inter font and purple palette. Works in light and dark mode.
- Responsive at 375 / 768 / 1024 / 1440+. Sections are `max-w-6xl`, padded `px-4 sm:px-6`, with `scroll-mt-20` so anchor links clear the sticky header.
- Tailwind v4 canonical classes (`bg-linear-to-*`, `size-112`, `rounded-4xl`, …).
- Honest copy: **no invented testimonials, customer logos, user counts or pricing.** Claims only describe features that exist in the app.
- Accessibility: one `h1`, section `h2`/`h3`, labelled `nav`s, decorative visuals `aria-hidden`, and a keyboard-operable mobile menu.

## 7. How to change things

- **Copy / feature cards / steps:** edit the `FEATURES` and `STEPS` arrays and the JSX text in `src/app/page.tsx`.
- **Header links or CTA behavior:** `NAV` and the components in `landing-actions.tsx`.
- **Preview board:** `COLUMNS` / `NAV` in `product-preview.tsx`.
- **SEO:** `metadata` in `src/app/page.tsx` (Open Graph images can be added with the Next 16 metadata file conventions, e.g. `app/opengraph-image.tsx`).
- Keep the page a Server Component. Anything needing the session, `localStorage` or event handlers goes into a small client component in `components/landing/`.

## 8. Open ideas (not built)

- Pricing section (plans already exist as `Free | Pro | Business` on `Organization`).
- FAQ, real testimonials or customer logos once there are real customers.
- Open Graph / social share image and a sitemap / robots file.
- Real screenshots or a short product video.
- Once the backend exists: "Get started" goes through Better Auth sign-up, and the demo becomes a shared read-only sandbox instead of local mock data.
