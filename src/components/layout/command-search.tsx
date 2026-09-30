"use client";

import { CornerDownLeft, FolderKanban, Search, SquareCheckBig, UsersRound, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useMemo, useState } from "react";
import { useUI } from "@/components/providers/ui-provider";
import { UserAvatar } from "@/components/shared/avatar";
import { cn } from "@/lib/utils";
import { indexes, taskKey } from "@/store/selectors";
import { useWorkspace } from "@/store/hooks";
import { NAV_ITEMS } from "./nav-items";

interface Result {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon?: LucideIcon;
  color?: string;
  userId?: string;
  run: () => void;
}

export function CommandSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[10dvh] z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover shadow-overlay outline-none data-[state=open]:animate-fade-in">
          <DialogPrimitive.Title className="sr-only">Search FlowDesk</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Search tasks, projects, clients and people.</DialogPrimitive.Description>
          {open && <SearchBody onClose={() => onOpenChange(false)} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function SearchBody({ onClose }: { onClose: () => void }) {
  const state = useWorkspace();
  const router = useRouter();
  const { openTask } = useUI();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const go = (href: string) => () => {
      onClose();
      router.push(href);
    };
    const pages: Result[] = NAV_ITEMS.map((item) => ({
      id: `nav-${item.href}`,
      group: "Go to",
      label: item.label,
      icon: item.icon,
      run: go(item.href),
    }));
    if (!q) return pages;
    const match = (text: string) => text.toLowerCase().includes(q);
    const projects = indexes(state).projects;
    const tasks: Result[] = state.tasks
      .filter((t) => match(t.title) || match(taskKey(state, t)))
      .slice(0, 6)
      .map((t) => ({
        id: t.id,
        group: "Tasks",
        label: t.title,
        hint: `${taskKey(state, t)} · ${projects.get(t.projectId)?.name ?? ""}`,
        icon: SquareCheckBig,
        run: () => {
          onClose();
          openTask(t.id);
        },
      }));
    const projectResults: Result[] = state.projects
      .filter((p) => match(p.name))
      .slice(0, 5)
      .map((p) => ({ id: p.id, group: "Projects", label: p.name, hint: p.status, icon: FolderKanban, color: p.color, run: go(`/projects/${p.id}/tasks`) }));
    const clients: Result[] = state.clients
      .filter((c) => match(c.name) || match(c.contactPerson))
      .slice(0, 4)
      .map((c) => ({ id: c.id, group: "Clients", label: c.name, hint: c.contactPerson, icon: UsersRound, color: c.color, run: go(`/clients/${c.id}`) }));
    const people: Result[] = state.users
      .filter((u) => match(u.name) || match(u.email))
      .slice(0, 4)
      .map((u) => ({ id: u.id, group: "People", label: u.name, hint: u.title, userId: u.id, run: go("/team") }));
    return [...tasks, ...projectResults, ...clients, ...people, ...pages.filter((p) => match(p.label))];
  }, [query, state, router, onClose, openTask]);

  const users = indexes(state).users;
  const clampedActive = Math.min(active, Math.max(results.length - 1, 0));

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActive((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActive((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          results[clampedActive]?.run();
        }
      }}
    >
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-5 text-subtle" />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          placeholder="Search tasks, projects, clients, people…"
          aria-label="Search"
          className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-subtle"
        />
        <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
      </div>
      <ul role="listbox" className="scrollbar-thin max-h-[min(420px,60dvh)] overflow-y-auto p-2">
        {results.length === 0 && (
          <li className="px-4 py-12 text-center text-sm text-muted-foreground">No results for “{query}”</li>
        )}
        {results.map((r, index) => {
          const header = index === 0 || results[index - 1].group !== r.group ? r.group : null;
          const Icon = r.icon;
          return (
            <li key={`${r.group}-${r.id}`} role="option" aria-selected={index === clampedActive}>
              {header && <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">{header}</p>}
              <button
                type="button"
                onMouseMove={() => setActive(index)}
                onClick={r.run}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm",
                  index === clampedActive && "bg-muted",
                )}
              >
                {r.userId ? (
                  <UserAvatar user={users.get(r.userId)} size="sm" />
                ) : Icon ? (
                  <Icon className="size-4 shrink-0" style={{ color: r.color }} />
                ) : null}
                <span className="min-w-0 flex-1 truncate font-medium">{r.label}</span>
                {r.hint && <span className="hidden truncate text-xs text-muted-foreground sm:block">{r.hint}</span>}
                {index === clampedActive && <CornerDownLeft className="size-3.5 text-subtle" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
