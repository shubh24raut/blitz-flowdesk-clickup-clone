"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { signOut } from "@/store/actions/auth";

export function useLogout() {
  const router = useRouter();
  return useCallback(() => {
    signOut();
    // Also end the real (Better Auth) session, if there is one.
    void authClient.signOut().catch(() => {});
    toast.success("You have been signed out");
    router.replace("/login");
  }, [router]);
}
