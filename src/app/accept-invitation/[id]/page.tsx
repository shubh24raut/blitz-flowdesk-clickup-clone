"use client";

import { Building2, CircleCheck, CircleX, LogOut } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { roleFromDb } from "@/lib/organizations";
import { cn } from "@/lib/utils";

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string | Date | null;
  organizationName: string;
  inviterEmail: string;
}

/** Real (Better Auth) sign-in / sign-up, so an invitee can accept straight from the email link. */
function InlineAuth({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } =
      mode === "signup"
        ? await authClient.signUp.email({ name: name.trim() || email.split("@")[0], email, password })
        : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (error) setError(error.message ?? "Something went wrong. Try again.");
    else onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div role="tablist" aria-label="Account" className="grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-medium">
        {(["signup", "signin"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn("rounded-lg py-2 transition", mode === m ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}
          >
            {m === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>
      {mode === "signup" && (
        <Field label="Full name" htmlFor="invite-name">
          <Input id="invite-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      )}
      <Field label="Email address" htmlFor="invite-email" hint="Use the address the invitation was sent to.">
        <Input id="invite-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="invite-password" hint={mode === "signup" ? "At least 8 characters." : undefined}>
        <PasswordInput
          id="invite-password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!email || password.length < 8}>
        {mode === "signup" ? "Create account & continue" : "Sign in & continue"}
      </Button>
    </form>
  );
}

function AcceptInvitation() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const session = authClient.useSession();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [result, setResult] = useState<"accepted" | "declined" | null>(null);
  const user = session.data?.user;

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    authClient.organization.getInvitation({ query: { id } }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) setLoadError(error.message ?? "This invitation couldn't be found.");
      else setInvitation(data as unknown as InvitationDetails);
    });
    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  if (session.isPending) return <div className="h-80 animate-pulse rounded-3xl bg-card" aria-busy aria-label="Loading" />;

  if (!user) {
    return (
      <AuthCard title="You've been invited" subtitle="Sign in or create an account to see and accept your invitation.">
        <InlineAuth onDone={() => session.refetch()} />
      </AuthCard>
    );
  }

  const switchAccount = (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        setInvitation(null);
        setLoadError(null);
        session.refetch();
      }}
      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
    >
      <LogOut className="size-4" /> Use a different account
    </button>
  );

  if (result) {
    return (
      <AuthCard
        title={result === "accepted" ? `You've joined ${invitation?.organizationName}` : "Invitation declined"}
        subtitle={result === "accepted" ? "It's now your active workspace." : "You can close this page."}
      >
        <div className="flex flex-col items-center gap-4">
          {result === "accepted" ? <CircleCheck className="size-10 text-emerald-500" /> : <CircleX className="size-10 text-muted-foreground" />}
          <Button asChild size="lg" className="w-full">
            <Link href="/">Go to FlowDesk</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  if (loadError) {
    return (
      <AuthCard title="Invitation unavailable" subtitle={`Signed in as ${user.email}.`} footer={switchAccount}>
        <div className="flex flex-col items-center gap-3 text-center">
          <CircleX className="size-10 text-red-500" />
          <p className="text-sm text-muted-foreground">
            {loadError} It may have expired, been cancelled, or been sent to a different email address.
          </p>
        </div>
      </AuthCard>
    );
  }

  if (!invitation) return <div className="h-80 animate-pulse rounded-3xl bg-card" aria-busy aria-label="Loading invitation" />;

  async function respond(kind: "accept" | "decline") {
    setBusy(kind);
    const { error } =
      kind === "accept"
        ? await authClient.organization.acceptInvitation({ invitationId: invitation!.id })
        : await authClient.organization.rejectInvitation({ invitationId: invitation!.id });
    setBusy(null);
    if (error) {
      toast.error(error.message ?? "Something went wrong.");
      return;
    }
    setResult(kind === "accept" ? "accepted" : "declined");
    router.refresh();
  }

  return (
    <AuthCard title={`Join ${invitation.organizationName}`} subtitle={`${invitation.inviterEmail} invited you to their FlowDesk workspace.`} footer={switchAccount}>
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-lavender p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-white">
            <Building2 className="size-5" />
          </span>
          <div className="min-w-0 text-sm">
            <p className="truncate font-semibold">{invitation.organizationName}</p>
            <p className="text-muted-foreground">
              Role: {roleFromDb(invitation.role)} · for {invitation.email}
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" size="lg" loading={busy === "decline"} disabled={busy !== null} onClick={() => respond("decline")}>
            Decline
          </Button>
          <Button size="lg" loading={busy === "accept"} disabled={busy !== null} onClick={() => respond("accept")}>
            Accept invitation
          </Button>
        </div>
      </div>
    </AuthCard>
  );
}

export default function AcceptInvitationPage() {
  return (
    <AuthShell>
      <AcceptInvitation />
    </AuthShell>
  );
}
