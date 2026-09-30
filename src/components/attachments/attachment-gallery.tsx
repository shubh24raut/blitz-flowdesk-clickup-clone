"use client";

import { Paperclip } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { removeAttachment } from "@/store/actions/attachments";
import type { Attachment, AttachmentKind } from "@/types";
import { AttachmentPreviewDialog } from "./attachment-preview-dialog";
import { AttachmentTile } from "./attachment-tile";
import { FileDropzone, MAX_FILE_SIZE, acceptFiles } from "./file-dropzone";

const FILTERS: Array<{ id: "all" | AttachmentKind; label: string }> = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "pdf", label: "PDFs" },
  { id: "code", label: "Code" },
  { id: "file", label: "Other" },
];

/** Upload + filter + grid + preview for a set of attachments. */
export function AttachmentGallery({
  attachments,
  onUpload,
  subtitleFor,
  columns = "grid-cols-2 sm:grid-cols-3",
  showFilters = true,
}: {
  attachments: Attachment[];
  onUpload: (files: File[]) => Promise<void>;
  subtitleFor?: (attachment: Attachment) => string | undefined;
  columns?: string;
  showFilters?: boolean;
}) {
  const [filter, setFilter] = useState<"all" | AttachmentKind>("all");
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const visible = filter === "all" ? attachments : attachments.filter((a) => a.kind === filter);

  async function handleFiles(files: File[]) {
    const { accepted, rejected } = acceptFiles(files);
    if (rejected) toast.error(`${rejected} file(s) exceed the ${MAX_FILE_SIZE / 1024 / 1024} MB limit`);
    if (!accepted.length) return;
    setUploading(true);
    try {
      await onUpload(accepted);
      toast.success(accepted.length === 1 ? `“${accepted[0].name}” uploaded` : `${accepted.length} files uploaded`);
    } catch {
      toast.error("Could not read the selected file");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone onFiles={handleFiles} compact className={cn(uploading && "pointer-events-none animate-shimmer")} />
      {showFilters && attachments.length > 0 && (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => {
            const count = f.id === "all" ? attachments.length : attachments.filter((a) => a.kind === f.id).length;
            if (f.id !== "all" && count === 0) return null;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
                  filter === f.id ? "border-primary bg-primary-light text-primary" : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {f.label} · {count}
              </button>
            );
          })}
        </div>
      )}
      {visible.length === 0 ? (
        <EmptyState compact icon={Paperclip} title="No files yet" description="Upload screenshots, videos, PDFs or code files." />
      ) : (
        <div className={cn("grid gap-3", columns)}>
          {visible.map((a) => (
            <AttachmentTile
              key={a.id}
              attachment={a}
              subtitle={subtitleFor?.(a)}
              onPreview={() => setPreview(a)}
              onRemove={() => {
                removeAttachment(a.id);
                toast.success(`Removed “${a.name}”`);
              }}
            />
          ))}
        </div>
      )}
      <AttachmentPreviewDialog attachment={preview} onOpenChange={(open) => !open && setPreview(null)} />
    </div>
  );
}
