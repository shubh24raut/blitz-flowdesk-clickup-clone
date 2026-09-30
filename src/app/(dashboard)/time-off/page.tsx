"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ApprovalsPanel } from "@/components/time-off/approvals-panel";
import { HolidaysPanel } from "@/components/time-off/holidays-panel";
import { LeaveDetailDrawer } from "@/components/time-off/leave-detail-drawer";
import { MyLeavePanel } from "@/components/time-off/my-leave-panel";
import { PoliciesPanel } from "@/components/time-off/policies-panel";
import { RequestLeaveDialog } from "@/components/time-off/request-leave-dialog";
import { useLeaveLink } from "@/components/time-off/use-leave-link";
import { WhosOutPanel } from "@/components/time-off/whos-out-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TabCount, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isDateKey } from "@/lib/time-off";
import { useWorkspace, useCurrentUser } from "@/store/hooks";
import { canReviewLeave, isTimeOffAdmin } from "@/store/selectors";

const TABS = ["mine", "approvals", "team", "holidays", "policies"] as const;
type Tab = (typeof TABS)[number];
const ADMIN_TABS: Tab[] = ["approvals", "policies"];

function TimeOffContent() {
  const state = useWorkspace();
  const me = useCurrentUser();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = isTimeOffAdmin(me);
  const [requestState, setRequestOpen] = useState(false);
  const { leaveId, closeLeave } = useLeaveLink();

  // `?request=1` or `?request=yyyy-MM-dd` (from the calendar) opens the request dialog.
  const requestParam = params.get("request");
  const requestOpen = requestState || requestParam !== null;
  const requestDate = requestParam && isDateKey(requestParam) ? requestParam : undefined;

  const requested = params.get("tab") as Tab;
  const tab: Tab = TABS.includes(requested) && (isAdmin || !ADMIN_TABS.includes(requested)) ? requested : "mine";
  const toReview = state.leaveRequests.filter((r) => canReviewLeave(me, r)).length;

  function setTab(next: string) {
    router.replace(`${pathname}?tab=${next}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        title="Time off"
        description="Leave balances, approvals and holidays."
        actions={
          <Button onClick={() => setRequestOpen(true)}>
            <Plus /> Request time off
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="mine">My leave</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="approvals">
              Approvals {toReview > 0 && <TabCount>{toReview}</TabCount>}
            </TabsTrigger>
          )}
          <TabsTrigger value="team">Who&apos;s out</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          {isAdmin && <TabsTrigger value="policies">Policies</TabsTrigger>}
        </TabsList>

        <div className="mt-5">
          <TabsContent value="mine">
            <MyLeavePanel onRequest={() => setRequestOpen(true)} />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="approvals">
              <ApprovalsPanel />
            </TabsContent>
          )}
          <TabsContent value="team">
            <WhosOutPanel />
          </TabsContent>
          <TabsContent value="holidays">
            <HolidaysPanel />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="policies">
              <PoliciesPanel />
            </TabsContent>
          )}
        </div>
      </Tabs>

      <LeaveDetailDrawer requestId={leaveId} onClose={closeLeave} />
      <RequestLeaveDialog
        open={requestOpen}
        defaultDate={requestDate}
        onOpenChange={(open) => {
          setRequestOpen(open);
          if (!open && requestParam !== null) router.replace(`${pathname}?tab=${tab}`, { scroll: false });
        }}
      />
    </div>
  );
}

export default function TimeOffPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <TimeOffContent />
    </Suspense>
  );
}
