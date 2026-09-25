"use client";

import { FolderPlus, Plus, Search, SquarePlus } from "lucide-react";
import Link from "next/link";
import { useUI } from "@/components/providers/ui-provider";
import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsMenu } from "./notifications-menu";
import { UserMenu } from "./user-menu";

export function Topbar() {
  const { openSearch, openCreateTask, openCreateProject } = useUI();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6 lg:px-8">
      <Link href="/dashboard" className="md:hidden" aria-label="FlowDesk home">
        <LogoMark />
      </Link>

      <button
        type="button"
        onClick={openSearch}
        className="hidden h-9 w-full max-w-sm items-center gap-2.5 rounded-xl border border-border bg-card px-3 text-sm text-subtle shadow-card transition hover:border-slate-300 sm:flex dark:hover:border-slate-500"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search anything…</span>
        <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search"
          className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted sm:hidden"
        >
          <Search className="size-4.5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="hidden h-9 sm:inline-flex">
              <Plus /> New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem onSelect={() => openCreateTask()}>
              <SquarePlus /> New task
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={openCreateProject}>
              <FolderPlus /> New project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
