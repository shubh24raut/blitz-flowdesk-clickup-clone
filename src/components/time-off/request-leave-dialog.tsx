"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DatePicker, type DayMark } from "@/components/ui/date-picker";
import { Field, FieldError, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatDays, fromDateKey, isDateKey } from "@/lib/time-off";
import { wait } from "@/lib/utils";
import { requestLeave } from "@/store/actions/time-off";
import { useWorkspace, useCurrentUser } from "@/store/hooks";
import { holidaysFor, leaveBalances, leaveDaysFor } from "@/store/selectors";
import { leaveRequestSchema, type LeaveRequestInput } from "@/validators/leave.validator";
import { SkippedDaysNote } from "./skipped-days-note";

export function RequestLeaveDialog({
  open,
  onOpenChange,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Prefills the start and end date (yyyy-MM-dd). */
  defaultDate?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Request time off" description="Weekends and holidays aren't counted." size="sm">
        {open && <RequestForm defaultDate={defaultDate} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function RequestForm({ defaultDate, onDone }: { defaultDate?: string; onDone: () => void }) {
  const state = useWorkspace();
  const me = useCurrentUser();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LeaveRequestInput>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      typeId: state.leaveTypes[0]?.id ?? "",
      startDate: defaultDate ?? "",
      endDate: defaultDate ?? "",
      halfDay: false,
      reason: "",
    },
  });
  const [typeId, startDate, endDate, halfDay] = useWatch({ control, name: ["typeId", "startDate", "endDate", "halfDay"] });

  const singleDay = !!startDate && startDate === endDate;
  const validRange = isDateKey(startDate) && isDateKey(endDate) && endDate >= startDate;
  const days = validRange ? leaveDaysFor(state, me.id, { start: startDate, end: endDate, halfDay: singleDay && halfDay }) : null;
  // Marks holidays and weekends in the date pickers so the day count is never a surprise.
  const holidayNames = new Map(holidaysFor(state, me.id).map((h) => [h.date, h]));
  const dayMark = (key: string): DayMark | undefined => {
    const holiday = holidayNames.get(key);
    if (holiday) return { kind: holiday.kind === "optional" ? "note" : "off", label: holiday.name };
    if (!state.organization.workingDays.includes(fromDateKey(key).getDay())) return { kind: "muted", label: "Weekend" };
  };
  const year = Number((startDate || new Date().toISOString()).slice(0, 4));
  const balances = leaveBalances(state, me.id, year);
  const balance = balances.find((b) => b.type.id === typeId);

  async function onSubmit(values: LeaveRequestInput) {
    await wait(350);
    const result = requestLeave({ ...values, halfDay: values.halfDay && values.startDate === values.endDate });
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    toast.success(result.value.status === "Approved" ? "Leave booked" : "Request sent for approval", {
      description: `${formatDays(result.value.days)} of ${balance?.type.name.toLowerCase() ?? "leave"}`,
    });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
      <DialogBody className="space-y-4">
        <Field label="Leave type" htmlFor="leave-type" required error={errors.typeId?.message}>
          <Controller
            control={control}
            name="typeId"
            render={({ field }) => (
              <Select
                id="leave-type"
                value={field.value}
                onValueChange={field.onChange}
                options={balances.map((b) => ({
                  value: b.type.id,
                  textValue: b.type.name,
                  label: (
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: b.type.color }} />
                      {b.type.name}
                      <span className="text-xs text-muted-foreground">
                        {b.remaining === null ? "No limit" : `${formatDays(b.remaining)} left`}
                      </span>
                    </span>
                  ),
                }))}
              />
            )}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From" htmlFor="leave-start" required error={errors.startDate?.message}>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <DatePicker
                  id="leave-start"
                  value={field.value}
                  clearable={false}
                  dayMark={dayMark}
                  invalid={!!errors.startDate}
                  onChange={(v) => {
                    field.onChange(v);
                    if (!endDate || endDate < v) setValue("endDate", v, { shouldValidate: !!errors.endDate });
                  }}
                />
              )}
            />
          </Field>
          <Field label="To" htmlFor="leave-end" required error={errors.endDate?.message}>
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <DatePicker id="leave-end" value={field.value} clearable={false} dayMark={dayMark} invalid={!!errors.endDate} onChange={field.onChange} />
              )}
            />
          </Field>
        </div>

        {singleDay && (
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3">
            <span>
              <span className="block text-sm font-medium">Half day</span>
              <span className="block text-xs text-muted-foreground">Counts as 0.5 days.</span>
            </span>
            <Controller control={control} name="halfDay" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
          </label>
        )}

        <Field label="Reason" htmlFor="leave-reason" hint="Visible to owners and admins." error={errors.reason?.message}>
          <Textarea id="leave-reason" rows={3} placeholder="Optional" {...register("reason")} />
        </Field>

        {days !== null && (
          <div className="flex items-start gap-3 rounded-xl bg-lavender px-3.5 py-3 text-sm">
            <CalendarCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              <span className="font-semibold">{days === 0 ? "No working days" : formatDays(days)}</span>
              {balance && days > 0 && (
                <span className="text-muted-foreground">
                  {" · "}
                  {balance.remaining === null
                    ? `${balance.type.name} has no yearly limit`
                    : `${formatDays(Math.max(balance.remaining - days, 0))} of ${balance.type.name.toLowerCase()} left after this`}
                </span>
              )}
              {validRange && <SkippedDaysNote userId={me.id} start={startDate} end={endDate} className="mt-0.5" />}
              {balance && !balance.type.requiresApproval && days > 0 && (
                <span className="block text-xs text-muted-foreground">Approved automatically.</span>
              )}
            </p>
          </div>
        )}
        <FieldError message={errors.root?.message} />
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={state.leaveTypes.length === 0}>
          {balance && !balance.type.requiresApproval ? "Book leave" : "Send request"}
        </Button>
      </DialogFooter>
    </form>
  );
}
