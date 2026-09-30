"use client";

import { format } from "date-fns";
import { Download, Pencil, PartyPopper, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { HOLIDAY_KIND_LABELS, HOLIDAY_KIND_STYLES } from "@/constants";
import { fromDateKey, toDateKey } from "@/lib/time-off";
import { cn } from "@/lib/utils";
import { deleteHoliday } from "@/store/actions/time-off";
import { useAppState, useCurrentUser } from "@/store/hooks";
import { holidayCalendarIdFor, isTimeOffAdmin } from "@/store/selectors";
import type { Holiday } from "@/types";
import { HolidayFormDialog } from "./holiday-form-dialog";
import { ImportHolidaysDialog } from "./import-holidays-dialog";

const ALL = "all";
const MINE = "mine";
const COMPANY = "company";

export function HolidaysPanel() {
  const state = useAppState();
  const me = useCurrentUser();
  const canManage = isTimeOffAdmin(me);
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [scope, setScope] = useState(MINE);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [removing, setRemoving] = useState<Holiday | null>(null);
  const today = toDateKey(new Date());

  const myCalendarId = holidayCalendarIdFor(state, me.id);
  const calendarNames = new Map(state.holidayCalendars.map((c) => [c.id, c.name]));
  const years = [...new Set([thisYear - 1, thisYear, thisYear + 1, ...state.holidays.map((h) => Number(h.date.slice(0, 4)))])].sort();

  const holidays = state.holidays
    .filter((h) => h.date.startsWith(String(year)))
    .filter((h) => {
      if (scope === ALL) return true;
      if (scope === MINE) return h.calendarId === null || h.calendarId === myCalendarId;
      if (scope === COMPANY) return h.calendarId === null;
      return h.calendarId === scope;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const byMonth = new Map<string, Holiday[]>();
  for (const h of holidays) {
    const month = format(fromDateKey(h.date), "MMMM");
    byMonth.set(month, [...(byMonth.get(month) ?? []), h]);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select
            size="sm"
            value={scope}
            onValueChange={setScope}
            aria-label="Holiday calendar"
            className="w-56"
            options={[
              { value: MINE, label: "My holidays" },
              { value: ALL, label: "All calendars" },
              { value: COMPANY, label: "Company-wide only" },
              ...state.holidayCalendars.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Select
            size="sm"
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
            aria-label="Year"
            className="w-28"
            options={years.map((y) => ({ value: String(y), label: String(y) }))}
          />
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
              <Download /> Import national
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> Add holiday
            </Button>
          </div>
        )}
      </div>

      {holidays.length === 0 ? (
        <Card>
          <EmptyState
            icon={PartyPopper}
            title={`No holidays in ${year}`}
            description={canManage ? "Import your country's public holidays or add company holidays." : "Your admins haven't added any yet."}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...byMonth].map(([month, list]) => (
            <Card key={month} className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle">{month}</h3>
              <ul className="mt-2 divide-y divide-border">
                {list.map((h) => {
                  const date = fromDateKey(h.date);
                  const past = h.date < today;
                  return (
                    <li key={h.id} className={cn("group flex items-center gap-3 py-2.5", past && "opacity-60")}>
                      <span className="grid w-10 shrink-0 place-items-center rounded-lg bg-muted py-1 leading-tight">
                        <span className="text-[10px] font-medium uppercase text-muted-foreground">{format(date, "EEE")}</span>
                        <span className="text-sm font-bold">{format(date, "d")}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{h.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {h.calendarId ? calendarNames.get(h.calendarId) ?? "Deleted calendar" : "Everyone"}
                        </span>
                      </span>
                      <Badge className={HOLIDAY_KIND_STYLES[h.kind]}>{HOLIDAY_KIND_LABELS[h.kind].replace(" holiday", "")}</Badge>
                      {canManage && (
                        <span className="flex opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Edit ${h.name}`}
                            onClick={() => {
                              setEditing(h);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" aria-label={`Delete ${h.name}`} onClick={() => setRemoving(h)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <HolidayFormDialog open={formOpen} onOpenChange={setFormOpen} holiday={editing} />
      <ImportHolidaysDialog open={importOpen} onOpenChange={setImportOpen} />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Delete ${removing?.name}?`}
        description="Leave already booked keeps its day count."
        confirmLabel="Delete holiday"
        onConfirm={() => {
          if (!removing) return;
          deleteHoliday(removing.id);
          toast.success(`${removing.name} deleted`);
        }}
      />
    </div>
  );
}
