"use client";

import { AlarmClock, CalendarRange, CircleCheck, ListTodo } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useProject } from "@/hooks/use-project";
import { useUI } from "@/components/providers/ui-provider";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { LetterTile, UserAvatar } from "@/components/shared/avatar";
import { DueDate, PriorityBadge } from "@/components/shared/badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { daysUntil, formatLong } from "@/lib/dates";
import { pluralize } from "@/lib/utils";
import { getProjectStages, getProjectTasks, getUsers, indexes, isTaskDone, projectProgress } from "@/store/selectors";
import { useAppState } from "@/store/hooks";

export default function ProjectOverviewPage() {
  const project = useProject();
  const state = useAppState();
  const { openTask } = useUI();
  const stages = getProjectStages(state, project.id);
  const tasks = getProjectTasks(state, project.id);
  const progress = projectProgress(state, project.id);
  const client = project.clientId ? indexes(state).clients.get(project.clientId) : undefined;
  const members = getUsers(state, project.memberIds);
  const open = tasks.filter((t) => !isTaskDone(state, t));
  const overdue = open.filter((t) => t.dueDate && daysUntil(t.dueDate) < 0);
  const daysLeft = daysUntil(project.dueDate);
  const upcoming = open
    .filter((t) => t.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, 5);
  const activities = useMemo(() => state.activities.filter((a) => a.projectId === project.id).slice(0, 6), [state.activities, project.id]);

  const stats = [
    { label: "Progress", value: `${progress.percent}%`, hint: `${progress.done} of ${progress.total} tasks done`, icon: CircleCheck, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15" },
    { label: "Open tasks", value: open.length, hint: `across ${pluralize(stages.filter((s) => !s.isCompleted).length, "stage")}`, icon: ListTodo, tone: "text-primary bg-primary-light" },
    { label: "Overdue", value: overdue.length, hint: overdue.length ? "need attention" : "all on track", icon: AlarmClock, tone: "text-red-500 bg-red-50 dark:bg-red-500/15" },
    {
      label: "Deadline",
      value: daysLeft >= 0 ? `${daysLeft}d` : "Past",
      hint: formatLong(project.dueDate),
      icon: CalendarRange,
      tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/15",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <span className={`grid size-10 place-items-center rounded-xl ${s.tone}`}>
                <s.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </div>
            <p className="mt-2 truncate text-xs text-muted-foreground">{s.hint}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <Link href={`/projects/${project.id}/settings`} className="text-xs font-medium text-primary hover:underline">
            Edit stages
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            {stages.map((s) => {
              const count = tasks.filter((t) => t.stageId === s.id).length;
              return count ? (
                <div key={s.id} title={`${s.name}: ${count}`} style={{ width: `${(count / Math.max(tasks.length, 1)) * 100}%`, backgroundColor: s.color }} />
              ) : null;
            })}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stages.map((s) => (
              <li key={s.id} className="rounded-xl border border-border p-3">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="truncate">{s.name}</span>
                </p>
                <p className="mt-1 text-lg font-bold">{tasks.filter((t) => t.stageId === s.id).length}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming deadlines</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              {upcoming.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No upcoming deadlines 🎉</p>
              ) : (
                <ul className="divide-y divide-border">
                  {upcoming.map((t) => (
                    <li key={t.id}>
                      <button type="button" onClick={() => openTask(t.id)} className="flex w-full items-center gap-3 py-3 text-left hover:text-primary">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                        <PriorityBadge priority={t.priority} className="hidden sm:inline-flex" />
                        <DueDate date={t.dueDate} className="w-20 justify-end" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <Link href={`/projects/${project.id}/activity`} className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <ActivityFeed activities={activities} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">{project.description || "No description yet."}</p>
              <dl className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Client</dt>
                  <dd>
                    {client ? (
                      <Link href={`/clients/${client.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                        <LetterTile name={client.name} color={client.color} size="sm" className="size-6 rounded-md" />
                        {client.name}
                      </Link>
                    ) : (
                      "Internal"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Start</dt>
                  <dd className="font-medium">{formatLong(project.startDate)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Due</dt>
                  <dd className="font-medium">{formatLong(project.dueDate)}</dd>
                </div>
              </dl>
              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-semibold">{progress.percent}%</span>
                </div>
                <Progress value={progress.percent} color={project.color} className="h-2" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <span className="text-xs text-muted-foreground">{members.length} members</span>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {members.map((m) => {
                  const assigned = open.filter((t) => t.assigneeIds.includes(m.id)).length;
                  return (
                    <li key={m.id} className="flex items-center gap-3">
                      <UserAvatar user={m} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.title}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{pluralize(assigned, "open task")}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
