import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildInlinePattern(mentionNames: string[]) {
  const names = [...mentionNames].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const mention = names.length ? `@(?:${names.join("|")})|@\\w+` : "@\\w+";
  return new RegExp(`(\\*\\*[^*]+\\*\\*|~~[^~]+~~|\`[^\`]+\`|_[^_\\s][^_]*_|${mention}|https?:\\/\\/[^\\s)]+)`, "g");
}

function renderInline(text: string, pattern: RegExp): ReactNode[] {
  return text.split(pattern).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith("~~") && part.endsWith("~~")) return <s key={i}>{part.slice(2, -2)}</s>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    if (part.length > 2 && part.startsWith("_") && part.endsWith("_")) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("@")) return <span key={i} className="rounded bg-primary-light px-0.5 font-medium text-primary">{part}</span>;
    if (/^https?:\/\//.test(part))
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
          {part}
        </a>
      );
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * Renders the lightweight markdown used in descriptions and comments:
 * **bold**, _italic_, ~~strike~~, `code`, "- " / "1. " lists, links and @mentions.
 */
export function RichText({
  text,
  mentionNames = [],
  className,
}: {
  text: string;
  mentionNames?: string[];
  className?: string;
}) {
  const pattern = buildInlinePattern(mentionNames);
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const bullet = /^\s*[-*]\s+/;
    const numbered = /^\s*\d+\.\s+/;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? numbered : bullet).test(lines[i])) {
        items.push(lines[i].replace(ordered ? numbered : bullet, ""));
        i++;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={`l${i}`} className={cn("space-y-1 pl-5", ordered ? "list-decimal" : "list-disc")}>
          {items.map((item, j) => (
            <li key={j}>{renderInline(item, pattern)}</li>
          ))}
        </List>,
      );
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    blocks.push(<p key={`p${i}`}>{renderInline(line, pattern)}</p>);
    i++;
  }
  return <div className={cn("space-y-2 break-words text-sm leading-relaxed text-muted-foreground", className)}>{blocks}</div>;
}
