import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-card outline-none transition placeholder:text-subtle focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-400 aria-invalid:ring-red-500/10";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClass, "h-auto min-h-24 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-[13px] font-medium text-foreground", className)} {...props} />;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-red-500">
      {message}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      {error ? <FieldError message={error} /> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
