"use client";

import { LogOut, Monitor, Moon, Settings, Sun, User } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/avatar";
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
import { updateSettings } from "@/store/actions/settings";
import { useWorkspace, useCurrentUser } from "@/store/hooks";
import type { ThemePreference } from "@/types";
import { useLogout } from "@/hooks/use-logout";

export function UserMenu() {
  const user = useCurrentUser();
  const theme = useWorkspace().settings.theme;
  const logout = useLogout();

  return (
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
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={logout}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
