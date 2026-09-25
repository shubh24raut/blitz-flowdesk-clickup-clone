"use client";

import { Check, LogOut, Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { useLogout } from "@/components/layout/use-logout";
import { PageHeader } from "@/components/shared/page-header";
import { OrganizationSettings } from "@/components/settings/organization-settings";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { resetDemoData, updateNotificationPreferences, updateSettings } from "@/services/settings";
import { useAppState } from "@/store/hooks";
import type { NotificationPreferences, ThemePreference } from "@/types";

const TABS = ["profile", "organization", "appearance", "notifications", "data"] as const;
type Tab = (typeof TABS)[number];

const THEMES: Array<{ id: ThemePreference; label: string; icon: typeof Sun; preview: string }> = [
  { id: "light", label: "Light", icon: Sun, preview: "bg-[#F6F5FF] text-primary" },
  { id: "dark", label: "Dark", icon: Moon, preview: "bg-[#1E293B] text-slate-200" },
  { id: "system", label: "System", icon: Monitor, preview: "bg-gradient-to-r from-[#F6F5FF] from-50% to-[#1E293B] to-50% text-slate-500" },
];

const NOTIFICATIONS: Array<{ key: keyof NotificationPreferences; label: string; description: string }> = [
  { key: "taskAssignments", label: "Task assignments", description: "When someone assigns a task to you." },
  { key: "comments", label: "Comments", description: "Replies and @mentions on tasks you follow." },
  { key: "dueDateReminders", label: "Due date reminders", description: "A reminder the day before a task is due." },
  { key: "projectUpdates", label: "Project updates", description: "Status changes on projects you're a member of." },
  { key: "emailDigest", label: "Weekly email digest", description: "A Monday summary of what's due this week." },
];

function SettingsContent() {
  const state = useAppState();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const [confirmReset, setConfirmReset] = useState(false);
  const requested = params.get("tab");
  const tab: Tab = TABS.includes(requested as Tab) ? (requested as Tab) : "profile";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Settings" description="Manage your profile, workspace and preferences." />
      <Tabs value={tab} onValueChange={(v) => router.replace(`${pathname}?tab=${v}`, { scroll: false })}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <Card className="mt-5">
          <CardContent className="p-5 sm:p-7">
            <TabsContent value="profile">
              <ProfileSettings />
            </TabsContent>
            <TabsContent value="organization">
              <OrganizationSettings />
            </TabsContent>

            <TabsContent value="appearance" className="space-y-7">
              <div>
                <h2 className="font-semibold">Theme</h2>
                <p className="text-sm text-muted-foreground">Choose how FlowDesk looks on this device.</p>
                <div role="radiogroup" aria-label="Theme" className="mt-4 grid grid-cols-3 gap-3 sm:max-w-lg">
                  {THEMES.map((t) => {
                    const selected = state.settings.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          updateSettings({ theme: t.id });
                          toast.success(`${t.label} theme applied`);
                        }}
                        className={cn(
                          "group rounded-2xl border-2 p-2 text-left transition",
                          selected ? "border-primary ring-3 ring-primary/15" : "border-border hover:border-primary/40",
                        )}
                      >
                        <span className={cn("grid h-20 place-items-center rounded-xl", t.preview)}>
                          <t.icon className="size-6" />
                        </span>
                        <span className="mt-2 flex items-center justify-between px-1 text-sm font-medium">
                          {t.label}
                          {selected && <Check className="size-4 text-primary" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="max-w-xs space-y-1.5">
                <Label htmlFor="language">Language</Label>
                <NativeSelect
                  id="language"
                  value={state.settings.language}
                  onChange={(e) => {
                    updateSettings({ language: e.target.value });
                    toast.success(`Language set to ${e.target.value}`, { description: "Translations arrive with the backend release." });
                  }}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </NativeSelect>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <h2 className="font-semibold">Notifications</h2>
              <p className="text-sm text-muted-foreground">Pick what you want to be notified about.</p>
              <ul className="mt-4 divide-y divide-border">
                {NOTIFICATIONS.map((n) => (
                  <li key={n.key} className="flex items-center justify-between gap-4 py-4">
                    <label htmlFor={`notify-${n.key}`} className="cursor-pointer">
                      <span className="block text-sm font-medium">{n.label}</span>
                      <span className="block text-xs text-muted-foreground">{n.description}</span>
                    </label>
                    <Switch
                      id={`notify-${n.key}`}
                      checked={state.settings.notifications[n.key]}
                      onCheckedChange={(checked) => {
                        updateNotificationPreferences({ [n.key]: checked });
                        toast.success(`${n.label} ${checked ? "enabled" : "disabled"}`);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="data" className="space-y-5">
              <div>
                <h2 className="font-semibold">Demo data</h2>
                <p className="text-sm text-muted-foreground">
                  FlowDesk is running in demo mode — everything is stored in this browser&apos;s local storage.
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Reset demo data</p>
                  <p className="text-xs text-muted-foreground">Restore the original sample clients, projects and tasks.</p>
                </div>
                <Button variant="secondary" onClick={() => setConfirmReset(true)}>
                  <RotateCcw /> Reset
                </Button>
              </div>
              <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Sign out</p>
                  <p className="text-xs text-muted-foreground">End your session on this device.</p>
                </div>
                <Button variant="danger" onClick={logout}>
                  <LogOut /> Log out
                </Button>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset demo data?"
        description="All changes will be replaced by the original sample data."
        confirmLabel="Reset data"
        onConfirm={() => {
          resetDemoData();
          toast.success("Demo data restored");
        }}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <SettingsContent />
    </Suspense>
  );
}
