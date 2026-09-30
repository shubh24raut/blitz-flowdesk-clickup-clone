"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { wait } from "@/lib/utils";
import { inviteMember } from "@/store/actions/team";
import { getState } from "@/store/store";

const schema = z.object({
  name: z.string().trim().min(2, "Enter their name"),
  email: z
    .email("Enter a valid email")
    .refine((e) => !getState().users.some((u) => u.email.toLowerCase() === e.toLowerCase()), "This person is already in the workspace"),
  role: z.enum(["Admin", "Member"]),
  title: z.string().trim(),
});
type FormValues = z.infer<typeof schema>;

export function InviteMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Invite member" description="They'll get an email invite to join your workspace (simulated)." size="sm">
        {open && <InviteForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", role: "Member", title: "" } });

  async function onSubmit(values: FormValues) {
    await wait(500);
    const user = inviteMember(values);
    toast.success(`Invitation sent to ${user.email}`);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
      <DialogBody className="space-y-4">
        <Field label="Full name" htmlFor="invite-name" required error={errors.name?.message}>
          <Input id="invite-name" autoFocus placeholder="Jane Cooper" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="invite-email" required error={errors.email?.message}>
          <Input id="invite-email" type="email" placeholder="jane@company.com" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role" htmlFor="invite-role">
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  id="invite-role"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    { value: "Member", label: "Member" },
                    { value: "Admin", label: "Admin" },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="Job title" htmlFor="invite-title">
            <Input id="invite-title" placeholder="Designer" {...register("title")} />
          </Field>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Send invite
        </Button>
      </DialogFooter>
    </form>
  );
}
