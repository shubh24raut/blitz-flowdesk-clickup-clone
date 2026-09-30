"use client";

import { Ellipsis, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUI } from "@/components/providers/ui-provider";
import { Dialog, DialogBody, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav-items";
import { useLogout } from "@/hooks/use-logout";

const PRIMARY = ["/dashboard", "/projects", "/tasks", "/calendar"];
const LABELS: Record<string, string> = { "/dashboard": "Home" };

/** Bottom tab bar for phones: Home, Projects, Tasks, Calendar, More. */
export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const logout = useLogout();
  const { openCreateTask } = useUI();
  const primary = NAV_ITEMS.filter((i) => PRIMARY.includes(i.href));
  const secondary = NAV_ITEMS.filter((i) => !PRIMARY.includes(i.href));
  const moreActive = secondary.some((i) => isActive(pathname, i.href));

  const tabClass = (active: boolean) =>
    cn(
      "flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
      active ? "text-primary" : "text-muted-foreground",
    );

  return (
    <>
      <nav
        aria-label="Primary"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md md:hidden"
      >
        <ul className="flex items-stretch px-1">
          {primary.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="flex flex-1">
                <Link href={item.href} aria-current={active ? "page" : undefined} className={tabClass(active)}>
                  <span className={cn("grid h-7 w-12 place-items-center rounded-full transition", active && "bg-primary-light")}>
                    <item.icon className="size-5" />
                  </span>
                  {LABELS[item.href] ?? item.label}
                </Link>
              </li>
            );
          })}
          <li className="flex flex-1">
            <button type="button" onClick={() => setMoreOpen(true)} className={tabClass(moreActive)}>
              <span className={cn("grid h-7 w-12 place-items-center rounded-full", moreActive && "bg-primary-light")}>
                <Ellipsis className="size-5" />
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>

      <button
        type="button"
        onClick={() => openCreateTask({ projectId: pathname.match(/^\/projects\/([^/]+)/)?.[1] })}
        aria-label="New task"
        className="fixed bottom-20 right-4 z-40 grid size-14 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 transition active:scale-95 md:hidden"
      >
        <Plus className="size-6" />
      </button>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent title="More" size="sm">
          <DialogBody className="pb-8">
            <ul className="grid grid-cols-2 gap-2">
              {secondary.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-border p-3.5 text-sm font-medium",
                      isActive(pathname, item.href) ? "border-primary/30 bg-primary-light text-primary" : "bg-card",
                    )}
                  >
                    <item.icon className="size-5" />
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-border p-3.5 text-sm font-medium text-red-600"
                >
                  <LogOut className="size-5" /> Log out
                </button>
              </li>
            </ul>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
