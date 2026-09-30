"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoMark } from "@/components/shared/logo";
import { useHydrated, useRootState } from "@/store/hooks";

export default function IndexPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const session = useRootState().session;

  useEffect(() => {
    if (hydrated) router.replace(session ? "/dashboard" : "/login");
  }, [hydrated, session, router]);

  return (
    <div className="grid min-h-dvh place-items-center">
      <LogoMark className="size-10 animate-pulse" />
    </div>
  );
}
