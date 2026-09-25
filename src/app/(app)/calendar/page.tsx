"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarX2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { CalendarTaskChip } from "@/components/calendar/calendar-task-chip";
import { useUI } from "@/components/providers/ui-provider";
import { AvatarStack } from "@/components/shared/avatar";
import { PriorityBadge, StageBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { toDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { getUsers, indexes } from "@/store/selectors";
import { useAppState, useCurrentUser } from "@/store/hooks";
import type { Task } from "@/types";

type View = "month" | "week" | "day";
const WEEK_OPTS = { weekStartsOn: 0 } as const;

export default function CalendarPage() {
  const state = useAppState();
  const me = useCurrentUser();
  const { openCreateTask } = useUI();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [projectId, setProjectId] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);
  const idx = indexes(state);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of state.tasks) {
      if (!t.dueDate) continue;
      if (projectId !== "all" && t.projectId !== projectId) continue;
      if (mineOnly && !t.assigneeIds.includes(me.id)) continue;
      if (idx.projects.get(t.projectId)?.status === "Archived") continue;
      const key = format(toDate(t.dueDate), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return map;
  }, [state.tasks, projectId, mineOnly, me.id, idx]);

  const tasksOn = (day: Date) => tasksByDay.get(format(day, "yyyy-MM-dd")) ?? [];

  function shift(direction: 1 | -1) {
    const next = view === "month" ? addMonths(cursor, direction) : view === "week" ? addWeeks(cursor, direction) : addDays(cursor, direction);
    setCursor(next);
    setSelected(view === "month" ? startOfMonth(next) : next);
  }

  function goToday() {
    const now = new Date();
    setCursor(now);
    setSelected(now);
  }

  const title =
    view === "month"
      ? format(cursor, "MMMM yyyy")
      : view === "week"
        ? `${format(startOfWeek(cursor, WEEK_OPTS), "MMM d")} – ${format(endOfWeek(cursor, WEEK_OPTS), "MMM d, yyyy")}`
        : format(cursor, "EEEE, MMMM d, yyyy");

  const monthDays = eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor), WEEK_OPTS), end: endOfWeek(endOfMonth(cursor), WEEK_OPTS) });
  const weekDays = eachDayOfInterval({ start: startOfWeek(cursor, WEEK_OPTS), end: endOfWeek(cursor, WEEK_OPTS) });
  const createOn = (day: Date) => {
    const due = new Date(day);
    due.setHours(12, 0, 0, 0);
    openCreateTask({ dueDate: due.toISOString(), projectId: projectId !== "all" ? projectId : undefined });
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        title="Calendar"
        description="View your tasks and deadlines."
        actions={
          <Button onClick={() => createOn(selected)}>
            <Plus /> New Task
          </Button>
        }
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" className="h-9" onClick={goToday}>
            Today
          </Button>
          <div className="flex rounded-lg border border-border bg-card shadow-card">
            <button type="button" onClick={() => shift(-1)} aria-label="Previous" className="grid size-9 place-items-center rounded-l-lg hover:bg-muted">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" onClick={() => shift(1)} aria-label="Next" className="grid size-9 place-items-center rounded-r-lg border-l border-border hover:bg-muted">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <h2 className="px-1 text-base font-semibold sm:text-lg" aria-live="polite">
            {title}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Project" className="w-44 [&_select]:h-9">
            <option value="all">All projects</option>
            {state.projects
              .filter((p) => p.status !== "Archived")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </NativeSelect>
          <label className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm shadow-card">
            <Switch checked={mineOnly} onCheckedChange={setMineOnly} />
            My tasks
          </label>
          <div role="group" aria-label="Calendar view" className="flex rounded-lg border border-border bg-card p-0.5 shadow-card">
            {(["month", "week", "day"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => {
                  setView(v);
                  setCursor(selected);
                }}
                className={cn(
                  "h-8 rounded-md px-3 text-sm font-medium capitalize transition",
                  view === v ? "bg-primary-light text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "month" && (
        <div className="grid gap-5 lg:grid-cols-1">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border bg-muted/40">
              {weekDays.map((d) => (
                <div key={d.toISOString()} className="py-2.5 text-center text-xs font-medium text-muted-foreground">
                  <span className="sm:hidden">{format(d, "EEEEE")}</span>
                  <span className="hidden sm:inline">{format(d, "EEE")}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day) => {
                const tasks = tasksOn(day);
                const inMonth = isSameMonth(day, cursor);
                const isSelected = isSameDay(day, selected);
                return (
                  <div
                    key={day.toISOString()}
                    role="button"
                    tabIndex={0}
                    aria-label={`${format(day, "EEEE, MMMM d")}: ${tasks.length} tasks`}
                    onClick={() => setSelected(day)}
                    onDoubleClick={() => createOn(day)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSelected(day);
                    }}
                    className={cn(
                      "group relative min-h-16 border-b border-r border-border p-1 text-left transition sm:min-h-28 sm:p-1.5 [&:nth-child(7n)]:border-r-0",
                      !inMonth && "bg-muted/30",
                      isSelected ? "bg-primary-light/50" : "hover:bg-lavender",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full text-xs font-medium",
                          isToday(day) ? "bg-primary text-white" : inMonth ? "text-foreground" : "text-subtle",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          createOn(day);
                        }}
                        aria-label={`Add task on ${format(day, "MMMM d")}`}
                        className="hidden size-6 place-items-center rounded-md text-subtle opacity-0 transition hover:bg-card hover:text-primary group-hover:opacity-100 sm:grid"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    {/* Phones: dots. Larger screens: chips. */}
                    <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                      {tasks.slice(0, 4).map((t) => (
                        <span key={t.id} className="size-1.5 rounded-full" style={{ backgroundColor: idx.stages.get(t.stageId)?.color }} />
                      ))}
                    </div>
                    <div className="mt-1 hidden space-y-1 sm:block">
                      {tasks.slice(0, 3).map((t) => (
                        <CalendarTaskChip key={t.id} task={t} stage={idx.stages.get(t.stageId)} />
                      ))}
                      {tasks.length > 3 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(day);
                            setCursor(day);
                            setView("day");
                          }}
                          className="px-1 text-[11px] font-medium text-primary hover:underline"
                        >
                          +{tasks.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <DayAgenda day={selected} tasks={tasksOn(selected)} onAdd={() => createOn(selected)} className="sm:hidden" />
        </div>
      )}

      {view === "week" && (
        <div className="grid gap-3 md:grid-cols-7">
          {weekDays.map((day) => {
            const tasks = tasksOn(day);
            return (
              <Card key={day.toISOString()} className={cn("flex min-h-40 flex-col p-3 md:min-h-[420px]", isToday(day) && "border-primary/40 ring-3 ring-primary/10")}>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                    <p className={cn("text-lg font-bold", isToday(day) && "text-primary")}>{format(day, "d")}</p>
                  </div>
                  <button type="button" aria-label={`Add task on ${format(day, "MMMM d")}`} onClick={() => createOn(day)} className="grid size-7 place-items-center rounded-md text-subtle hover:bg-muted hover:text-primary">
                    <Plus className="size-4" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {tasks.map((t) => (
                    <CalendarTaskChip key={t.id} task={t} stage={idx.stages.get(t.stageId)} className="whitespace-normal py-1.5 text-xs" />
                  ))}
                  {tasks.length === 0 && <p className="text-xs text-subtle">No tasks</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {view === "day" && <DayAgenda day={cursor} tasks={tasksOn(cursor)} onAdd={() => createOn(cursor)} />}
    </div>
  );
}

function DayAgenda({ day, tasks, onAdd, className }: { day: Date; tasks: Task[]; onAdd: () => void; className?: string }) {
  const state = useAppState();
  const { openTask } = useUI();
  const idx = indexes(state);
  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{isToday(day) ? "Today" : format(day, "EEEE, MMM d")}</h3>
        <Button variant="soft" size="sm" onClick={onAdd}>
          <Plus /> Add
        </Button>
      </div>
      {tasks.length === 0 ? (
        <EmptyState compact icon={CalendarX2} title="Nothing due" description="Enjoy the free time — or plan something new." />
      ) : (
        <ul className="divide-y divide-border">
          {tasks.map((t) => {
            const stage = idx.stages.get(t.stageId);
            const project = idx.projects.get(t.projectId);
            return (
              <li key={t.id}>
                <button type="button" onClick={() => openTask(t.id)} className="flex w-full flex-col gap-2 py-3 text-left sm:flex-row sm:items-center">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium hover:text-primary">{t.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{project?.name}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {stage && <StageBadge name={stage.name} color={stage.color} />}
                    <PriorityBadge priority={t.priority} />
                    <AvatarStack users={getUsers(state, t.assigneeIds)} max={2} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
