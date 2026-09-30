"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Field, Input, Label } from "@/components/ui/input";
import { slugify, uniqueSlug } from "@/lib/organizations";
import { cn } from "@/lib/utils";
import { isSlugAvailable } from "@/store/actions/organizations";
import { getState } from "@/store/store";
import type { Organization } from "@/types";
import { organizationSchema, type OrganizationFormInput } from "@/validators/organization.validator";
import { LogoPicker } from "./logo-picker";

export const WORKSPACE_URL_PREFIX = "flowdesk.app/";

/**
 * Name, URL, logo and website for a workspace. Used by the create dialog,
 * onboarding (name + URL only) and the organization settings.
 */
export function WorkspaceForm({
  organization,
  fields = "all",
  readOnly,
  idPrefix = "workspace",
  onSubmit,
  children,
  renderBody = (fieldsNode) => fieldsNode,
  className,
}: {
  /** Existing workspace when editing. The slug stops following the name once it exists. */
  organization?: Organization;
  fields?: "all" | "basic";
  readOnly?: boolean;
  idPrefix?: string;
  /** Returns an error message to show under the URL field, or nothing on success. */
  onSubmit: (values: OrganizationFormInput) => Promise<string | void> | string | void;
  /** Buttons; receives the form state so they can show loading / disabled. */
  children: (form: { isSubmitting: boolean; isDirty: boolean }) => ReactNode;
  /** Wraps the fields, e.g. in a scrollable `DialogBody`. */
  renderBody?: (fields: ReactNode) => ReactNode;
  className?: string;
}) {
  const [slugTouched, setSlugTouched] = useState(Boolean(organization));
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrganizationFormInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name ?? "",
      slug: organization?.slug ?? "",
      website: organization?.website ?? "",
      logoUrl: organization?.logoUrl,
    },
  });
  const [name, slug] = useWatch({ control, name: ["name", "slug"] });
  const slugTaken = slug.length > 1 && !isSlugAvailable(getState(), slug, organization?.id);

  async function submit(values: OrganizationFormInput) {
    if (!isSlugAvailable(getState(), values.slug, organization?.id)) {
      setError("slug", { message: "That workspace URL is already taken" });
      return;
    }
    const error = await onSubmit(values);
    if (error) setError("slug", { message: error });
    else if (organization) reset(values);
  }

  const nameField = register("name");

  return (
    <form onSubmit={handleSubmit(submit)} className={cn("flex min-h-0 flex-1 flex-col", className)} noValidate>
      {renderBody(
        <fieldset disabled={readOnly} className="contents">
          <div className="space-y-4">
            <Field label="Workspace name" htmlFor={`${idPrefix}-name`} required error={errors.name?.message}>
              <Input
                id={`${idPrefix}-name`}
                placeholder="Acme Creative"
                autoComplete="organization"
                aria-invalid={!!errors.name}
                {...nameField}
                onChange={(e) => {
                  void nameField.onChange(e);
                  if (!slugTouched) {
                    const taken = getState().organizations.map((o) => o.slug);
                    setValue("slug", uniqueSlug(slugify(e.target.value), taken), { shouldDirty: true });
                  }
                }}
              />
            </Field>
  
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${idPrefix}-slug`}>Workspace URL</Label>
              <div
                className={cn(
                  "flex h-10 items-center overflow-hidden rounded-lg border border-input bg-card text-sm shadow-card transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15 has-disabled:opacity-60",
                  (errors.slug || slugTaken) && "border-red-400",
                )}
              >
                <span className="flex h-full shrink-0 items-center border-r border-border bg-muted/60 px-3 text-muted-foreground">
                  {WORKSPACE_URL_PREFIX}
                </span>
                <input
                  id={`${idPrefix}-slug`}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-subtle"
                  placeholder="acme-creative"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-invalid={!!errors.slug || slugTaken}
                  {...register("slug", {
                    onChange: (e) => {
                      setSlugTouched(true);
                      setValue("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    },
                  })}
                />
              </div>
              {errors.slug ? (
                <p role="alert" className="text-xs text-red-500">
                  {errors.slug.message}
                </p>
              ) : slugTaken ? (
                <p role="alert" className="text-xs text-red-500">
                  That workspace URL is already taken
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Lowercase letters, numbers and hyphens.</p>
              )}
            </div>
  
            {fields === "all" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>Logo</Label>
                  <Controller
                    control={control}
                    name="logoUrl"
                    render={({ field }) => (
                      <LogoPicker name={name} value={field.value} disabled={readOnly} onChange={(v) => field.onChange(v)} />
                    )}
                  />
                </div>
                <Field label="Website" htmlFor={`${idPrefix}-website`} hint="Optional" error={errors.website?.message}>
                  <Input id={`${idPrefix}-website`} placeholder="https://" aria-invalid={!!errors.website} {...register("website")} />
                </Field>
              </>
            )}
          </div>
        </fieldset>,
      )}
      {children({ isSubmitting, isDirty })}
    </form>
  );
}
