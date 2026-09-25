"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthCard, GoogleIcon, OrDivider } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { firstName, wait } from "@/lib/utils";
import { signInWithGoogle, signUp } from "@/services/auth";
import { getState } from "@/store/store";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name"),
  email: z
    .email("Enter a valid work email")
    .refine((email) => !getState().users.some((u) => u.email.toLowerCase() === email.toLowerCase()), {
      message: "An account with this email already exists — sign in instead",
    }),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .regex(/\d/, "Include at least one number"),
});

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", password: "" } });

  async function onSubmit(values: FormValues) {
    await wait(700);
    const user = signUp(values.name, values.email);
    toast.success(`Account created — welcome to FlowDesk, ${firstName(user.name)}!`);
    router.push("/dashboard");
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Get started with FlowDesk today."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="John Doe" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Work email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters, including a number.">
          <PasswordInput id="password" autoComplete="new-password" placeholder="••••••••" aria-invalid={!!errors.password} {...register("password")} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>
      <OrDivider />
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => {
          signInWithGoogle();
          router.push("/dashboard");
        }}
      >
        <GoogleIcon />
        Sign up with Google
      </Button>
    </AuthCard>
  );
}
