"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  nextMonday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

/** Values are `yyyy-MM-dd` strings ("" = no date), matching the old `<input type="date">` contract. */
const toValue = (date: Date) => format(date, "yyyy-MM-dd");
const parse = (value: string) => {
  if (!value) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
};

const WEEK = { weekStartsOn: 0 } as const;

/** Per-day annotation: `off` = a day off (dot), `note` = informational (grey dot), `muted` = dimmed (e.g. weekends). */
export type DayMark = { kind: "off" | "note" | "muted"; label: string };

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Select date",
  invalid,
  clearable = true,
  presets = false,
  tone,
  dayMark,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  clearable?: boolean;
  /** Show quick picks (Today, Tomorrow, …) — useful for due dates. */
  presets?: boolean;
  /** Colors the trigger text, e.g. red for an overdue task. */
  tone?: "danger";
  /** Annotates days in the calendar (value is `yyyy-MM-dd`), e.g. holidays and weekends. */
  dayMark?: (value: string) => DayMark | undefined;
  className?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parse(value);

  function pick(date: Date | null) {
    onChange(date ? toValue(date) : "");
    setOpen(false);
  }

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            aria-label={ariaLabel ?? (selected ? `Date: ${format(selected, "d MMMM yyyy")}` : placeholder)}
            data-invalid={invalid || undefined}
            className={cn(
              "flex h-10 w-full min-w-0 items-center gap-2.5 rounded-lg border border-input bg-card px-3 text-left text-sm shadow-card outline-none transition",
              "hover:border-slate-300 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 dark:hover:border-slate-500",
              "data-[state=open]:border-primary data-[state=open]:ring-3 data-[state=open]:ring-primary/15 data-[invalid]:border-red-400",
              clearable && selected && "pr-9",
            )}
          >
            <CalendarDays className={cn("size-4 shrink-0", tone === "danger" ? "text-red-500" : "text-muted-foreground")} />
            <span
              className={cn(
                "truncate",
                !selected && "text-subtle",
                selected && "font-medium",
                selected && tone === "danger" && "text-red-500",
              )}
            >
              {selected ? format(selected, "d MMM yyyy") : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto p-0 data-[state=open]:animate-pop-in"
          // Focus the selected (or today's) date instead of the first button, ready for arrow keys.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).querySelector<HTMLButtonElement>('[data-day][tabindex="0"]')?.focus();
          }}
        >
          {open && <CalendarPanel selected={selected} onPick={pick} presets={presets} clearable={clearable} dayMark={dayMark} />}
        </PopoverContent>
      </Popover>
      {clearable && selected && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear date"
          className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-subtle transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function CalendarPanel({
  selected,
  onPick,
  presets,
  clearable,
  dayMark,
}: {
  selected: Date | null;
  onPick: (date: Date | null) => void;
  presets: boolean;
  clearable: boolean;
  dayMark?: (value: string) => DayMark | undefined;
}) {
  const [focused, setFocused] = useState<Date>(() => selected ?? new Date());
  const [month, setMonth] = useState<Date>(() => startOfMonth(selected ?? new Date()));
  const gridRef = useRef<HTMLDivElement>(null);

  // Always render 6 weeks so the popover height never jumps between months.
  const first = startOfWeek(month, WEEK);
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i));
  const weekdays = days.slice(0, 7);

  // After keyboard navigation, move DOM focus to the newly focused day (it may be in a new month).
  const navigated = useRef(false);
  useEffect(() => {
    if (!navigated.current) return;
    navigated.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${toValue(focused)}"]`)?.focus();
  }, [focused, month]);

  function moveFocus(next: Date) {
    navigated.current = true;
    setFocused(next);
    if (!isSameMonth(next, month)) setMonth(startOfMonth(next));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const map: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, -1),
      PageDown: () => addMonths(focused, 1),
      Home: () => startOfWeek(focused, WEEK),
      End: () => endOfWeek(focused, WEEK),
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      moveFocus(fn());
    }
  }

  const today = new Date();
  const quickPicks: Array<[string, Date]> = [
    ["Today", today],
    ["Tomorrow", addDays(today, 1)],
    ["Next week", nextMonday(today)],
    ["In 2 weeks", addWeeks(today, 2)],
  ];

  return (
    <div className="w-[284px] p-3">
      {presets && (
        <div className="mb-3 grid grid-cols-2 gap-1.5 border-b border-border pb-3">
          {quickPicks.map(([label, date]) => (
            <button
              key={label}
              type="button"
              onClick={() => onPick(date)}
              className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition hover:bg-muted"
            >
              {label}
              <span className="text-subtle">{format(date, "EEE d")}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold" aria-live="polite">
          {format(month, "MMMM yyyy")}
        </p>
        <div className="flex">
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, -1))}
            aria-label="Previous month"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            aria-label="Next month"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div role="grid" aria-label={format(month, "MMMM yyyy")} ref={gridRef} onKeyDown={onKeyDown} className="mt-2">
        <div role="row" className="grid grid-cols-7">
          {weekdays.map((d) => (
            <span key={d.toISOString()} role="columnheader" aria-label={format(d, "EEEE")} className="py-1.5 text-center text-[11px] font-medium text-subtle">
              {format(d, "EEEEEE")}
            </span>
          ))}
        </div>
        {Array.from({ length: 6 }, (_, week) => (
          <div key={week} role="row" className="grid grid-cols-7 gap-y-0.5">
            {days.slice(week * 7, week * 7 + 7).map((day) => {
              const isSelected = selected ? isSameDay(day, selected) : false;
              const inMonth = isSameMonth(day, month);
              const isFocused = isSameDay(day, focused);
              const mark = dayMark?.(toValue(day));
              return (
                <span key={day.toISOString()} role="gridcell" aria-selected={isSelected} className="grid place-items-center">
                  <button
                    type="button"
                    data-day={toValue(day)}
                    tabIndex={isFocused ? 0 : -1}
                    onClick={() => onPick(day)}
                    onFocus={() => !isFocused && setFocused(day)}
                    aria-label={`${format(day, "EEEE, d MMMM yyyy")}${mark ? `, ${mark.label}` : ""}`}
                    title={mark?.label}
                    aria-current={isToday(day) ? "date" : undefined}
                    className={cn(
                      "relative grid size-9 place-items-center rounded-lg text-sm tabular-nums outline-none transition",
                      "focus-visible:ring-2 focus-visible:ring-primary/50",
                      isSelected
                        ? "bg-primary font-semibold text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary-hover"
                        : isToday(day)
                          ? "bg-primary-light font-semibold text-primary hover:bg-primary/15"
                          : inMonth && mark?.kind !== "muted"
                            ? "text-foreground hover:bg-muted"
                            : "text-subtle hover:bg-muted",
                    )}
                  >
                    {format(day, "d")}
                    {(mark?.kind === "off" || mark?.kind === "note") && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full",
                          isSelected ? "bg-primary-foreground" : mark.kind === "off" ? "bg-emerald-500" : "bg-slate-400",
                        )}
                      />
                    )}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <button
          type="button"
          onClick={() => onPick(today)}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-light"
        >
          Today
        </button>
        {dayMark && (
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Holiday
          </span>
        )}
        {clearable && (
          <button
            type="button"
            onClick={() => onPick(null)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
