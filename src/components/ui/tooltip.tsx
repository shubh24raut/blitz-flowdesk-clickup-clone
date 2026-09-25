"use client";

import { Tooltip as Primitive } from "radix-ui";
import type { ReactNode } from "react";

export const TooltipProvider = Primitive.Provider;

export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{children}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          side={side}
          sideOffset={6}
          className="z-[60] rounded-md bg-navy px-2 py-1 text-xs font-medium text-background shadow-raised data-[state=delayed-open]:animate-fade-in"
        >
          {content}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
