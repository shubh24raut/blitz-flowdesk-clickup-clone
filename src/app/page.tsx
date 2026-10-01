import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChartColumn,
  Check,
  FolderKanban,
  GripVertical,
  LayoutDashboard,
  MessageSquareText,
  Palmtree,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CtaButtons, LandingHeader } from "@/components/landing/landing-actions";
import { ProductPreview } from "@/components/landing/product-preview";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: { absolute: "FlowDesk — Project management for client work" },
  description:
    "Clients, projects, tasks, team and time off in one place. Custom workflow stages per project, a fast Kanban board and separate workspaces for every company you work with.",
};

const FEATURES: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: UsersRound, title: "Clients → Projects → Tasks", text: "Keep every project attached to its client, with contacts, notes and activity in one place." },
  { icon: Workflow, title: "Your workflow, per project", text: "Design → Development → QA → Client Review. Each project gets its own stages, not a fixed status list." },
  { icon: FolderKanban, title: "A board that keeps up", text: "Drag and drop, keyboard moves, quick-add, filters and grouping — plus list, calendar and timeline views." },
  { icon: MessageSquareText, title: "Rich task details", text: "Markdown descriptions, checklists, comments with @mentions and reactions, and file previews." },
  { icon: Palmtree, title: "Time off built in", text: "Leave types and balances, approvals, national holidays per country and a Who's out view." },
  { icon: ChartColumn, title: "Dashboards & reports", text: "See what's due, what's done and who's overloaded, for the week, the month or all time." },
];

const STEPS = [
  { title: "Create your workspace", text: "Name it, pick a URL and add your logo. You're the Owner." },
  { title: "Add clients and projects", text: "Start from a workflow template or define your own stages." },
  { title: "Invite your team", text: "Give people the Admin or Member role and start moving work across the board." },
];

function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24 ${className ?? ""}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-wider text-primary">{children}</p>;
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary-light text-primary">
        <Check className="size-3.5" />
      </span>
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

