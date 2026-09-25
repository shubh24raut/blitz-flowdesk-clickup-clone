"use client";

import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { PHASE_COLORS } from "@/components/dashboard/progress-chart";
import { useUI } from "@/components/providers/ui-provider";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { applyTaskFilters, EMPTY_FILTERS, TaskFilters, type TaskFilterState } from "@/components/tasks/task-filters";
import { TaskListView, type TaskGroup } from "@/components/tasks/task-list-view";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PRIORITIES, PRIORITY_RANK, PRIORITY_STYLES } from "@/lib/constants";
import { daysUntil } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { taskPhase, type Phase } from "@/store/selectors";
import { useAppState, useCurrentUser } from "@/store/hooks";
import type { Task } from "@/types";

type Scope = "mine" | "all" | "created";
type GroupBy = "project" | "phase" | "priority" | "due";

function dueBucket(task: Task): string {
  if (!task.dueDate) return "No due date";
  const d = daysUntil(task.dueDate);
  if (d < 0) return "Overdue";
  if (d === 0) return "Today";
  if (d <= 7) return "Next 7 days";
  return "Later";
}
const DUE_BUCKETS = [
  ["Overdue", "#EF4444"],
  ["Today", "#F97316"],
  ["Next 7 days", "#F59E0B"],
  ["Later", "#3B82F6"],
  ["No due date", "#94A3B8"],
] as const;

function TasksContent() {
  const state = useAppState();
  const me = useCurrentUser();
  const params = useSearchParams();
  const { openCreateTask } = useUI();
  const [scope, setScope] = useState<Scope>(params.get("scope") === "mine" ? "mine" : "all");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TaskFilterState>({ ...EMPTY_FILTERS, hideCompleted: true });
  const [projectId, setProjectId] = useState("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("project");

  const liveProjects = useMemo(() => state.projects.filter((p) => p.status !== "Archived"), [state.projects]);
  const scoped = useMemo(() => {
    const live = new Set(liveProjects.map((p) => p.id));
    return state.tasks.filter(
      (t) =>
        live.has(t.projectId) &&
        (projectId === "all" || t.projectId === projectId) &&
        (scope === "all" || (scope === "mine" ? t.assigneeIds.includes(me.id) : t.createdById === me.id)),
    );
  }, [state.tasks, liveProjects, projectId, scope, me.id]);
  const tasks = useMemo(
    () =>
      applyTaskFilters(state, scoped, search, filters).sort(
        (a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
      ),
    [state, scoped, search, filters],
  );

  const groups: TaskGroup[] = useMemo(() => {
    if (groupBy === "priority")
      return PRIORITIES.map((p) => ({ id: p, title: p, color: PRIORITY_STYLES[p].color, tasks: tasks.filter((t) => t.priority === p) })).filter((g) => g.tasks.length);
    if (groupBy === "phase") {
      const phases: Phase[] = ["To Do", "In Progress", "Review", "Done"];
      return phases.map((p) => ({ id: p, title: p, color: PHASE_COLORS[p], tasks: tasks.filter((t) => taskPhase(state, t) === p) })).filter((g) => g.tasks.length);
    }
    if (groupBy === "due")
      return DUE_BUCKETS.map(([title, color]) => ({ id: title, title, color, tasks: tasks.filter((t) => dueBucket(t) === title) })).filter((g) => g.tasks.length);
    return liveProjects
      .map((p) => ({ id: p.id, title: p.name, color: p.color, tasks: tasks.filter((t) => t.projectId === p.id), onAdd: () => openCreateTask({ projectId: p.id }) }))
      .filter((g) => g.tasks.length);
  }, [groupBy, tasks, liveProjects, state, openCreateTask]);

  const scopes: Array<[Scope, string, number]> = [
    ["mine", "Assigned to me", state.tasks.filter((t) => t.assigneeIds.includes(me.id)).length],
    ["all", "All tasks", state.tasks.length],
    ["created", "Created by me", state.tasks.filter((t) => t.createdById === me.id).length],
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        title="Tasks"
        description="Every task across your projects, in one place."
        actions={
          <Button onClick={() => openCreateTask(projectId !== "all" ? { projectId } : {})}>
            <Plus /> New Task
          </Button>
        }
      />
      <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border">
        {scopes.map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={scope === id}
            onClick={() => setScope(id)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 pb-2.5 text-sm font-medium transition",
              scope === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label} <span className="ml-1 rounded-full bg-muted px-1.5 text-[11px]">{count}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search tasks or tags…" className="w-full sm:w-64" />
        <TaskFilters value={filters} onChange={setFilters} users={state.users} />
        <Select size="sm" value={projectId} onValueChange={setProjectId} aria-label="Project" className="w-full sm:w-48" options={[{ value: "all", label: "All projects" }, ...liveProjects.map((p) => ({ value: p.id, textValue: p.name, label: <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />{p.name}</span> }))]} />
        <Select size="sm" value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)} aria-label="Group by" className="w-full sm:w-44" options={[{ value: "project", label: "Group: Project" }, { value: "phase", label: "Group: Status" }, { value: "priority", label: "Group: Priority" }, { value: "due", label: "Group: Due date" }]} />
        <span className="text-xs text-muted-foreground sm:ml-auto">{tasks.length} tasks</span>
      </div>
      <TaskListView groups={groups} showProject={groupBy !== "project"} showStage />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <TasksContent />
    </Suspense>
  );
}
