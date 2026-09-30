"use client";

import { ChevronDown, Columns3, List, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useProject } from "@/hooks/use-project";
import { useUI } from "@/components/providers/ui-provider";
import { SearchInput } from "@/components/shared/search-input";
import { TaskBoard } from "@/components/tasks/task-board";
import { applyTaskFilters, EMPTY_FILTERS, TaskFilters, type TaskFilterState } from "@/components/tasks/task-filters";
import { TaskListView, type TaskGroup } from "@/components/tasks/task-list-view";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PRIORITIES, PRIORITY_STYLES } from "@/constants";
import { cn } from "@/lib/utils";
import { getProjectStages, getProjectTasks, getUsers } from "@/store/selectors";
import { useAppState } from "@/store/hooks";

type GroupBy = "stage" | "priority";

export default function ProjectTasksPage() {
  const project = useProject();
  const state = useAppState();
  const { openCreateTask } = useUI();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TaskFilterState>(EMPTY_FILTERS);
  const [groupBy, setGroupBy] = useState<GroupBy>("stage");
  const [view, setView] = useState<"board" | "list">("board");

  const stages = getProjectStages(state, project.id);
  const allTasks = getProjectTasks(state, project.id);
  const tasks = useMemo(() => applyTaskFilters(state, allTasks, search, filters), [state, allTasks, search, filters]);
  const members = getUsers(state, project.memberIds);

  const groups: TaskGroup[] = useMemo(() => {
    if (groupBy === "priority") {
      return PRIORITIES.map((p) => ({
        id: p,
        title: p,
        color: PRIORITY_STYLES[p].color,
        tasks: tasks.filter((t) => t.priority === p),
      }));
    }
    return stages.map((s) => ({
      id: s.id,
      title: s.name,
      color: s.color,
      tasks: tasks.filter((t) => t.stageId === s.id).sort((a, b) => a.order - b.order),
      onAdd: () => openCreateTask({ projectId: project.id, stageId: s.id }),
    }));
  }, [groupBy, stages, tasks, openCreateTask, project.id]);

  const filtered = tasks.length !== allTasks.length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search tasks…" className="w-full sm:w-64" />
        <TaskFilters value={filters} onChange={setFilters} users={members} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-9">
              Group by: {groupBy === "stage" ? "Stage" : "Priority"} <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>Group tasks by</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <DropdownMenuRadioItem value="stage">Stage</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <div role="group" aria-label="View" className="flex rounded-lg border border-border bg-card p-0.5 shadow-card">
          {(
            [
              ["board", Columns3, "Board"],
              ["list", List, "List"],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition",
                view === id ? "bg-primary-light text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
        {filtered && (
          <span className="text-xs text-muted-foreground">
            Showing {tasks.length} of {allTasks.length}
          </span>
        )}
        <Button className="ml-auto hidden sm:inline-flex" onClick={() => openCreateTask({ projectId: project.id })}>
          <Plus /> Add Task
        </Button>
      </div>

      {view === "board" ? (
        <TaskBoard project={project} tasks={tasks} groupBy={groupBy} />
      ) : (
        <TaskListView groups={groups} showStage={groupBy === "priority"} />
      )}
    </div>
  );
}
