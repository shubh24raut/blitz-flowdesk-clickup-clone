"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { firstName } from "@/lib/utils";
import { startLocalSession } from "@/store/actions/auth";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  /** Better Auth checks the password and sets the session cookie; the local store then mirrors the user. */
  async function onSubmit(values: FormValues) {
    const { data, error } = await authClient.signIn.email({ email: values.email, password: values.password });
    if (error) {
      if (error.status === 429) toast.error("Too many attempts — please wait a minute and try again.");
      else setError("password", { message: "Incorrect email or password." });
      return;
    }
    const user = startLocalSession(data.user);
    toast.success(`Welcome back, ${firstName(user.name)}!`);
    router.push("/dashboard");
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
    </AuthCard>
  );
}
