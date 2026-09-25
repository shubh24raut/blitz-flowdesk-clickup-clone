"use client";

import { eachWeekOfInterval, endOfWeek, format, startOfWeek, subWeeks } from "date-fns";
import { AlarmClock, CircleCheck, Gauge, ListTodo } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PHASE_COLORS } from "@/components/dashboard/progress-chart";
import { useUI } from "@/components/providers/ui-provider";
import { AXIS_PROPS, ChartTooltip } from "@/components/reports/chart-tooltip";
import { LetterTile } from "@/components/shared/avatar";
import { PriorityBadge } from "@/components/shared/badges";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { PRIORITIES, PRIORITY_STYLES } from "@/lib/constants";
import { daysUntil, formatShort, toDate } from "@/lib/dates";
import { firstName } from "@/lib/utils";
import { getProjectStages, indexes, isTaskDone, projectProgress, taskPhase, type Phase } from "@/store/selectors";
import { useAppState } from "@/store/hooks";

const OPEN_COLOR = "#5B5CF6";
const DONE_COLOR = "#22C55E";

export default function ReportsPage() {
  const state = useAppState();
  const { openTask } = useUI();
  const [projectId, setProjectId] = useState("all");
  const [weeks, setWeeks] = useState(8);
  const idx = indexes(state);
  const liveProjects = state.projects.filter((p) => p.status !== "Archived");

  const report = useMemo(() => {
    const tasks = state.tasks.filter((t) => (projectId === "all" ? idx.projects.get(t.projectId)?.status !== "Archived" : t.projectId === projectId));
    const done = tasks.filter((t) => isTaskDone(state, t));
    const open = tasks.filter((t) => !isTaskDone(state, t));
    const overdue = open.filter((t) => t.dueDate && daysUntil(t.dueDate) < 0).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));

    const byStage =
      projectId === "all"
        ? (["To Do", "In Progress", "Review", "Done"] as Phase[]).map((phase) => ({
            name: phase,
            tasks: tasks.filter((t) => taskPhase(state, t) === phase).length,
            fill: PHASE_COLORS[phase],
          }))
        : getProjectStages(state, projectId).map((s) => ({ name: s.name, tasks: tasks.filter((t) => t.stageId === s.id).length, fill: s.color }));

    const now = new Date();
    const weekStarts = eachWeekOfInterval({ start: subWeeks(now, weeks - 1), end: now }, { weekStartsOn: 1 });
    const completedOverTime = weekStarts.map((start) => {
      const end = endOfWeek(start, { weekStartsOn: 1 });
      const created = tasks.filter((t) => {
        const d = toDate(t.createdAt);
        return d >= startOfWeek(start, { weekStartsOn: 1 }) && d <= end;
      }).length;
      const completed = done.filter((t) => {
        if (!t.completedAt) return false;
        const d = toDate(t.completedAt);
        return d >= start && d <= end;
      }).length;
      return { week: format(start, "MMM d"), Completed: completed, Created: created };
    });

    const workload = state.users
      .filter((u) => u.status !== "Inactive")
      .map((u) => ({
        name: firstName(u.name),
        Open: open.filter((t) => t.assigneeIds.includes(u.id)).length,
        Done: done.filter((t) => t.assigneeIds.includes(u.id)).length,
      }))
      .filter((w) => w.Open + w.Done > 0)
      .sort((a, b) => b.Open - a.Open);

    const byPriority = PRIORITIES.map((p) => ({ name: p, tasks: open.filter((t) => t.priority === p).length, fill: PRIORITY_STYLES[p].color }));

    return { tasks, done, open, overdue, byStage, completedOverTime, workload, byPriority };
  }, [state, idx, projectId, weeks]);

  const completion = report.tasks.length ? Math.round((report.done.length / report.tasks.length) * 100) : 0;
  const kpis = [
    { label: "Total tasks", value: report.tasks.length, icon: ListTodo },
    { label: "Completed", value: report.done.length, icon: CircleCheck },
    { label: "Overdue", value: report.overdue.length, icon: AlarmClock },
    { label: "Completion rate", value: `${completion}%`, icon: Gauge },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        title="Reports"
        description="Delivery health across projects and people."
        actions={
          <div className="flex gap-2">
            <NativeSelect value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Project" className="w-48 [&_select]:h-9">
              <option value="all">All projects</option>
              {liveProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} aria-label="Time range" className="w-36 [&_select]:h-9">
              <option value={4}>Last 4 weeks</option>
              <option value={8}>Last 8 weeks</option>
              <option value={12}>Last 12 weeks</option>
            </NativeSelect>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-muted-foreground">{k.label}</p>
              <k.icon className="size-4 text-subtle" />
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight">{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks completed vs created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.completedOverTime} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={DONE_COLOR} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={DONE_COLOR} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="week" {...AXIS_PROPS} />
                  <YAxis allowDecimals={false} {...AXIS_PROPS} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Created" stroke={OPEN_COLOR} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="Completed" stroke={DONE_COLOR} strokeWidth={2} fill="url(#completedFill)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{projectId === "all" ? "Tasks by status" : "Tasks by stage"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.byStage} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }} barCategoryGap={8}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" allowDecimals={false} {...AXIS_PROPS} />
                  <YAxis type="category" dataKey="name" width={96} {...AXIS_PROPS} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="tasks" name="Tasks" radius={[0, 4, 4, 0]} maxBarSize={22} label={{ position: "right", fontSize: 12, fill: "var(--muted-foreground)" }}>
                    {report.byStage.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workload per member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.workload} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" {...AXIS_PROPS} interval={0} />
                  <YAxis allowDecimals={false} {...AXIS_PROPS} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Open" stackId="w" fill={OPEN_COLOR} maxBarSize={32} stroke="var(--card)" strokeWidth={2} />
                  <Bar dataKey="Done" stackId="w" fill={DONE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} stroke="var(--card)" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open tasks by priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.byPriority} margin={{ top: 16, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" {...AXIS_PROPS} />
                  <YAxis allowDecimals={false} {...AXIS_PROPS} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="tasks" name="Open tasks" radius={[4, 4, 0, 0]} maxBarSize={48} label={{ position: "top", fontSize: 12, fill: "var(--muted-foreground)" }}>
                    {report.byPriority.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project completion</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {liveProjects.map((p) => {
                const progress = projectProgress(state, p.id);
                return (
                  <li key={p.id} className="flex items-center gap-3">
                    <LetterTile name={p.name} color={p.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex justify-between gap-2 text-sm">
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {progress.done}/{progress.total} · <span className="font-semibold text-foreground">{progress.percent}%</span>
                        </span>
                      </div>
                      <Progress value={progress.percent} color={p.color} label={`${p.name} completion`} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue tasks</CardTitle>
            <span className="text-xs text-muted-foreground">{report.overdue.length}</span>
          </CardHeader>
          <CardContent className="pt-3">
            {report.overdue.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Nothing overdue — great work! 🎉</p>
            ) : (
              <ul className="divide-y divide-border">
                {report.overdue.slice(0, 8).map((t) => (
                  <li key={t.id}>
                    <button type="button" onClick={() => openTask(t.id)} className="flex w-full items-center gap-3 py-2.5 text-left">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium hover:text-primary">{t.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{idx.projects.get(t.projectId)?.name}</span>
                      </span>
                      <PriorityBadge priority={t.priority} />
                      <span className="w-20 text-right text-xs font-medium text-red-500">
                        {formatShort(t.dueDate)} · {Math.abs(daysUntil(t.dueDate!))}d
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
