"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera } from "lucide-react";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { UserAvatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { wait } from "@/lib/utils";
import { updateProfile } from "@/store/actions/team";
import { useCurrentUser } from "@/store/hooks";
import { getState } from "@/store/store";

/** Downscales an image to a small square data URL so it fits comfortably in local storage. */
function resizeImage(file: File, size = 192): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      const side = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Not an image"));
    };
    img.src = url;
  });
}

export function ProfileSettings() {
  const me = useCurrentUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const schema = z.object({
    name: z.string().trim().min(2, "Name is required"),
    email: z
      .email("Enter a valid email")
      .refine((e) => !getState().users.some((u) => u.id !== me.id && u.email.toLowerCase() === e.toLowerCase()), "Another member uses this email"),
    title: z.string().trim().max(60),
  });
  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: me.name, email: me.email, title: me.title } });

  async function onSubmit(values: FormValues) {
    await wait(400);
    updateProfile(values);
    reset(values);
    toast.success("Profile updated");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative">
          <UserAvatar user={me} size="xl" className="size-20 text-2xl" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-card bg-primary text-white shadow"
          >
            <Camera className="size-4" />
          </button>
        </div>
        <div>
          <p className="text-lg font-semibold">{me.name}</p>
          <p className="text-sm text-muted-foreground">{me.email}</p>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" size="sm" className="border-primary/30 text-primary" onClick={() => fileRef.current?.click()}>
              Change photo
            </Button>
            {me.avatarUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateProfile({ avatarUrl: undefined });
                  toast.success("Photo removed");
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              updateProfile({ avatarUrl: await resizeImage(file) });
              toast.success("Profile photo updated");
            } catch {
              toast.error("That file doesn't look like an image");
            }
          }}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-2xl gap-4 sm:grid-cols-2" noValidate>
        <Field label="Full name" htmlFor="profile-name" error={errors.name?.message}>
          <Input id="profile-name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Job title" htmlFor="profile-title" error={errors.title?.message}>
          <Input id="profile-title" {...register("title")} />
        </Field>
        <Field label="Email" htmlFor="profile-email" error={errors.email?.message} className="sm:col-span-2">
          <Input id="profile-email" type="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
          {isDirty && (
            <Button type="button" variant="ghost" onClick={() => reset()}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