/** Decorative stage strip for the "workflows" spotlight. */
function StagesVisual() {
  const stages = [
    ["Backlog", "#94A3B8", 5],
    ["Design", "#8B5CF6", 3],
    ["Development", "#3B82F6", 4],
    ["QA", "#F59E0B", 2],
    ["Client Review", "#EC4899", 1],
    ["Done", "#22C55E", 9],
  ] as const;
  return (
    <div aria-hidden className="rounded-2xl border border-border bg-card p-4 shadow-raised sm:p-6">
      <p className="text-sm font-semibold">Website Redesign · Stages</p>
      <ul className="mt-4 space-y-2">
        {stages.map(([name, color, count], i) => (
          <li key={name} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
            <GripVertical className="size-4 text-subtle" />
            <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="flex-1 text-sm font-medium">{name}</span>
            {i === stages.length - 1 && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">Completed</span>
            )}
            <span className="w-6 text-right text-xs text-muted-foreground">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Decorative workspace switcher for the "workspaces" spotlight. */
function WorkspacesVisual() {
  const rows = [
    ["DK", "Dream Kasper LLP", "Owner", true],
    ["NS", "Northwind Studio", "Member", false],
    ["PW", "Personal Workspace", "Owner", false],
  ] as const;
  return (
    <div aria-hidden className="rounded-2xl border border-border bg-card p-4 shadow-raised sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Workspaces</p>
      <ul className="mt-3 space-y-1.5">
        {rows.map(([initials, name, role, active]) => (
          <li key={name} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${active ? "bg-primary-light" : ""}`}>
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-xs font-bold text-white">{initials}</span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">{name}</span>
              <span className="block text-xs text-muted-foreground">{role}</span>
            </span>
            {active && <Check className="size-4 text-primary" />}
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-border pt-3 text-sm font-medium text-muted-foreground">+ Create workspace</div>
    </div>
  );
}

/** Decorative leave balances for the "time off" spotlight. */
function TimeOffVisual() {
  const balances = [
    ["Casual leave", "#5B5CF6", 9, 12],
    ["Sick leave", "#F59E0B", 7, 8],
    ["Earned leave", "#22C55E", 11, 15],
  ] as const;
  return (
    <div aria-hidden className="rounded-2xl border border-border bg-card p-4 shadow-raised sm:p-6">
      <p className="text-sm font-semibold">My leave · {new Date().getFullYear()}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {balances.map(([name, color, left, total]) => (
          <div key={name} className="rounded-xl border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">{name}</p>
            <p className="mt-1 text-xl font-bold">
              {left}
              <span className="text-sm font-medium text-muted-foreground"> / {total}</span>
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-muted">
              <div className="h-1.5 rounded-full" style={{ width: `${(left / total) * 100}%`, backgroundColor: color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
        <CalendarDays className="size-4 text-primary" />
        <span className="flex-1">Fri → Mon · 2 days</span>
        <span className="text-xs text-muted-foreground">Not counted: 2 weekend days</span>
      </div>
    </div>
  );
}

function Spotlight({
  id,
  eyebrow,
  title,
  text,
  bullets,
  visual,
  reverse,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  text: string;
  bullets: string[];
  visual: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div id={id} className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? "lg:order-2" : undefined}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h3>
        <p className="mt-3 text-muted-foreground">{text}</p>
        <ul className="mt-6 space-y-3 text-sm">
          {bullets.map((b) => (
            <Bullet key={b}>{b}</Bullet>
          ))}
        </ul>
      </div>
      <div className={reverse ? "lg:order-1" : undefined}>{visual}</div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingHeader />

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-144 bg-linear-to-b from-lavender to-transparent" />
          <div aria-hidden className="pointer-events-none absolute -left-40 top-10 size-112 rounded-full bg-primary/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-32 top-40 size-104 rounded-full bg-fuchsia-400/10 blur-3xl" />

          <div className="relative mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-3 py-1 text-xs font-medium text-primary shadow-card">
                <Sparkles className="size-3.5" /> Project management for client work
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Clients, projects and your team — <span className="text-primary">in one calm workspace.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">
                FlowDesk gives every project its own workflow, a board your team actually enjoys, and time off that plans itself around
                holidays. Run each company you work with in its own workspace.
              </p>
              <CtaButtons align="center" className="mt-8" />
              <p className="mt-4 text-xs text-muted-foreground">Free to get started — create your first workspace in under a minute.</p>
            </div>

            <div className="relative mx-auto mt-14 max-w-5xl">
              <div aria-hidden className="absolute -inset-4 z-0 rounded-4xl bg-linear-to-tr from-primary/20 via-fuchsia-400/10 to-sky-400/20 blur-2xl" />
              <ProductPreview className="relative" />
            </div>
          </div>
        </section>

        {/* Features */}
        <Section id="features">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Features</Eyebrow>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Everything client work needs, nothing it doesn&apos;t</h2>
            <p className="mt-4 text-muted-foreground">From the first client call to the final hand-off — and the holidays in between.</p>
          </div>
          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-raised">
                <span className="grid size-11 place-items-center rounded-xl bg-primary-light text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Search className="size-4 text-primary" /> Ctrl/⌘ + K search
            </span>
            <span className="inline-flex items-center gap-2">
              <LayoutDashboard className="size-4 text-primary" /> Light & dark mode
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Owner, Admin & Member roles
            </span>
          </div>
        </Section>

        {/* Spotlights */}
        <Section className="bg-lavender">
          <div className="space-y-24">
            <Spotlight
              eyebrow="Custom workflows"
              title="Stages that match how each project really runs"
              text="An agency build and a content retainer don't move the same way. Give each project its own stages and mark any of them as done."
              bullets={["Start from Agency, Product or Simple templates", "Rename, recolor and reorder stages by dragging", "Deleting a stage asks where its tasks should go"]}
              visual={<StagesVisual />}
            />
            <Spotlight
              id="workspaces"
              reverse
              eyebrow="Workspaces"
              title="One login, every company you work with"
              text="Keep your agency, a side project and a client's team completely separate. Switch in a click — every screen follows."
              bullets={[
                "Each workspace has its own clients, projects, team and time off",
                "Roles are per workspace: Owner in one, Member in another",
                "Create a workspace with its own URL and logo in seconds",
              ]}
              visual={<WorkspacesVisual />}
            />
            <Spotlight
              eyebrow="Time off"
              title="Leave that knows about weekends and holidays"
              text="Requests count only real working days, balances update themselves, and approvers see exactly what's being asked for."
              bullets={["National holidays for 200+ countries and their states", "Approvals by owners and admins — never your own", "See who's out before you assign the work"]}
              visual={<TimeOffVisual />}
            />
          </div>
        </Section>

        {/* How it works */}
        <Section id="how-it-works">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Up and running in three steps</h2>
          </div>
          <ol className="mt-14 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative rounded-2xl border border-border bg-card p-6 shadow-card">
                <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Final call to action */}
        <section className="px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-white sm:px-12">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-2xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 size-72 rounded-full bg-fuchsia-300/20 blur-2xl" />
            <Building2 className="relative mx-auto size-10 opacity-90" />
            <h2 className="relative mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Bring your next project into FlowDesk</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-white/80">
              Create a workspace for your team in under a minute.
            </p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-[15px] font-medium text-primary shadow-sm transition hover:bg-white/90"
              >
                Create your workspace <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/30 px-5 text-[15px] font-medium text-white transition hover:bg-white/10"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#workspaces" className="hover:text-foreground">
              Workspaces
            </a>
            <Link href="/login" className="hover:text-foreground">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Sign up
            </Link>
          </nav>
          <p>© {new Date().getFullYear()} FlowDesk</p>
        </div>
      </footer>
    </div>
  );
}
