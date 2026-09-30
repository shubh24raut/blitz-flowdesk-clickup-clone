"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { tagTone } from "@/constants";
import { cn } from "@/lib/utils";

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add tags…",
  className,
  id,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const matches = suggestions
    .filter((s) => !value.includes(s) && s.toLowerCase().includes(draft.toLowerCase()))
    .slice(0, 6);

  function add(raw: string) {
    const tag = raw.trim().replace(/,$/, "");
    if (!tag) return;
    const normalized = tag[0].toUpperCase() + tag.slice(1);
    if (!value.some((v) => v.toLowerCase() === normalized.toLowerCase())) onChange([...value, normalized]);
    setDraft("");
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2 py-1.5 shadow-card transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
        {value.map((tag) => (
          <span key={tag} className={cn("inline-flex h-6 items-center gap-1 rounded-full pl-2.5 pr-1 text-xs font-medium", tagTone(tag))}>
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="rounded-full p-0.5 hover:bg-black/5"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 120);
            add(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder={value.length ? "" : placeholder}
          aria-label="Add tag"
          className="h-6 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-subtle"
        />
      </div>
      {focused && matches.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 rounded-xl border border-border bg-popover p-1 shadow-overlay">
          {matches.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(s)}
                className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", tagTone(s))}>{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
