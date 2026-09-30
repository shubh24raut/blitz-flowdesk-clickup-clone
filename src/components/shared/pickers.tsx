"use client";

import { Check, ChevronDown, UserPlus } from "lucide-react";
import { useMemo, useState, type ComponentProps, type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PRIORITIES, PRIORITY_STYLES } from "@/constants";
import { cn } from "@/lib/utils";
import type { ID, Priority, Stage, User } from "@/types";
import { AvatarStack, UserAvatar } from "./avatar";
import { PriorityBadge } from "./badges";

const triggerClass =
  "inline-flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm shadow-card transition hover:border-slate-300 focus-visible:border-primary data-[state=open]:border-primary data-[state=open]:ring-3 data-[state=open]:ring-primary/15 dark:hover:border-slate-500";

export function UserPicker({
  users,
  value,
  onChange,
  placeholder = "Select assignees",
  single,
  trigger,
  align = "start",
}: {
  users: User[];
  value: ID[];
  onChange: (ids: ID[]) => void;
  placeholder?: string;
  single?: boolean;
  trigger?: ReactNode;
  align?: "start" | "end";
}) {
  const [query, setQuery] = useState("");
  const selected = useMemo(() => users.filter((u) => value.includes(u.id)), [users, value]);
  const filtered = users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));

  function toggle(id: ID) {
    if (single) onChange(value.includes(id) ? [] : [id]);
    else onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <Popover onOpenChange={(open) => !open && setQuery("")}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <button type="button" className={triggerClass}>
            {selected.length === 0 ? (
              <span className="flex-1 text-subtle">{placeholder}</span>
            ) : selected.length === 1 ? (
              <span className="flex flex-1 items-center gap-2 truncate">
                <UserAvatar user={selected[0]} size="sm" />
                <span className="truncate font-medium">{selected[0].name}</span>
              </span>
            ) : (
              <span className="flex flex-1 items-center gap-2">
                <AvatarStack users={selected} max={4} size="sm" />
                <span className="text-muted-foreground">{selected.length} people</span>
              </span>
            )}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align={align} className="w-72 p-0">
        <div className="border-b border-border p-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            aria-label="Search people"
            className="h-8 w-full rounded-md bg-muted px-2.5 text-sm outline-none placeholder:text-subtle"
          />
        </div>
        <ul className="scrollbar-thin max-h-64 overflow-y-auto p-1" role="listbox" aria-multiselectable={!single}>
          {filtered.length === 0 && <li className="px-3 py-6 text-center text-xs text-muted-foreground">No people found</li>}
          {filtered.map((user) => {
            const active = value.includes(user.id);
            return (
              <li key={user.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => toggle(user.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-muted"
                >
                  <UserAvatar user={user} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{user.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{user.title}</span>
                  </span>
                  {active && <Check className="size-4 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** Trigger showing current assignees. Forwards props/ref so it works as a Radix `asChild` trigger. */
export function AssigneeButton({ users, className, ...props }: { users: User[] } & ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={`Assignees: ${users.map((u) => u.name).join(", ") || "Unassigned"}`}
      className={cn(triggerClass, className)}
      {...props}
    >
      {users.length === 0 ? (
        <span className="flex flex-1 items-center gap-2 text-subtle">
          <UserPlus className="size-4" /> Unassigned
        </span>
      ) : users.length === 1 ? (
        <span className="flex flex-1 items-center gap-2 truncate">
          <UserAvatar user={users[0]} size="sm" />
          <span className="truncate font-medium">{users[0].name}</span>
        </span>
      ) : (
        <span className="flex flex-1 items-center gap-2">
          <AvatarStack users={users} max={3} size="sm" />
          <span className="truncate text-muted-foreground">{users.length} assignees</span>
        </span>
      )}
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

export function PriorityPicker({
  value,
  onChange,
  className,
}: {
  value: Priority;
  onChange: (priority: Priority) => void;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn(triggerClass, className)} aria-label={`Priority: ${value}`}>
          <span className={cn("size-2.5 rounded-full", PRIORITY_STYLES[value].dot)} />
          <span className="flex-1 font-medium" style={{ color: PRIORITY_STYLES[value].color }}>
            {value}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as Priority)}>
          {PRIORITIES.map((p) => (
            <DropdownMenuRadioItem key={p} value={p}>
              <PriorityBadge priority={p} />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StagePicker({
  stages,
  value,
  onChange,
  className,
  compact,
}: {
  stages: Stage[];
  value: ID;
  onChange: (stageId: ID) => void;
  className?: string;
  compact?: boolean;
}) {
  const current = stages.find((s) => s.id === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Stage: ${current?.name ?? "None"}`}
          className={cn(
            compact
              ? "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition hover:brightness-95"
              : triggerClass,
            className,
          )}
          style={compact && current ? { backgroundColor: `${current.color}22`, color: current.color } : undefined}
        >
          <span className="size-2 rounded-full" style={{ backgroundColor: current?.color }} />
          <span className={cn("flex-1 truncate font-medium", compact && "text-foreground/80")}>{current?.name ?? "Select stage"}</span>
          <ChevronDown className="size-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {stages.map((s) => (
            <DropdownMenuRadioItem key={s.id} value={s.id}>
              <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="flex-1">{s.name}</span>
              {s.isCompleted && <span className="text-[10px] font-semibold uppercase text-emerald-600">Done</span>}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
