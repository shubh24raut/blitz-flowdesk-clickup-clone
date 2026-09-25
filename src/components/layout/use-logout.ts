"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { signOut } from "@/services/auth";

export function useLogout() {
  const router = useRouter();
  return useCallback(() => {
    signOut();
    toast.success("You have been signed out");
    router.replace("/login");
  }, [router]);
}
