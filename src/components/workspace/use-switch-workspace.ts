"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { switchOrganization } from "@/store/actions/organizations";
import { safePathForWorkspace } from "@/store/selectors";
import { getState } from "@/store/store";
import type { ID } from "@/types";

/**
 * Switches the active workspace in place (no reload). If the current screen shows
 * an entity from the previous workspace, moves to a safe list page instead.
 */
export function useSwitchWorkspace() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (organizationId: ID, options: { to?: string; silent?: boolean } = {}) => {
      const previous = getState().activeOrganizationId;
      const result = switchOrganization(organizationId);
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      const target = options.to ?? safePathForWorkspace(getState(), pathname);
      if (target !== pathname) router.push(target);
      if (!options.silent && previous !== organizationId) toast.success(`Switched to ${result.value.name}`);
      return true;
    },
    [router, pathname],
  );
}
