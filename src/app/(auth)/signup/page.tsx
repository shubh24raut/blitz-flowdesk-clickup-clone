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
import { authClient } from "@/lib/auth-client";
import { firstName } from "@/lib/utils";
import { signInAccount, signInWithGoogle } from "@/store/actions/auth";
import { demoEmails } from "@/store/seed";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name"),
  email: z
    .email("Enter a valid work email")
    .refine((email) => !demoEmails().includes(email.trim().toLowerCase()), { message: "This address belongs to a demo account — use your own email" }),
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
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", password: "" } });

  /**
   * Creates a real account (Better Auth). The app itself still runs on mock data:
   * the new account starts with no workspaces and goes to onboarding.
   */
  async function onSubmit(values: FormValues) {
    const { data, error } = await authClient.signUp.email({ name: values.name.trim(), email: values.email, password: values.password });
    if (error) {
      if (error.code === "USER_ALREADY_EXISTS" || error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        setError("email", { message: "An account with this email already exists — sign in instead" });
      } else {
        toast.error(error.message ?? "Couldn't create your account. Try again.");
      }
      return;
    }
    const user = signInAccount({ email: data.user.email, name: data.user.name });
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
