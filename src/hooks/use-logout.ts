"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { endLocalSession } from "@/store/actions/auth";

export function useLogout() {
  const router = useRouter();
  return useCallback(async () => {
    // End the real (Better Auth) session, then the local mirror of it.
    await authClient.signOut().catch(() => {});
    endLocalSession();
    toast.success("You have been signed out");
    router.replace("/login");
  }, [router]);
}
