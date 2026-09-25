import Link from "next/link";
import { LogoMark } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-lavender px-4 text-center">
      <div>
        <LogoMark className="mx-auto size-12" />
        <p className="mt-6 text-sm font-semibold text-primary">404</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-white shadow-sm hover:bg-primary-hover"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
