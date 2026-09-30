"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { WEEKDAYS } from "@/constants";
import { cn } from "@/lib/utils";
import {
  deleteHolidayCalendar,
  deleteLeaveType,
  setDefaultHolidayCalendar,
  setMemberHolidayCalendar,
  setWorkingDays,
} from "@/store/actions/time-off";
import { useAppState } from "@/store/hooks";
import type { HolidayCalendar, LeaveType } from "@/types";
import { LeaveTypeFormDialog } from "./leave-type-form-dialog";

const DEFAULT = "__default__";

export function PoliciesPanel() {
  const state = useAppState();
  const org = state.organization;
  const [typeDialog, setTypeDialog] = useState<{ open: boolean; type: LeaveType | null }>({ open: false, type: null });
  const [removingCalendar, setRemovingCalendar] = useState<HolidayCalendar | null>(null);
  const defaultCalendar = state.holidayCalendars.find((c) => c.id === org.defaultHolidayCalendarId);

  function toggleDay(day: number) {
    const next = org.workingDays.includes(day) ? org.workingDays.filter((d) => d !== day) : [...org.workingDays, day];
    if (next.length === 0) {
      toast.error("Keep at least one working day");
      return;
    }
    setWorkingDays(next);
  }

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5">
        <h2 className="font-semibold">Working week</h2>
        <p className="text-sm text-muted-foreground">Leave is only counted on these days. Existing requests keep their day count.</p>
        <div role="group" aria-label="Working days" className="mt-4 flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => {
            const on = org.workingDays.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                aria-pressed={on}
                aria-label={d.long}
                onClick={() => toggleDay(d.value)}
                className={cn(
                  "h-9 w-14 rounded-lg border text-sm font-medium transition",
                  on ? "border-primary bg-primary-light text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {d.short}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Leave types</h2>
            <p className="text-sm text-muted-foreground">Fixed yearly allowances per member.</p>
          </div>
          <Button variant="soft" size="sm" onClick={() => setTypeDialog({ open: true, type: null })}>
            <Plus /> Add type
          </Button>
        </div>
        <ul className="mt-3 divide-y divide-border">
          {state.leaveTypes.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{t.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {t.allowance === null ? "No limit" : `${t.allowance} days / year`} · {t.paid ? "Paid" : "Unpaid"} ·{" "}
                  {t.requiresApproval ? "Needs approval" : "Auto-approved"}
                </span>
              </span>
              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${t.name}`} onClick={() => setTypeDialog({ open: true, type: t })}>
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${t.name}`}
                onClick={() => {
                  if (deleteLeaveType(t.id)) toast.success(`${t.name} deleted`);
                  else toast.error(`${t.name} is used by existing requests`, { description: "Edit it instead to keep history intact." });
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="font-semibold">Holiday calendars</h2>
        <p className="text-sm text-muted-foreground">
          Each member follows one national calendar, plus company-wide holidays. Import more from the Holidays tab.
        </p>
        {state.holidayCalendars.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No calendars yet — only company-wide holidays apply.</p>
        ) : (
          <>
            <ul className="mt-3 divide-y divide-border">
              {state.holidayCalendars.map((c) => {
                const count = state.holidays.filter((h) => h.calendarId === c.id).length;
                const isDefault = c.id === org.defaultHolidayCalendarId;
                return (
                  <li key={c.id} className="flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <span className="truncate">{c.name}</span>
                        {isDefault && <Badge className="bg-primary-light text-primary">Default</Badge>}
                      </span>
                      <span className="block text-xs text-muted-foreground">{count} holidays</span>
                    </span>
                    {!isDefault && (
                      <Button variant="ghost" size="sm" onClick={() => setDefaultHolidayCalendar(c.id)}>
                        Make default
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" aria-label={`Delete ${c.name}`} onClick={() => setRemovingCalendar(c)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>

            <h3 className="mt-5 text-sm font-semibold">Member calendars</h3>
            <ul className="mt-2 divide-y divide-border">
              {state.users
                .filter((u) => u.status !== "Inactive")
                .map((u) => (
                  <li key={u.id} className="flex items-center gap-3 py-2.5">
                    <UserAvatar user={u} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm">{u.name}</span>
                    <Select
                      size="sm"
                      className="w-52"
                      aria-label={`Holiday calendar for ${u.name}`}
                      value={u.holidayCalendarId ?? DEFAULT}
                      onValueChange={(v) => setMemberHolidayCalendar(u.id, v === DEFAULT ? null : v)}
                      options={[
                        { value: DEFAULT, label: defaultCalendar ? "Workspace default" : "None" },
                        ...state.holidayCalendars.map((c) => ({ value: c.id, label: c.name })),
                      ]}
                    />
                  </li>
                ))}
            </ul>
          </>
        )}
      </Card>

      <LeaveTypeFormDialog
        open={typeDialog.open}
        leaveType={typeDialog.type}
        onOpenChange={(open) => setTypeDialog((d) => ({ ...d, open }))}
      />
      <ConfirmDialog
        open={removingCalendar !== null}
        onOpenChange={(open) => !open && setRemovingCalendar(null)}
        title={`Delete ${removingCalendar?.name}?`}
        description="Its holidays are removed and members on it move to the default calendar."
        confirmLabel="Delete calendar"
        onConfirm={() => {
          if (!removingCalendar) return;
          deleteHolidayCalendar(removingCalendar.id);
          toast.success(`${removingCalendar.name} deleted`);
        }}
      />
    </div>
  );
}
