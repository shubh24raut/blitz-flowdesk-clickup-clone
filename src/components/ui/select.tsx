"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as Primitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: ReactNode;
  /** Plain-text label used by type-ahead when `label` is not a string. */
  textValue?: string;
}

/** Radix reserves "" for "no selection", so empty values are mapped to a sentinel. */
const EMPTY = "__empty__";
const toRadix = (v: string) => (v === "" ? EMPTY : v);
const fromRadix = (v: string) => (v === EMPTY ? "" : v);

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  id,
  className,
  size = "md",
  disabled,
  invalid,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  className?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  invalid?: boolean;
  "aria-label"?: string;
}) {
  return (
    <Primitive.Root value={toRadix(value)} onValueChange={(v) => onValueChange(fromRadix(v))} disabled={disabled}>
      <Primitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn(
          "group inline-flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm text-foreground shadow-card outline-none transition",
          "hover:border-slate-300 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 dark:hover:border-slate-500",
          "data-[state=open]:border-primary data-[state=open]:ring-3 data-[state=open]:ring-primary/15 data-[placeholder]:text-subtle",
          "disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-400",
          size === "sm" ? "h-9" : "h-10",
          className,
        )}
      >
        <span className="truncate">
          <Primitive.Value placeholder={placeholder} />
        </span>
        <Primitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Primitive.Icon>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          position="popper"
          sideOffset={6}
          className="z-[60] max-h-[min(320px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-popover text-sm text-foreground shadow-overlay data-[state=open]:animate-pop-in"
        >
          <Primitive.Viewport className="scrollbar-thin p-1">
            {options.map((o) => (
              <Primitive.Item
                key={o.value}
                value={toRadix(o.value)}
                textValue={o.textValue ?? (typeof o.label === "string" ? o.label : undefined)}
                className="relative flex cursor-pointer select-none items-center gap-2 rounded-lg py-2 pl-2.5 pr-8 outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-muted data-[state=checked]:font-medium data-[state=checked]:text-primary"
              >
                <Primitive.ItemText>{o.label}</Primitive.ItemText>
                <Primitive.ItemIndicator className="absolute right-2.5 flex">
                  <Check className="size-4 text-primary" />
                </Primitive.ItemIndicator>
              </Primitive.Item>
            ))}
          </Primitive.Viewport>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
