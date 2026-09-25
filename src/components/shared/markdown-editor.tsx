"use client";

import { Bold, Code, Italic, Link2, List, ListOrdered, Strikethrough, type LucideIcon } from "lucide-react";
import { useRef } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Action = { label: string; icon: LucideIcon; wrap?: [string, string]; prefix?: string };

const ACTIONS: Action[] = [
  { label: "Bold", icon: Bold, wrap: ["**", "**"] },
  { label: "Italic", icon: Italic, wrap: ["_", "_"] },
  { label: "Strikethrough", icon: Strikethrough, wrap: ["~~", "~~"] },
  { label: "Inline code", icon: Code, wrap: ["`", "`"] },
  { label: "Bulleted list", icon: List, prefix: "- " },
  { label: "Numbered list", icon: ListOrdered, prefix: "1. " },
  { label: "Link", icon: Link2, wrap: ["", " https://"] },
];

/**
 * Textarea with a formatting toolbar. Stores lightweight markdown that
 * `RichText` renders — a stand-in until a real rich-text editor is chosen.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 6,
  autoFocus,
  id,
  className,
  onKeyDown,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  id?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function apply(action: Action) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end);
    let next: string;
    let cursorStart: number;
    let cursorEnd: number;
    if (action.prefix) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const block = value.slice(lineStart, end) || "";
      const lines = (block || "").split("\n");
      const prefixed = lines
        .map((line, i) => (action.prefix === "1. " ? `${i + 1}. ` : action.prefix) + line)
        .join("\n");
      next = value.slice(0, lineStart) + prefixed + value.slice(end);
      cursorStart = cursorEnd = lineStart + prefixed.length;
    } else {
      const [before, after] = action.wrap!;
      const text = selected || action.label.toLowerCase();
      next = value.slice(0, start) + before + text + after + value.slice(end);
      cursorStart = start + before.length;
      cursorEnd = cursorStart + text.length;
    }
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        apply(ACTIONS[0]);
        return;
      }
      if (key === "i") {
        e.preventDefault();
        apply(ACTIONS[1]);
        return;
      }
    }
    onKeyDown?.(e);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-input bg-card shadow-card transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15",
        className,
      )}
    >
      <div role="toolbar" aria-label="Formatting" className="flex items-center gap-0.5 border-b border-border px-2 py-1.5">
        {ACTIONS.map((action, i) => (
          <span key={action.label} className="flex items-center">
            {(i === 4 || i === 6) && <span className="mx-1 h-4 w-px bg-border" />}
            <Tooltip content={action.label}>
              <button
                type="button"
                onClick={() => apply(action)}
                aria-label={action.label}
                className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <action.icon className="size-4" />
              </button>
            </Tooltip>
          </span>
        ))}
      </div>
      <textarea
        ref={ref}
        id={id}
        value={value}
        rows={rows}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="block w-full resize-y bg-transparent px-3.5 py-3 text-sm leading-relaxed outline-none placeholder:text-subtle"
      />
    </div>
  );
}
