import type { ReactNode } from "react";

/**
 * The lavender backdrop used by the auth pages. Pages reached from email links
 * (reset password, accept invitation) live outside the `(auth)` group — whose layout
 * sends signed-in users to the dashboard — and use this shell directly.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-lavender px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 size-112 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-32 size-120 rounded-full bg-fuchsia-400/10 blur-3xl" />
      <div className="relative w-full max-w-[420px]">{children}</div>
    </main>
  );
}
