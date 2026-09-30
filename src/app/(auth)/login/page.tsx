"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthCard, GoogleIcon, OrDivider } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { DEMO_CREDENTIALS } from "@/constants";
import { firstName, wait } from "@/lib/utils";
import { signIn, signInWithGoogle } from "@/store/actions/auth";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: FormValues) {
    await wait(600);
    const user = signIn(values.email);
    toast.success(`Welcome back, ${firstName(user.name)}!`);
    router.push("/dashboard");
  }

  async function onGoogle() {
    setGoogleLoading(true);
    await wait(700);
    const user = signInWithGoogle();
    toast.success(`Signed in with Google as ${user.name}`);
    router.push("/dashboard");
  }

  function fillDemo() {
    setValue("email", DEMO_CREDENTIALS.email, { shouldValidate: true });
    setValue("password", DEMO_CREDENTIALS.password, { shouldValidate: true });
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <Button variant="secondary" size="lg" className="w-full" onClick={onGoogle} loading={googleLoading}>
        {!googleLoading && <GoogleIcon />}
        Continue with Google
      </Button>
      <OrDivider />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email address" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-medium">
              Password
            </label>
            <Link href="/forgot-password" className="text-[13px] font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" autoComplete="current-password" placeholder="Password" aria-invalid={!!errors.password} {...register("password")} />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <button
        type="button"
        onClick={fillDemo}
        className="mt-5 flex w-full items-start gap-3 rounded-xl border border-dashed border-primary/30 bg-primary-light/60 p-3 text-left text-xs transition hover:bg-primary-light"
      >
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          <span className="block font-semibold text-primary">Use the demo account</span>
          <span className="text-muted-foreground">
            {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password} — or sign in with any email.
          </span>
        </span>
      </button>
    </AuthCard>
  );
}
