"use client";

import { Popover as Primitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;
export const PopoverAnchor = Primitive.Anchor;
export const PopoverClose = Primitive.Close;

export function PopoverContent({
  className,
  sideOffset = 6,
  align = "start",
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 max-w-[calc(100vw-1rem)] rounded-xl border border-border bg-popover p-2 text-sm shadow-overlay outline-none data-[state=open]:animate-fade-in",
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}
