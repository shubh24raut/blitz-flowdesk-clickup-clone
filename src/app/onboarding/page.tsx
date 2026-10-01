"use client";

import { ArrowLeft, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { WorkspaceForm } from "@/components/workspace/workspace-form";
import { useLogout } from "@/hooks/use-logout";
import { wait } from "@/lib/utils";
import { createOrganization } from "@/store/actions/organizations";
import { useAuthSync } from "@/hooks/use-auth-sync";
import { useRootState } from "@/store/hooks";
import { currentUserId, resolveActiveOrganizationId } from "@/store/selectors";

/**
 * First-run screen for a signed-in user who belongs to no workspace yet
 * (new sign-ups, or someone who left or lost their last workspace).
 */
export default function OnboardingPage() {
  const router = useRouter();
  const auth = useAuthSync();
  const state = useRootState();
  const logout = useLogout();
  const [inviteInfo, setInviteInfo] = useState(false);
  const hasWorkspace = auth === "signed-in" && resolveActiveOrganizationId(state) !== null;
  const email = state.users.find((u) => u.id === currentUserId(state))?.email;

  useEffect(() => {
    if (auth === "signed-out") router.replace("/login");
    else if (hasWorkspace) router.replace("/dashboard");
  }, [auth, hasWorkspace, router]);

  const ready = auth === "signed-in" && !hasWorkspace;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-lavender px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 size-[28rem] rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-32 size-[30rem] rounded-full bg-fuchsia-400/10 blur-3xl" />
      <div className="relative w-full max-w-[460px] rounded-3xl border border-border bg-card px-6 py-8 shadow-overlay sm:px-9 sm:py-10">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="size-12" />
          <h1 className="mt-5 text-xl font-semibold">Welcome to FlowDesk</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {inviteInfo ? "Join a workspace you've been invited to." : "Create your first workspace to get started."}
          </p>
        </div>

        {!ready ? (
          <div className="mt-8 h-48 animate-pulse rounded-2xl bg-muted" aria-busy aria-label="Loading" />
        ) : inviteInfo ? (
          <div className="mt-7 space-y-5">
            <div className="flex gap-3 rounded-2xl border border-border bg-lavender p-4 text-sm">
              <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                Ask a workspace owner or admin to invite <span className="font-medium text-foreground">{email}</span>. Invitations you
                receive will appear here.
              </p>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => setInviteInfo(false)}>
              <ArrowLeft /> Create a workspace instead
            </Button>
          </div>
        ) : (
          <WorkspaceForm
            fields="basic"
            idPrefix="onboarding"
            className="mt-7"
            onSubmit={async (values) => {
              await wait(300);
              const result = createOrganization(values);
              if (!result.ok) return result.error;
              toast.success("Workspace created successfully");
              router.replace("/dashboard");
            }}
          >
            {({ isSubmitting }) => (
              <div className="mt-6 space-y-2">
                <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                  Create Workspace
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setInviteInfo(true)}>
                  I have an invitation
                </Button>
              </div>
            )}
          </WorkspaceForm>
        )}

        {ready && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Signed in as {email}.{" "}
            <button type="button" onClick={logout} className="font-medium text-primary hover:underline">
              Log out
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
