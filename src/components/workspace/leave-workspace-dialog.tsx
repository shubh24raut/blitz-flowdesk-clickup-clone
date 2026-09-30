"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { canLeave, membersOf } from "@/lib/organizations";
import { leaveOrganization } from "@/store/actions/organizations";
import { useRootState } from "@/store/hooks";
import { getMembership, resolveActiveOrganizationId } from "@/store/selectors";
import { getState } from "@/store/store";
import type { Organization } from "@/types";

/** Confirms leaving a workspace. The last Owner sees why they can't, instead of a confirm button. */
export function LeaveWorkspaceDialog({
  organization,
  onOpenChange,
}: {
  organization: Organization | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const state = useRootState();
  const check = organization
    ? canLeave(getMembership(state, organization.id), membersOf(state.organizationMembers, organization.id))
    : { ok: true as const };

  return (
    <ConfirmDialog
      open={organization !== null}
      onOpenChange={onOpenChange}
      title={check.ok ? `Leave ${organization?.name}?` : `You can't leave ${organization?.name} yet`}
      description={
        check.ok
          ? "You'll lose access to its projects, tasks and time off, and be unassigned from its work. Your other workspaces aren't affected."
          : check.reason
      }
      confirmLabel="Leave workspace"
      confirmDisabled={!check.ok}
      onConfirm={() => {
        if (!organization) return;
        const wasActive = resolveActiveOrganizationId(getState()) === organization.id;
        const result = leaveOrganization(organization.id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(`You left ${organization.name}`);
        if (wasActive) router.push(resolveActiveOrganizationId(getState()) ? "/dashboard" : "/onboarding");
      }}
    />
  );
}
