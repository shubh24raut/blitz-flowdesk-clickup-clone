import { CalendarDays, ChartColumn, ChevronsUpDown, FolderKanban, House, Palmtree, SquareCheckBig, Users, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * A static, decorative rendering of the FlowDesk board, built from the same
 * design tokens as the app so it matches both themes without screenshots.
 */

type Card = { title: string; tag: string; tagColor: string; priority: "High" | "Medium" | "Low"; people: string[]; progress?: number };

const COLUMNS: Array<{ name: string; color: string; cards: Card[] }> = [
  {
    name: "Backlog",
    color: "#94A3B8",
    cards: [
      { title: "Competitor research", tag: "Research", tagColor: "#0EA5E9", priority: "Low", people: ["KI"] },
      { title: "Define sitemap", tag: "Planning", tagColor: "#8B5CF6", priority: "Medium", people: ["RK"] },
    ],
  },
  {
    name: "Design",
    color: "#8B5CF6",
    cards: [
      { title: "Homepage hero (v2)", tag: "Design", tagColor: "#EC4899", priority: "High", people: ["IM", "SR"], progress: 66 },
      { title: "Design system tokens", tag: "Design", tagColor: "#EC4899", priority: "Medium", people: ["AJ"] },
    ],
  },
  {
    name: "Development",
    color: "#3B82F6",
    cards: [
      { title: "API integration", tag: "Backend", tagColor: "#22C55E", priority: "High", people: ["AJ", "KI"], progress: 40 },
      { title: "Contact form", tag: "Frontend", tagColor: "#F59E0B", priority: "Medium", people: ["RK"] },
    ],
  },
  {
    name: "Client Review",
    color: "#EC4899",
    cards: [{ title: "Pricing page copy", tag: "Content", tagColor: "#06B6D4", priority: "Low", people: ["SP"] }],
  },
];

const PRIORITY: Record<Card["priority"], string> = {
  High: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  Medium: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  Low: "bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-300",
};

const AVATAR_COLORS = ["#5B5CF6", "#0EA5E9", "#EC4899", "#22C55E", "#F59E0B"];

const NAV = [House, UsersRound, FolderKanban, SquareCheckBig, CalendarDays, Users, Palmtree, ChartColumn];

function Avatar({ initials, index }: { initials: string; index: number }) {
  const color = AVATAR_COLORS[(initials.charCodeAt(0) + index) % AVATAR_COLORS.length];
  return (
    <span
      className="grid size-5 place-items-center rounded-full text-[8px] font-semibold ring-2 ring-card"
      style={{ backgroundColor: `${color}29`, color }}
    >
      {initials}
    </span>
  );
}

export function ProductPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-overlay ring-1 ring-black/5 dark:ring-white/5", className)}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-3 hidden rounded-md bg-card px-3 py-0.5 text-[11px] text-muted-foreground sm:block">flowdesk.app/dream-kasper</span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-44 shrink-0 flex-col gap-3 border-r border-border bg-sidebar p-3 md:flex">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1.5">
            <span className="grid size-6 place-items-center rounded-md bg-primary text-[9px] font-bold text-white">DK</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold">Dream Kasper LLP</span>
              <span className="block text-[9px] text-muted-foreground">Owner · 8 members</span>
            </span>
            <ChevronsUpDown className="size-3 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            {NAV.map((Icon, i) => (
              <div key={i} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5", i === 2 ? "bg-primary-light text-primary" : "text-muted-foreground")}>
                <Icon className="size-3.5" />
                <span className={cn("h-1.5 rounded-full", i === 2 ? "w-14 bg-primary/40" : "w-12 bg-muted-foreground/20")} />
              </div>
            ))}
          </div>
        </div>

        {/* Board */}
        <div className="min-w-0 flex-1 bg-background p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-violet-500/15 text-[11px] font-semibold text-violet-500">W</span>
            <span className="text-sm font-semibold">Website Redesign</span>
            <span className="ml-auto hidden gap-1 sm:flex">
              {["Overview", "Tasks", "Files", "Timeline"].map((t) => (
                <span key={t} className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", t === "Tasks" ? "bg-primary-light text-primary" : "text-muted-foreground")}>
                  {t}
                </span>
              ))}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {COLUMNS.map((col, ci) => (
              <div key={col.name} className={cn("rounded-xl bg-muted/60 p-2", ci > 1 && "hidden lg:block")}>
                <div className="mb-2 flex items-center gap-1.5 px-1">
                  <span className="size-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-[11px] font-semibold">{col.name}</span>
                  <span className="text-[10px] text-muted-foreground">{col.cards.length}</span>
                </div>
                <div className="space-y-2">
                  {col.cards.map((card) => (
                    <div key={card.title} className="rounded-lg border border-border bg-card p-2.5 shadow-card">
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ backgroundColor: `${card.tagColor}1f`, color: card.tagColor }}>
                        {card.tag}
                      </span>
                      <p className="mt-1.5 text-[11px] font-medium leading-snug">{card.title}</p>
                      {card.progress !== undefined && (
                        <div className="mt-2 h-1 rounded-full bg-muted">
                          <div className="h-1 rounded-full bg-primary" style={{ width: `${card.progress}%` }} />
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", PRIORITY[card.priority])}>{card.priority}</span>
                        <span className="flex -space-x-1">
                          {card.people.map((p, i) => (
                            <Avatar key={p} initials={p} index={i} />
                          ))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
