"use client";

import { ArrowRight, Menu, Play, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { DEMO_CREDENTIALS } from "@/constants";
import { cn } from "@/lib/utils";
import { signIn } from "@/store/actions/auth";
import { useHydrated, useRootState } from "@/store/hooks";

/** Signed-in state is only known in the browser; the server renders the signed-out variant. */
function useSignedIn(): boolean {
  const hydrated = useHydrated();
  const session = useRootState().session;
  return hydrated && session !== null;
}

function useStartDemo() {
  const router = useRouter();
  return () => {
    const user = signIn(DEMO_CREDENTIALS.email);
    toast.success(`Signed in to the demo as ${user.name}`);
    router.push("/dashboard");
  };
}

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#workspaces", label: "Workspaces" },
  { href: "#how-it-works", label: "How it works" },
];

export function LandingHeader() {
  const signedIn = useSignedIn();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="FlowDesk home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Button asChild>
              <Link href="/dashboard">
                Open FlowDesk <ArrowRight />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="landing-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>
      <div id="landing-menu" className={cn("border-t border-border bg-background px-4 pb-4 pt-2 md:hidden", !open && "hidden")}>
        <nav aria-label="Mobile" className="flex flex-col">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-2 grid gap-2">
          {signedIn ? (
            <Button asChild>
              <Link href="/dashboard">Open FlowDesk</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="secondary">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Primary calls to action: sign up and the one-click demo, or "Open FlowDesk" once signed in. */
export function CtaButtons({ className, align = "start" }: { className?: string; align?: "start" | "center" }) {
  const signedIn = useSignedIn();
  const startDemo = useStartDemo();
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", align === "center" && "sm:justify-center", className)}>
      {signedIn ? (
        <Button asChild size="lg">
          <Link href="/dashboard">
            Open FlowDesk <ArrowRight />
          </Link>
        </Button>
      ) : (
        <>
          <Button asChild size="lg">
            <Link href="/signup">
              Get started free <ArrowRight />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" onClick={startDemo}>
            <Play /> Try the live demo
          </Button>
        </>
      )}
    </div>
  );
}
