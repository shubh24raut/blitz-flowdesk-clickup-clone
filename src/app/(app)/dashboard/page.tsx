"use client";

import { endOfMonth, endOfWeek, isWithinInterval, startOfMonth, startOfWeek } from "date-fns";
import { CalendarClock, CircleCheck, FolderKanban, ListTodo, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProgressChart, type PhaseDatum } from "@/components/dashboard/progress-chart";
import { useUI } from "@/components/providers/ui-provider";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { ActivityItem } from "@/components/shared/activity-item";
import { LetterTile } from "@/components/shared/avatar";
import { PriorityBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoundCheck } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { formatLong, formatShort, toDate } from "@/lib/dates";
import { cn, firstName } from "@/lib/utils";
import { setTaskCompleted } from "@/services/tasks";
import { indexes, isTaskDone, projectProgress, taskPhase, type Phase } from "@/store/selectors";
import { useAppState, useCurrentUser } from "@/store/hooks";

type Range = "week" | "month" | "all";
const RANGE_LABEL: Record<Range, string> = { week: "this week", month: "this month", all: "all time" };

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const state = useAppState();
  const me = useCurrentUser();
  const { openTask, openCreateTask, openCreateProject } = useUI();
  const [range, setRange] = useState<Range>("week");
  const [activityOpen, setActivityOpen] = useState(false);
  const idx = indexes(state);

  const data = useMemo(() => {
    const now = new Date();
    const interval =
      range === "week"
        ? { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
        : range === "month"
          ? { start: startOfMonth(now), end: endOfMonth(now) }
          : null;
    const inRange = (iso: string | null) => (iso ? (interval ? isWithinInterval(toDate(iso), interval) : true) : false);
    const liveProjects = state.projects.filter((p) => p.status !== "Archived");
    const liveIds = new Set(liveProjects.map((p) => p.id));
    const tasks = state.tasks.filter((t) => liveIds.has(t.projectId));
    const open = tasks.filter((t) => !isTaskDone(state, t));
    const overdue = open.filter((t) => t.dueDate && toDate(t.dueDate) < now);
    const dueWindow = interval ?? { start: now, end: new Date(now.getTime() + 7 * 86_400_000) };
    const due = open.filter((t) => t.dueDate && isWithinInterval(toDate(t.dueDate), dueWindow));
    const completed = tasks.filter((t) => isTaskDone(state, t) && (range === "all" || inRange(t.completedAt)));
    const doneTotal = tasks.length - open.length;
    const phases: Phase[] = ["Done", "In Progress", "Review", "To Do"];
    const phaseData: PhaseDatum[] = phases.map((phase) => ({
      phase,
      count: tasks.filter((t) => taskPhase(state, t) === phase).length,
    }));
    return {
      now,
      activeProjects: liveProjects.filter((p) => p.status === "Active"),
      newProjects: liveProjects.filter((p) => inRange(p.createdAt)).length,
      tasks,
      newTasks: tasks.filter((t) => inRange(t.createdAt)).length,
      completed,
      completionRate: tasks.length ? Math.round((doneTotal / tasks.length) * 100) : 0,
      due,
      overdue,
      phaseData,
      deadlines: open
        .filter((t) => t.dueDate && toDate(t.dueDate) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
        .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
        .slice(0, 4),
      myTasks: open
        .filter((t) => t.assigneeIds.includes(me.id))
        .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
        .slice(0, 5),
      activities: state.activities.filter((a) => range === "all" || inRange(a.createdAt)),
    };
  }, [state, range, me.id]);

  const rangeLabel = RANGE_LABEL[range];

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 lg:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {greeting(data.now.getHours())}, {firstName(me.name)} — here&apos;s what&apos;s happening with your projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select size="sm" value={range} onValueChange={(v) => setRange(v as Range)} aria-label="Date range" className="w-36" options={[{ value: "week", label: "This Week" }, { value: "month", label: "This Month" }, { value: "all", label: "All Time" }]} />
          <Button variant="secondary" size="sm" className="h-9" onClick={openCreateProject}>
            <FolderKanban /> <span className="hidden sm:inline">Project</span>
          </Button>
          <Button size="sm" className="h-9" onClick={() => openCreateTask()}>
            <Plus /> Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard label="Active Projects" value={data.activeProjects.length} hint={data.newProjects ? `+${data.newProjects} new ${rangeLabel}` : `No new projects ${rangeLabel}`} icon={FolderKanban} href="/projects" />
        <MetricCard label="Total Tasks" value={data.tasks.length} hint={`+${data.newTasks} ${rangeLabel}`} hintTone="good" icon={ListTodo} href="/tasks" />
        <MetricCard label="Completed" value={data.completed.length} hint={`${data.completionRate}% completion`} hintTone="good" icon={CircleCheck} href="/reports" />
        <MetricCard
          label={range === "all" ? "Due Next 7 Days" : `Due ${range === "week" ? "This Week" : "This Month"}`}
          value={data.due.length}
          hint={data.overdue.length ? `${data.overdue.length} overdue` : "Nothing overdue"}
          hintTone={data.overdue.length ? "bad" : "good"}
          icon={CalendarClock}
          href="/calendar"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <Link href="/reports" className="text-xs font-medium text-primary hover:underline">
              Reports
            </Link>
          </CardHeader>
          <CardContent>
            <ProgressChart data={data.phaseData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <button type="button" onClick={() => setActivityOpen(true)} className="text-xs font-medium text-primary hover:underline">
              View all
            </button>
          </CardHeader>
          <CardContent>
            {data.activities.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No activity {rangeLabel}.</p>
            ) : (
              <ul className="space-y-4">
                {data.activities.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <ActivityItem
                      compact
                      activity={a}
                      actor={idx.users.get(a.actorId)}
                      isMe={a.actorId === me.id}
                      onTargetClick={a.taskId && state.tasks.some((t) => t.id === a.taskId) ? () => openTask(a.taskId!) : undefined}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <Link href="/calendar" className="text-xs font-medium text-primary hover:underline">
              Calendar
            </Link>
          </CardHeader>
          <CardContent className="pt-3">
            {data.deadlines.length === 0 ? (
              <EmptyState compact icon={CalendarClock} title="No upcoming deadlines" />
            ) : (
              <ul className="divide-y divide-border">
                {data.deadlines.map((t) => {
                  const project = idx.projects.get(t.projectId);
                  const days = Math.ceil((toDate(t.dueDate!).getTime() - data.now.getTime()) / 86_400_000);
                  return (
                    <li key={t.id}>
                      <button type="button" onClick={() => openTask(t.id)} className="flex w-full items-center gap-3 py-3 text-left">
                        <LetterTile name={project?.name ?? "?"} color={project?.color ?? "#94A3B8"} size="md" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium hover:text-primary">{t.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{project?.name}</span>
                        </span>
                        <span className={cn("text-xs font-medium", days <= 3 ? "text-red-500" : days <= 7 ? "text-emerald-600" : "text-muted-foreground")}>
                          {formatLong(t.dueDate)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <Link href="/tasks?scope=mine" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-3">
            {data.myTasks.length === 0 ? (
              <EmptyState compact icon={CircleCheck} title="You're all caught up" description="No open tasks are assigned to you." />
            ) : (
              <ul className="divide-y divide-border">
                {data.myTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <RoundCheck
                      checked={false}
                      label={`Complete ${t.title}`}
                      onCheckedChange={() => {
                        const stage = setTaskCompleted(t.id, true);
                        if (stage) toast.success(`“${t.title}” completed`, { description: `Moved to ${stage}` });
                        else toast.error("This project has no completed stage");
                      }}
                    />
                    <button type="button" onClick={() => openTask(t.id)} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-medium hover:text-primary">{t.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{idx.projects.get(t.projectId)?.name}</span>
                    </button>
                    <PriorityBadge priority={t.priority} />
                    <span className="hidden w-14 text-right text-xs text-muted-foreground sm:block">{formatShort(t.dueDate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <Link href="/projects" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="pt-3">
          <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {data.activeProjects.map((p) => {
              const progress = projectProgress(state, p.id);
              return (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}/tasks`} className="group flex items-center gap-3">
                    <LetterTile name={p.name} color={p.color} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium group-hover:text-primary">{p.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {progress.done}/{progress.total} · <span className="font-semibold text-foreground">{progress.percent}%</span>
                        </span>
                      </span>
                      <Progress value={progress.percent} color={p.color} className="mt-2" label={`${p.name} progress`} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent title="All activity" description={`Everything that happened ${rangeLabel}.`} size="lg">
          <DialogBody>
            <ActivityFeed activities={data.activities} emptyText={`No activity ${rangeLabel}.`} />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
