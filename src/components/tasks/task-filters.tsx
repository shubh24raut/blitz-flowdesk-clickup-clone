"use client";

import { ListFilter, X } from "lucide-react";
import { UserAvatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PRIORITIES, PRIORITY_STYLES } from "@/constants";
import { cn } from "@/lib/utils";
import { isTaskDone } from "@/store/selectors";
import type { AppState, ID, Priority, Task, User } from "@/types";

export interface TaskFilterState {
  priorities: Priority[];
  assigneeIds: ID[];
  hideCompleted: boolean;
  dueWindow: "any" | "overdue" | "week" | "none";
}

export const EMPTY_FILTERS: TaskFilterState = { priorities: [], assigneeIds: [], hideCompleted: false, dueWindow: "any" };

export function activeFilterCount(f: TaskFilterState): number {
  return f.priorities.length + f.assigneeIds.length + (f.hideCompleted ? 1 : 0) + (f.dueWindow !== "any" ? 1 : 0);
}

export function applyTaskFilters(state: AppState, tasks: Task[], search: string, f: TaskFilterState): Task[] {
  const q = search.trim().toLowerCase();
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
  return tasks.filter((t) => {
    if (q && !t.title.toLowerCase().includes(q) && !t.tags.some((tag) => tag.toLowerCase().includes(q))) return false;
    if (f.priorities.length && !f.priorities.includes(t.priority)) return false;
    if (f.assigneeIds.length && !t.assigneeIds.some((id) => f.assigneeIds.includes(id))) return false;
    const done = isTaskDone(state, t);
    if (f.hideCompleted && done) return false;
    if (f.dueWindow !== "any") {
      const due = t.dueDate ? new Date(t.dueDate) : null;
      if (f.dueWindow === "none" && due) return false;
      if (f.dueWindow === "overdue" && (!due || done || due >= now)) return false;
      if (f.dueWindow === "week" && (!due || due > weekAhead)) return false;
    }
    return true;
  });
}

const DUE_OPTIONS: Array<{ id: TaskFilterState["dueWindow"]; label: string }> = [
  { id: "any", label: "Any time" },
  { id: "overdue", label: "Overdue" },
  { id: "week", label: "Due in 7 days" },
  { id: "none", label: "No due date" },
];

export function TaskFilters({
  value,
  onChange,
  users,
}: {
  value: TaskFilterState;
  onChange: (value: TaskFilterState) => void;
  users: User[];
}) {
  const count = activeFilterCount(value);
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className={cn("h-9", count > 0 && "border-primary/40 text-primary")}>
            <ListFilter /> Filter
            {count > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">{count}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          {PRIORITIES.map((p) => (
            <DropdownMenuCheckboxItem
              key={p}
              checked={value.priorities.includes(p)}
              onCheckedChange={() => onChange({ ...value, priorities: toggle(value.priorities, p) })}
              onSelect={(e) => e.preventDefault()}
            >
              <span className={cn("size-2 rounded-full", PRIORITY_STYLES[p].dot)} /> {p}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Assignee</DropdownMenuLabel>
          {users.map((u) => (
            <DropdownMenuCheckboxItem
              key={u.id}
              checked={value.assigneeIds.includes(u.id)}
              onCheckedChange={() => onChange({ ...value, assigneeIds: toggle(value.assigneeIds, u.id) })}
              onSelect={(e) => e.preventDefault()}
            >
              <UserAvatar user={u} size="xs" /> <span className="truncate">{u.name}</span>
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Due date</DropdownMenuLabel>
          {DUE_OPTIONS.map((o) => (
            <DropdownMenuCheckboxItem
              key={o.id}
              checked={value.dueWindow === o.id}
              onCheckedChange={() => onChange({ ...value, dueWindow: o.id })}
              onSelect={(e) => e.preventDefault()}
            >
              {o.label}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={value.hideCompleted}
            onCheckedChange={(checked) => onChange({ ...value, hideCompleted: checked })}
            onSelect={(e) => e.preventDefault()}
          >
            Hide completed
          </DropdownMenuCheckboxItem>
          {count > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onChange(EMPTY_FILTERS)}>
                <X /> Clear filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {count > 0 && (
        <Button variant="ghost" size="sm" className="h-9 px-2 text-xs" onClick={() => onChange(EMPTY_FILTERS)}>
          Clear
        </Button>
      )}
    </div>
  );
}
