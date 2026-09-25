"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAppState, useHydrated } from "@/store/hooks";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const session = useAppState().session;

  useEffect(() => {
    if (hydrated && session) router.replace("/dashboard");
  }, [hydrated, session, router]);

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-lavender px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 size-[28rem] rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-32 size-[30rem] rounded-full bg-fuchsia-400/10 blur-3xl" />
      <div className="relative w-full max-w-[420px]">{children}</div>
    </main>
  );
}
