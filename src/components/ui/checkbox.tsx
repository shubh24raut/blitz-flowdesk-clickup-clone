"use client";

import { Check } from "lucide-react";
import { Checkbox as Primitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={cn(
        "grid size-4.5 shrink-0 place-items-center rounded-[5px] border-[1.5px] border-slate-300 bg-card transition-colors hover:border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary dark:border-slate-600",
        className,
      )}
      {...props}
    >
      <Primitive.Indicator>
        <Check className="size-3.5 text-white" strokeWidth={3} />
      </Primitive.Indicator>
    </Primitive.Root>
  );
}

/** Round "complete task" toggle used in task lists. */
export function RoundCheck({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onCheckedChange(!checked);
      }}
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition",
        checked
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-600",
      )}
    >
      <Check className="size-3" strokeWidth={3} />
    </button>
  );
}
