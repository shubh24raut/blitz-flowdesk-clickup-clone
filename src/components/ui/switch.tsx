"use client";

import { Switch as Primitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={cn(
        "inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent bg-slate-200 transition-colors data-[state=checked]:bg-primary disabled:opacity-50 dark:bg-slate-700",
        className,
      )}
      {...props}
    >
      <Primitive.Thumb className="block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5" />
    </Primitive.Root>
  );
}
