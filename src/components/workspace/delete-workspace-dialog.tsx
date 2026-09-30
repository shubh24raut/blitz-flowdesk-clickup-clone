"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/input";
import { deleteOrganization } from "@/store/actions/organizations";
import { resolveActiveOrganizationId } from "@/store/selectors";
import { getState } from "@/store/store";
import type { Organization } from "@/types";

/** Owners type the workspace name to confirm, since everything in it is removed. */
export function DeleteWorkspaceDialog({
  organization,
  onOpenChange,
}: {
  organization: Organization | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [typed, setTyped] = useState("");

  return (
    <ConfirmDialog
      open={organization !== null}
      onOpenChange={(open) => {
        if (!open) setTyped("");
        onOpenChange(open);
      }}
      title={`Delete ${organization?.name}?`}
      description="All of its clients, projects, tasks, files and time-off records are permanently removed for every member. This cannot be undone."
      confirmLabel="Delete workspace"
      confirmDisabled={typed.trim() !== organization?.name}
      onConfirm={() => {
        if (!organization) return;
        const wasActive = resolveActiveOrganizationId(getState()) === organization.id;
        const result = deleteOrganization(organization.id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setTyped("");
        toast.success(`${organization.name} deleted`);
        if (wasActive) router.push(resolveActiveOrganizationId(getState()) ? "/dashboard" : "/onboarding");
      }}
    >
      <Field label={`Type “${organization?.name ?? ""}” to confirm`} htmlFor="delete-workspace-name">
        <Input id="delete-workspace-name" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      </Field>
    </ConfirmDialog>
  );
}
