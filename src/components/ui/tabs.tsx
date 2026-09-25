"use client";

import { Tabs as Primitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Tabs = Primitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof Primitive.List>) {
  return (
    <Primitive.List
      className={cn("no-scrollbar flex items-center gap-1 overflow-x-auto border-b border-border", className)}
      {...props}
    />
  );
}

export const tabTriggerClass =
  "relative -mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 pb-2.5 pt-1 text-sm font-medium text-muted-foreground transition hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary";

export function TabsTrigger({ className, ...props }: ComponentProps<typeof Primitive.Trigger>) {
  return <Primitive.Trigger className={cn(tabTriggerClass, className)} {...props} />;
}

export function TabsContent({ className, ...props }: ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Content className={cn("outline-none", className)} {...props} />;
}

export function TabCount({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-1.5 py-px text-[11px] font-semibold text-muted-foreground">{children}</span>
  );
}
