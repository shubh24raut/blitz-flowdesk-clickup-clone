"use client";

import { ImageUp, X } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OrganizationAvatar } from "./organization-avatar";

const LOGO_SIZE = 128;
const MAX_UPLOAD = 5 * 1024 * 1024;

/** Downscales the image to a small square PNG so it fits comfortably in local storage. */
async function toLogoDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = LOGO_SIZE;
  canvas.height = LOGO_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  // Cover-crop to a centered square.
  const side = Math.min(bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, LOGO_SIZE, LOGO_SIZE);
  bitmap.close();
  return canvas.toDataURL("image/png");
}

export function LogoPicker({
  name,
  value,
  onChange,
  disabled,
}: {
  /** Workspace name, used for the initials preview. */
  name: string;
  value: string | undefined;
  onChange: (logoUrl: string | undefined) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    if (file.size > MAX_UPLOAD) {
      toast.error("That image is over 5 MB");
      return;
    }
    try {
      onChange(await toLogoDataUrl(file));
    } catch {
      toast.error("Couldn't read that image");
    }
  }

  return (
    <div className="flex items-center gap-4">
      <OrganizationAvatar organization={{ name: name || "?", logoUrl: value }} size="xl" />
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => input.current?.click()}>
            <ImageUp /> {value ? "Change logo" : "Upload logo"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onChange(undefined)}>
              <X /> Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Square images work best. Without one, initials are shown.</p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload workspace logo"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
