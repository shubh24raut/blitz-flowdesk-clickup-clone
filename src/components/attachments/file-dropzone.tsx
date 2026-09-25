"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Filters out files over the demo size limit and reports how many were skipped. */
export function acceptFiles(files: FileList | File[] | null): { accepted: File[]; rejected: number } {
  const list = Array.from(files ?? []);
  const accepted = list.filter((f) => f.size <= MAX_FILE_SIZE);
  return { accepted, rejected: list.length - accepted.length };
}

export function FileDropzone({
  onFiles,
  className,
  compact,
  accept,
}: {
  onFiles: (files: File[]) => void;
  className?: string;
  compact?: boolean;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) onFiles(Array.from(e.dataTransfer.files));
      }}
      className={cn(
        "rounded-2xl border-2 border-dashed border-border text-center transition-colors",
        over ? "border-primary bg-primary-light" : "hover:border-primary/40 hover:bg-lavender",
        compact ? "px-4 py-4" : "px-6 py-8",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn("mx-auto flex items-center text-sm", compact ? "gap-2" : "flex-col gap-2")}
      >
        <span className={cn("grid place-items-center rounded-xl bg-primary-light text-primary", compact ? "size-8" : "size-11")}>
          <UploadCloud className={compact ? "size-4" : "size-5"} />
        </span>
        <span>
          <span className="font-semibold text-primary">Click to upload</span>{" "}
          <span className="text-muted-foreground">or drag and drop</span>
          {!compact && <span className="mt-1 block text-xs text-subtle">Images, videos, PDFs, code and documents — up to 50 MB</span>}
        </span>
      </button>
    </div>
  );
}
