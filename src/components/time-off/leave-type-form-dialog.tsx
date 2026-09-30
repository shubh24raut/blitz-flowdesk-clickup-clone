"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ColorPicker } from "@/components/shared/color-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { wait } from "@/lib/utils";
import { createLeaveType, updateLeaveType } from "@/store/actions/time-off";
import type { LeaveType } from "@/types";
import { leaveTypeSchema, type LeaveTypeInput } from "@/validators/leave.validator";

export function LeaveTypeFormDialog({
  open,
  onOpenChange,
  leaveType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveType?: LeaveType | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={leaveType ? "Edit leave type" : "New leave type"} size="sm">
        {open && <LeaveTypeForm leaveType={leaveType ?? null} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      {children}
    </label>
  );
}

function LeaveTypeForm({ leaveType, onDone }: { leaveType: LeaveType | null; onDone: () => void }) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeaveTypeInput>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: leaveType
      ? { name: leaveType.name, color: leaveType.color, allowance: leaveType.allowance, paid: leaveType.paid, requiresApproval: leaveType.requiresApproval }
      : { name: "", color: "#5B5CF6", allowance: 12, paid: true, requiresApproval: true },
  });
  const allowance = useWatch({ control, name: "allowance" });
  const unlimited = allowance === null;

  async function onSubmit(values: LeaveTypeInput) {
    await wait(300);
    if (leaveType) updateLeaveType(leaveType.id, values);
    else createLeaveType(values);
    toast.success(leaveType ? "Leave type updated" : `${values.name} created`);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
      <DialogBody className="space-y-4">
        <Field label="Name" htmlFor="lt-name" required error={errors.name?.message}>
          <Input id="lt-name" autoFocus placeholder="Casual leave" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Color" error={errors.color?.message}>
          <Controller control={control} name="color" render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />} />
        </Field>
        <ToggleRow label="No yearly limit" description="Useful for unpaid leave.">
          <Switch checked={unlimited} onCheckedChange={(on) => setValue("allowance", on ? null : 12, { shouldValidate: true })} />
        </ToggleRow>
        {!unlimited && (
          <Field label="Days per year" htmlFor="lt-allowance" required error={errors.allowance?.message} hint="Fixed allowance, resets every January.">
            <Input
              id="lt-allowance"
              type="number"
              min={0}
              max={365}
              step={0.5}
              className="w-32"
              aria-invalid={!!errors.allowance}
              {...register("allowance", { valueAsNumber: true })}
            />
          </Field>
        )}
        <ToggleRow label="Paid" description="Shown on the request; payroll comes later.">
          <Controller control={control} name="paid" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
        </ToggleRow>
        <ToggleRow label="Needs approval" description="Off = booked instantly (e.g. sick leave).">
          <Controller control={control} name="requiresApproval" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
        </ToggleRow>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {leaveType ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}
