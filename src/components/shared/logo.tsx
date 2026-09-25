import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="#5B5CF6" />
      <rect x="5" y="5" width="22" height="22" rx="6" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.5" />
      <path d="M10.5 10.5h11v2.1l-4 4.2v4.7h-3v-4.7l-4-4.2z" fill="#fff" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && <span className="text-lg font-bold tracking-tight text-foreground">FlowDesk</span>}
    </span>
  );
}
