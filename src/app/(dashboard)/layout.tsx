"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { UIProvider, useUI } from "@/components/providers/ui-provider";
import { LogoMark } from "@/components/shared/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { syncActiveOrganization } from "@/store/actions/organizations";
import { useHydrated, useRootState, useWorkspace } from "@/store/hooks";
import { resolveActiveOrganizationId, safePathForWorkspace } from "@/store/selectors";

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh" aria-busy aria-label="Loading FlowDesk">
      <div className="hidden w-[76px] shrink-0 flex-col gap-3 border-r border-border bg-sidebar p-4 md:flex lg:w-64">
        <LogoMark />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-9 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-4 md:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-72 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Keeps the screen consistent with the active workspace: persists a re-resolved
 * workspace, leaves pages about another workspace's project/client, and closes a
 * task drawer whose task isn't in this workspace.
 */
function WorkspaceGuard() {
  const root = useRootState();
  const { tasks } = useWorkspace();
  const { activeTaskId, closeTask } = useUI();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    syncActiveOrganization();
  }, [root.activeOrganizationId, root.organizations, root.organizationMembers]);

  useEffect(() => {
    const target = safePathForWorkspace(root, pathname);
    if (target !== pathname) router.replace(target);
  }, [root, pathname, router]);

  useEffect(() => {
    if (activeTaskId && !tasks.some((t) => t.id === activeTaskId)) closeTask();
  }, [activeTaskId, tasks, closeTask]);

  return null;
}

/**
 * Authenticated shell. Local state is read only after hydration, so the guard waits for it.
 * Signed-in users without any workspace are sent to onboarding.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const root = useRootState();
  const session = root.session;
  const hasWorkspace = Boolean(session && resolveActiveOrganizationId(root));

  useEffect(() => {
    if (!hydrated) return;
    if (!session) router.replace("/login");
    else if (!hasWorkspace) router.replace("/onboarding");
  }, [hydrated, session, hasWorkspace, router]);

  if (!hydrated || !session || !hasWorkspace) return <ShellSkeleton />;

  return (
    <UIProvider>
      <WorkspaceGuard />
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main id="main" className="flex-1 px-4 pb-28 pt-5 md:px-6 md:pb-10 lg:px-8 lg:pt-7">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </UIProvider>
  );
}
