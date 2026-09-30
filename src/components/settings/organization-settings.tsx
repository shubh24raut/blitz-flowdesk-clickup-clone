"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { initials, wait } from "@/lib/utils";
import { updateOrganization } from "@/store/actions/settings";
import { useAppState } from "@/store/hooks";

const schema = z.object({
  name: z.string().trim().min(2, "Workspace name is required"),
  website: z.union([z.literal(""), z.url("Enter a full URL")]),
});
type FormValues = z.infer<typeof schema>;

export function OrganizationSettings() {
  const state = useAppState();
  const org = state.organization;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: org.name, website: org.website } });

  async function onSubmit(values: FormValues) {
    await wait(400);
    updateOrganization(values);
    reset(values);
    toast.success("Workspace updated");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-2xl bg-primary text-xl font-bold text-white">{initials(org.name)}</span>
        <div>
          <p className="text-lg font-semibold">{org.name}</p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge className="bg-primary-light text-primary">{org.plan} plan</Badge>
            {state.users.length} members · {state.projects.length} projects · {state.clients.length} clients
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-2xl gap-4 sm:grid-cols-2" noValidate>
        <Field label="Workspace name" htmlFor="org-name" error={errors.name?.message}>
          <Input id="org-name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Website" htmlFor="org-website" error={errors.website?.message}>
          <Input id="org-website" placeholder="https://" aria-invalid={!!errors.website} {...register("website")} />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
