"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { HOLIDAY_KIND_LABELS } from "@/constants";
import { wait } from "@/lib/utils";
import { addHoliday, updateHoliday } from "@/store/actions/time-off";
import { useAppState } from "@/store/hooks";
import type { Holiday, HolidayKind } from "@/types";
import { holidaySchema, type HolidayInput } from "@/validators/holiday.validator";

/** Radix Select can't hold `null`, so company-wide is stored under this key in the form. */
const COMPANY = "__company__";

export function HolidayFormDialog({
  open,
  onOpenChange,
  holiday,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this holiday; omit to create one. */
  holiday?: Holiday | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={holiday ? "Edit holiday" : "Add holiday"} size="sm">
        {open && <HolidayForm holiday={holiday ?? null} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function HolidayForm({ holiday, onDone }: { holiday: Holiday | null; onDone: () => void }) {
  const state = useAppState();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HolidayInput>({
    resolver: zodResolver(holidaySchema),
    defaultValues: holiday
      ? { name: holiday.name, date: holiday.date, kind: holiday.kind, calendarId: holiday.calendarId }
      : { name: "", date: "", kind: "company", calendarId: null },
  });

  async function onSubmit(values: HolidayInput) {
    await wait(300);
    if (holiday) updateHoliday(holiday.id, values);
    else addHoliday(values);
    toast.success(holiday ? "Holiday updated" : `${values.name} added`);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
      <DialogBody className="space-y-4">
        <Field label="Name" htmlFor="holiday-name" required error={errors.name?.message}>
          <Input id="holiday-name" autoFocus placeholder="Diwali" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Date" htmlFor="holiday-date" required error={errors.date?.message}>
          <Controller
            control={control}
            name="date"
            render={({ field }) => <DatePicker id="holiday-date" value={field.value} onChange={field.onChange} clearable={false} invalid={!!errors.date} />}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="holiday-kind" hint="Optional holidays don't give the day off.">
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <Select
                  id="holiday-kind"
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as HolidayKind)}
                  options={(Object.keys(HOLIDAY_KIND_LABELS) as HolidayKind[]).map((k) => ({ value: k, label: HOLIDAY_KIND_LABELS[k] }))}
                />
              )}
            />
          </Field>
          <Field label="Applies to" htmlFor="holiday-calendar">
            <Controller
              control={control}
              name="calendarId"
              render={({ field }) => (
                <Select
                  id="holiday-calendar"
                  value={field.value ?? COMPANY}
                  onValueChange={(v) => field.onChange(v === COMPANY ? null : v)}
                  options={[
                    { value: COMPANY, label: "Everyone" },
                    ...state.holidayCalendars.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              )}
            />
          </Field>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {holiday ? "Save" : "Add holiday"}
        </Button>
      </DialogFooter>
    </form>
  );
}
