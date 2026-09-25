/* eslint-disable @next/next/no-img-element -- previews are local object/data URLs */
"use client";

import { Download, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent } from "@/components/ui/dialog";
import { formatRelative } from "@/lib/dates";
import { formatBytes } from "@/lib/utils";
import { indexes } from "@/store/selectors";
import { useAppState } from "@/store/hooks";
import type { Attachment } from "@/types";
import { AttachmentIcon } from "./attachment-tile";

function Unavailable({ attachment }: { attachment: Attachment }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted px-6 py-14 text-center">
      <AttachmentIcon kind={attachment.kind} className="scale-125" />
      <p className="mt-2 text-sm font-medium">Preview not available</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        This is sample data or a file added before the last page reload. Files will be stored in the cloud once the
        backend is connected.
      </p>
    </div>
  );
}

export function AttachmentPreviewDialog({
  attachment,
  onOpenChange,
}: {
  attachment: Attachment | null;
  onOpenChange: (open: boolean) => void;
}) {
  const state = useAppState();
  const uploader = attachment ? indexes(state).users.get(attachment.uploadedById) : undefined;

  return (
    <Dialog open={attachment !== null} onOpenChange={onOpenChange}>
      {attachment && (
        <DialogContent
          size="xl"
          title={attachment.name}
          description={`${formatBytes(attachment.size)} · Uploaded by ${uploader?.name ?? "Unknown"} ${formatRelative(attachment.createdAt)}`}
        >
          <DialogBody>
            {attachment.kind === "image" && attachment.url ? (
              <img src={attachment.url} alt={attachment.name} className="mx-auto max-h-[65dvh] rounded-xl object-contain" />
            ) : attachment.kind === "video" && attachment.url ? (
              <video src={attachment.url} controls autoPlay className="mx-auto max-h-[65dvh] w-full rounded-xl bg-black" />
            ) : attachment.kind === "pdf" && attachment.url ? (
              <iframe src={attachment.url} title={attachment.name} className="h-[65dvh] w-full rounded-xl border border-border" />
            ) : attachment.kind === "code" && attachment.textContent ? (
              <pre className="scrollbar-thin max-h-[65dvh] overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200">
                {attachment.textContent}
              </pre>
            ) : attachment.kind === "file" && attachment.url ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted px-6 py-14 text-center">
                <FileWarning className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">This file type can&apos;t be previewed in the browser.</p>
              </div>
            ) : (
              <Unavailable attachment={attachment} />
            )}
            {attachment.url && (
              <div className="mt-4 flex justify-end">
                <Button variant="secondary" asChild>
                  <a href={attachment.url} download={attachment.name}>
                    <Download /> Download
                  </a>
                </Button>
              </div>
            )}
          </DialogBody>
        </DialogContent>
      )}
    </Dialog>
  );
}
