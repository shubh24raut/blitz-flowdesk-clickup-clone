"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CircleCheck, CircleX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
type FormValues = z.infer<typeof schema>;

const backToSignIn = (
  <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
    <ArrowLeft className="size-4" /> Back to sign in
  </Link>
);

function InvalidLink() {
  return (
    <AuthCard title="This link has expired" subtitle="Reset links work once and expire after 1 hour." footer={backToSignIn}>
      <div className="flex flex-col items-center gap-4 text-center">
        <CircleX className="size-10 text-red-500" />
        <Button asChild className="w-full" size="lg">
          <Link href="/forgot-password">Send a new link</Link>
        </Button>
      </div>
    </AuthCard>
  );
}

/**
 * Landing page for the emailed reset link. Better Auth validates the token at
 * /api/auth/reset-password/:token and redirects here with `?token=` or `?error=INVALID_TOKEN`.
 */
function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [done, setDone] = useState(false);
  const [expired, setExpired] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });

  if (!token || params.get("error") || expired) return <InvalidLink />;

  if (done) {
    return (
      <AuthCard title="Password updated" subtitle="You've been signed out everywhere else for safety." footer={backToSignIn}>
        <div className="flex flex-col items-center gap-4">
          <CircleCheck className="size-10 text-emerald-500" />
          <Button asChild className="w-full" size="lg">
            <Link href="/login">Sign in with your new password</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  async function onSubmit(values: FormValues) {
    const { error } = await authClient.resetPassword({ newPassword: values.password, token: token! });
    if (!error) setDone(true);
    else if (error.code === "INVALID_TOKEN") setExpired(true);
    else setError("password", { message: error.message ?? "Couldn't update the password. Try again." });
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Use at least 8 characters." footer={backToSignIn}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="New password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" autoFocus aria-invalid={!!errors.password} {...register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
          <PasswordInput id="confirm" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register("confirm")} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-3xl bg-card" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
