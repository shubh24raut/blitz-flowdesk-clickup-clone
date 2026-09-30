"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { ID } from "@/types";

/** The open leave request lives in `?leave=<id>` so it can be linked to (e.g. from notifications). */
export function useLeaveLink() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const go = useCallback(
    (id: ID | null) => {
      const next = new URLSearchParams(params);
      if (id) next.set("leave", id);
      else next.delete("leave");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return {
    leaveId: params.get("leave"),
    openLeave: useCallback((id: ID) => go(id), [go]),
    closeLeave: useCallback(() => go(null), [go]),
  };
}
