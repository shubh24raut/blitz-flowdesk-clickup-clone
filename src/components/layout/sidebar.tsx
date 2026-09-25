"use client";

import { ChevronsUpDown, LogOut, Plus, Settings, Sparkles, Star, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LetterTile } from "@/components/shared/avatar";
import { Logo, LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { cn, initials } from "@/lib/utils";
import { useAppState } from "@/store/hooks";
import { useUI } from "@/components/providers/ui-provider";
import { NAV_ITEMS, isActive } from "./nav-items";
import { useLogout } from "./use-logout";

/**
 * Desktop sidebar. Icon-only between md and lg (tablet), full width from lg.
 */
export function Sidebar() {
  const pathname = usePathname();
  const state = useAppState();
  const logout = useLogout();
  const { openCreateProject } = useUI();
  const starred = state.projects.filter((p) => p.starred && p.status !== "Archived");
  const memberCount = state.users.filter((u) => u.status !== "Inactive").length;

  return (
    <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col border-r border-border bg-sidebar md:flex lg:w-64">
      <div className="flex h-16 items-center px-5 lg:px-6">
        <Link href="/dashboard" aria-label="FlowDesk home">
          <Logo className="hidden lg:inline-flex" />
          <LogoMark className="lg:hidden" />
        </Link>
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

      <div className="space-y-3 p-3 lg:p-4">
        <div className="hidden rounded-2xl bg-gradient-to-br from-primary to-violet-500 p-4 text-white lg:block">
          <Sparkles className="size-5" />
          <p className="mt-2 text-sm font-semibold">Upgrade to Business</p>
          <p className="mt-0.5 text-xs text-white/80">Unlock automations, guests and advanced reports.</p>
          <Button size="sm" variant="secondary" className="mt-3 h-7 w-full border-0 text-xs text-primary">
            View plans
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card p-2 text-left shadow-card transition hover:bg-muted lg:justify-start lg:p-2.5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-xs font-bold text-white">
                {initials(state.organization.name)}
              </span>
              <span className="hidden min-w-0 flex-1 lg:block">
                <span className="block truncate text-sm font-semibold">{state.organization.name}</span>
                <span className="block text-xs text-muted-foreground">{memberCount} members</span>
              </span>
              <ChevronsUpDown className="hidden size-4 text-muted-foreground lg:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-60">
            <DropdownMenuLabel>{state.organization.plan} workspace</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=organization">
                <Settings /> Workspace settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/team?invite=1">
                <UserPlus /> Invite members
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={logout}>
              <LogOut /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
