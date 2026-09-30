"use client";

import { Check } from "lucide-react";
import { COLOR_OPTIONS } from "@/constants";
import { cn } from "@/lib/utils";

export function ColorPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label="Color" className={cn("flex flex-wrap gap-2", className)}>
      {COLOR_OPTIONS.map((color) => {
        const selected = color.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color}
            onClick={() => onChange(color)}
            className={cn(
              "grid size-7 place-items-center rounded-full transition hover:scale-110",
              selected && "ring-2 ring-offset-2 ring-offset-popover",
            )}
            style={{ backgroundColor: color, ["--tw-ring-color" as string]: color }}
          >
            {selected && <Check className="size-3.5 text-white" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}
