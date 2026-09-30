"use client";

import { Plus, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LetterTile } from "@/components/shared/avatar";
import { Logo, LogoMark } from "@/components/shared/logo";
import { Tooltip } from "@/components/ui/tooltip";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/store/hooks";
import { useUI } from "@/components/providers/ui-provider";
import { NAV_ITEMS, isActive } from "./nav-items";

/**
 * Desktop sidebar. Icon-only between md and lg (tablet), full width from lg.
 * The workspace switcher sits under the logo; everything below it is scoped to that workspace.
 */
export function Sidebar() {
  const pathname = usePathname();
  const state = useWorkspace();
  const { openCreateProject } = useUI();
  const starred = state.projects.filter((p) => p.starred && p.status !== "Archived");

  return (
    <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col border-r border-border bg-sidebar md:flex lg:w-64">
      <div className="flex h-16 items-center px-5 lg:px-6">
        <Link href="/dashboard" aria-label="FlowDesk home">
          <Logo className="hidden lg:inline-flex" />
          <LogoMark className="lg:hidden" />
        </Link>
      </div>

      <div className="px-3 pb-1 lg:px-4">
        <WorkspaceSwitcher />
      </div>

      <nav aria-label="Main" className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3 lg:px-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const link = (
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors lg:justify-start",
                  active
                    ? "bg-primary-light text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-4.5 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
            return (
              <li key={item.href}>
                <span className="lg:hidden">
                  <Tooltip content={item.label} side="right">
                    {link}
                  </Tooltip>
                </span>
                <span className="hidden lg:block">{link}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-7 hidden lg:block">
          <div className="flex items-center justify-between px-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Favorites</p>
            <button
              type="button"
              onClick={openCreateProject}
              aria-label="New project"
              className="rounded-md p-1 text-subtle hover:bg-muted hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <ul className="mt-2 space-y-0.5">
            {starred.length === 0 && (
              <li className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                <Star className="size-3.5" /> Star a project to pin it here
              </li>
            )}
            {starred.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}/tasks`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-muted",
                    pathname.startsWith(`/projects/${p.id}`) ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  <LetterTile name={p.name} color={p.color} size="sm" className="size-5 rounded-md text-[10px]" />
                  <span className="truncate">{p.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
