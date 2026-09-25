"use client";

import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppState, useHydrated } from "@/store/hooks";

/** Keeps the `dark` class on <html> in sync with the saved appearance setting. */
function ThemeSync() {
  const theme = useAppState().settings.theme;
  const hydrated = useHydrated();
  useEffect(() => {
    // The pre-paint script already set the class; wait for the real client state.
    if (!hydrated) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, hydrated]);
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      <ThemeSync />
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "!rounded-xl !border-border !bg-popover !text-foreground !shadow-overlay",
            description: "!text-muted-foreground",
          },
        }}
      />
    </TooltipProvider>
  );
}
