/* eslint-disable @next/next/no-img-element -- previews are local object/data URLs */
"use client";

import { Download, EllipsisVertical, Eye, FileArchive, FileCode, FileText, Play, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatBytes } from "@/lib/utils";
import type { Attachment, AttachmentKind } from "@/types";

export function AttachmentIcon({ kind, className }: { kind: AttachmentKind; className?: string }) {
  if (kind === "pdf")
    return (
      <span className={cn("grid h-10 w-9 place-items-center rounded-md bg-red-500 text-[10px] font-bold text-white shadow-sm", className)}>
        PDF
      </span>
    );
  if (kind === "code") return <FileCode className={cn("size-9 text-primary", className)} strokeWidth={1.5} />;
  if (kind === "video")
    return (
      <span className={cn("grid size-10 place-items-center rounded-full bg-slate-900/80 text-white", className)}>
        <Play className="size-4 fill-current" />
      </span>
    );
  if (kind === "file") return <FileArchive className={cn("size-9 text-muted-foreground", className)} strokeWidth={1.5} />;
  return <FileText className={cn("size-9 text-muted-foreground", className)} strokeWidth={1.5} />;
}

export function AttachmentThumb({ attachment, className }: { attachment: Attachment; className?: string }) {
  return (
    <div className={cn("relative grid place-items-center overflow-hidden bg-muted", className)}>
      {attachment.kind === "image" && attachment.url ? (
        <img src={attachment.url} alt={attachment.name} className="size-full object-cover" loading="lazy" />
      ) : attachment.kind === "video" && attachment.url ? (
        <>
          <video src={attachment.url} className="size-full object-cover" muted preload="metadata" />
          <span className="absolute grid size-9 place-items-center rounded-full bg-slate-900/70 text-white">
            <Play className="size-4 fill-current" />
          </span>
        </>
      ) : attachment.kind === "code" && attachment.textContent ? (
        <pre className="size-full overflow-hidden p-2 text-left font-mono text-[8px] leading-tight text-muted-foreground">
          {attachment.textContent.slice(0, 400)}
        </pre>
      ) : (
        <AttachmentIcon kind={attachment.kind} />
      )}
    </div>
  );
}

export function AttachmentTile({
  attachment,
  onPreview,
  onRemove,
  subtitle,
}: {
  attachment: Attachment;
  onPreview: () => void;
  onRemove?: () => void;
  subtitle?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:shadow-raised">
      <button type="button" onClick={onPreview} className="block w-full" aria-label={`Preview ${attachment.name}`}>
        <AttachmentThumb attachment={attachment} className="aspect-[4/3] w-full" />
      </button>
      <div className="flex items-start gap-1 p-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium" title={attachment.name}>
            {attachment.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{subtitle ?? formatBytes(attachment.size)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${attachment.name}`}
              className="-mr-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <EllipsisVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            <DropdownMenuItem onSelect={onPreview}>
              <Eye /> Preview
            </DropdownMenuItem>
            {attachment.url && (
              <DropdownMenuItem asChild>
                <a href={attachment.url} download={attachment.name}>
                  <Download /> Download
                </a>
              </DropdownMenuItem>
            )}
            {onRemove && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={onRemove}>
                  <Trash2 /> Remove
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/** Compact row used for files attached to comments. */
export function AttachmentChip({ attachment, onPreview }: { attachment: Attachment; onPreview: () => void }) {
  return (
    <button
      type="button"
      onClick={onPreview}
      className="flex w-full max-w-xs items-center gap-3 rounded-xl border border-border bg-card p-2 pr-3 text-left shadow-card transition hover:bg-muted"
    >
      <AttachmentThumb attachment={attachment} className="size-11 shrink-0 rounded-lg [&_svg]:size-5 [&>span]:h-7 [&>span]:w-6 [&>span]:text-[8px]" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{attachment.name}</span>
        <span className="block text-xs text-muted-foreground">{formatBytes(attachment.size)}</span>
      </span>
      <Download className="size-4 text-muted-foreground" />
    </button>
  );
}
