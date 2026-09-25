"use client";

import { LogOut, Monitor, Moon, RotateCcw, Settings, Sun, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resetDemoData, updateSettings } from "@/services/settings";
import { useAppState, useCurrentUser } from "@/store/hooks";
import type { ThemePreference } from "@/types";
import { useLogout } from "./use-logout";

export function UserMenu() {
  const user = useCurrentUser();
  const theme = useAppState().settings.theme;
  const logout = useLogout();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="Account menu" className="rounded-full transition hover:ring-4 hover:ring-primary/10">
            <UserAvatar user={user} size="md" className="size-9" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          <div className="flex items-center gap-3 px-2.5 py-2">
            <UserAvatar user={user} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings?tab=profile">
              <User /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {theme === "dark" ? <Moon /> : theme === "system" ? <Monitor /> : <Sun />} Appearance
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={theme} onValueChange={(v) => updateSettings({ theme: v as ThemePreference })}>
                <DropdownMenuRadioItem value="light">
                  <Sun /> Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon /> Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <Monitor /> System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onSelect={() => setConfirmReset(true)}>
            <RotateCcw /> Reset demo data
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={logout}>
            <LogOut /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset demo data?"
        description="All clients, projects, tasks and settings will be restored to the original sample data. This cannot be undone."
        confirmLabel="Reset data"
        onConfirm={() => {
          resetDemoData();
          toast.success("Demo data restored");
        }}
      />
    </>
  );
}
