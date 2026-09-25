"use client";

import { addDays, differenceInCalendarDays, eachWeekOfInterval, format, max, min, startOfDay } from "date-fns";
import { CalendarRange } from "lucide-react";
import { useMemo } from "react";
import { useProject } from "@/components/projects/use-project";
import { useUI } from "@/components/providers/ui-provider";
import { UserAvatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { toDate } from "@/lib/dates";
import { cn, withAlpha } from "@/lib/utils";
import { getProjectStages, getProjectTasks, indexes } from "@/store/selectors";
import { useAppState } from "@/store/hooks";

const DAY_WIDTH = 28;

export default function ProjectTimelinePage() {
  const project = useProject();
  const state = useAppState();
  const { openTask } = useUI();
  const stages = getProjectStages(state, project.id);
  const tasks = getProjectTasks(state, project.id);
  const users = indexes(state).users;

  const layout = useMemo(() => {
    const bars = tasks.map((t) => {
      const created = startOfDay(toDate(t.createdAt));
      const due = t.dueDate ? startOfDay(toDate(t.dueDate)) : addDays(created, 3);
      return { task: t, start: min([created, due]), end: max([created, due]) };
    });
    const today = startOfDay(new Date());
    const dates = [startOfDay(toDate(project.startDate)), startOfDay(toDate(project.dueDate)), today, ...bars.flatMap((b) => [b.start, b.end])];
    const rangeStart = addDays(min(dates), -3);
    const rangeEnd = addDays(max(dates), 4);
    const totalDays = differenceInCalendarDays(rangeEnd, rangeStart) + 1;
    const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 });
    return { bars, rangeStart, totalDays, weeks, todayOffset: differenceInCalendarDays(today, rangeStart) };
  }, [tasks, project.startDate, project.dueDate]);

  if (tasks.length === 0) {
    return <EmptyState icon={CalendarRange} title="Nothing on the timeline" description="Add tasks with due dates to see them here." />;
  }

  const width = layout.totalDays * DAY_WIDTH;

  return (
    <Card className="overflow-hidden">
      <div className="scrollbar-thin overflow-x-auto">
        <div style={{ width: width + 240 }} className="relative">
          {/* Axis */}
          <div className="sticky top-0 z-10 flex border-b border-border bg-card">
            <div className="sticky left-0 z-20 w-60 shrink-0 border-r border-border bg-card px-4 py-3 text-xs font-medium text-muted-foreground">Task</div>
            <div className="relative h-11" style={{ width }}>
              {layout.weeks.map((w) => {
                const left = differenceInCalendarDays(w, layout.rangeStart) * DAY_WIDTH;
                return left >= 0 ? (
                  <span key={w.toISOString()} className="absolute top-0 h-full border-l border-border pl-2 pt-3 text-xs text-muted-foreground" style={{ left }}>
                    {format(w, "MMM d")}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Today marker */}
          <div className="pointer-events-none absolute bottom-0 top-0 z-[5] w-px bg-red-400" style={{ left: 240 + layout.todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}>
            <span className="absolute left-1/2 top-12 -translate-x-1/2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">Today</span>
          </div>

          {stages.map((stage) => {
            const rows = layout.bars.filter((b) => b.task.stageId === stage.id).sort((a, b) => a.start.getTime() - b.start.getTime());
            if (rows.length === 0) return null;
            return (
              <div key={stage.id}>
                <div className="flex border-b border-border bg-muted/40">
                  <div className="sticky left-0 flex w-60 shrink-0 items-center gap-2 border-r border-border bg-muted px-4 py-2 text-xs font-semibold">
                    <span className="size-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    {stage.name}
                    <span className="font-normal text-muted-foreground">{rows.length}</span>
                  </div>
                  <div style={{ width }} />
                </div>
                {rows.map(({ task, start, end }) => {
                  const left = differenceInCalendarDays(start, layout.rangeStart) * DAY_WIDTH;
                  const barWidth = Math.max(differenceInCalendarDays(end, start) + 1, 1) * DAY_WIDTH;
                  const assignee = users.get(task.assigneeIds[0] ?? "");
                  return (
                    <div key={task.id} className="flex border-b border-border last:border-b-0 hover:bg-lavender">
                      <button
                        type="button"
                        onClick={() => openTask(task.id)}
                        className="sticky left-0 z-[6] w-60 shrink-0 truncate border-r border-border bg-card px-4 py-2.5 text-left text-sm hover:text-primary"
                      >
                        {task.title}
                      </button>
                      <div className="relative" style={{ width }}>
                        <button
                          type="button"
                          onClick={() => openTask(task.id)}
                          title={`${task.title} · ${format(start, "MMM d")} – ${format(end, "MMM d")}`}
                          className={cn(
                            "absolute top-1.5 flex h-7 items-center gap-1.5 overflow-hidden rounded-lg border px-1.5 text-left text-xs font-medium transition hover:brightness-95",
                            stage.isCompleted && "opacity-70",
                          )}
                          style={{ left, width: barWidth, backgroundColor: withAlpha(stage.color, 0.18), borderColor: withAlpha(stage.color, 0.4) }}
                        >
                          {assignee && <UserAvatar user={assignee} size="xs" className="ring-0" />}
                          <span className="truncate text-foreground/80">{task.title}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
