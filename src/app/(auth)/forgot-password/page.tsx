"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { wait } from "@/lib/utils";

const schema = z.object({ email: z.email("Enter a valid email address") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(values: FormValues) {
    await wait(800);
    setSentTo(values.email);
  }

  const back = (
    <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
      <ArrowLeft className="size-4" /> Back to sign in
    </Link>
  );

  if (sentTo) {
    return (
      <AuthCard title="Check your inbox" subtitle="We sent you a password reset link." footer={back}>
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-emerald-50 p-5 text-center dark:bg-emerald-500/10">
          <MailCheck className="size-8 text-emerald-600" />
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, you&apos;ll receive
            an email with instructions shortly. <br />
            <span className="text-xs">(Demo mode — no email is actually sent.)</span>
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password" subtitle="Enter your email and we'll send you a reset link." footer={back}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email address" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" placeholder="you@company.com" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
