"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ColorPicker } from "@/components/shared/color-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field, Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CLIENT_STATUSES } from "@/constants";
import { wait } from "@/lib/utils";
import { createClient, updateClient } from "@/store/actions/clients";
import type { Client } from "@/types";

const schema = z.object({
  name: z.string().trim().min(2, "Company name is required"),
  contactPerson: z.string().trim().min(2, "Add a primary contact"),
  email: z.email("Enter a valid email"),
  phone: z.string().trim(),
  website: z.union([z.literal(""), z.url("Enter a full URL, e.g. https://acme.com")]),
  industry: z.string().trim(),
  address: z.string().trim(),
  status: z.enum(["Active", "Inactive", "Lead"]),
  color: z.string(),
  notes: z.string().max(1000),
});

type FormValues = z.infer<typeof schema>;

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
  onCreated?: (client: Client) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title={client ? `Edit ${client.name}` : "Add client"}
        description={client ? "Update company and contact details." : "Add a company you work with. You can link projects to it."}
      >
        {open && <ClientForm client={client} onCreated={onCreated} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ClientForm({ client, onDone, onCreated }: { client?: Client; onDone: () => void; onCreated?: (client: Client) => void }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client?.name ?? "",
      contactPerson: client?.contactPerson ?? "",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
      website: client?.website ?? "",
      industry: client?.industry ?? "",
      address: client?.address ?? "",
      status: client?.status ?? "Active",
      color: client?.color ?? "#3B82F6",
      notes: client?.notes ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    await wait(350);
    if (client) {
      updateClient(client.id, values);
      toast.success("Client updated");
    } else {
      const created = createClient(values);
      toast.success(`${created.name} added to clients`);
      onCreated?.(created);
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
      <DialogBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" htmlFor="client-name" required error={errors.name?.message} className="sm:col-span-2">
            <Input id="client-name" autoFocus placeholder="Acme Studio" aria-invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field label="Contact person" htmlFor="client-contact" required error={errors.contactPerson?.message}>
            <Input id="client-contact" placeholder="John Doe" aria-invalid={!!errors.contactPerson} {...register("contactPerson")} />
          </Field>
          <Field label="Email" htmlFor="client-email" required error={errors.email?.message}>
            <Input id="client-email" type="email" placeholder="john@acme.com" aria-invalid={!!errors.email} {...register("email")} />
          </Field>
          <Field label="Phone" htmlFor="client-phone">
            <Input id="client-phone" type="tel" placeholder="+1 555 0100" {...register("phone")} />
          </Field>
          <Field label="Website" htmlFor="client-website" error={errors.website?.message}>
            <Input id="client-website" placeholder="https://acme.com" aria-invalid={!!errors.website} {...register("website")} />
          </Field>
          <Field label="Industry" htmlFor="client-industry">
            <Input id="client-industry" placeholder="SaaS" {...register("industry")} />
          </Field>
          <Field label="Status" htmlFor="client-status">
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select id="client-status" value={field.value} onValueChange={field.onChange} options={CLIENT_STATUSES.map((s) => ({ value: s, label: s }))} />
              )}
            />
          </Field>
          <Field label="Address" htmlFor="client-address" className="sm:col-span-2">
            <Input id="client-address" placeholder="Street, City" {...register("address")} />
          </Field>
        </div>
        <div className="space-y-2">
          <Label>Brand color</Label>
          <Controller control={control} name="color" render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />} />
        </div>
        <Field label="Notes" htmlFor="client-notes" error={errors.notes?.message}>
          <Textarea id="client-notes" rows={3} placeholder="Preferences, billing details, anything useful…" {...register("notes")} />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {client ? "Save changes" : "Add Client"}
        </Button>
      </DialogFooter>
    </form>
  );
}
