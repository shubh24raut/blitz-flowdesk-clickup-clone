"use client";

import { format } from "date-fns";
import { CalendarOff, PartyPopper, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Progress } from "@/components/ui/progress";
import { HOLIDAY_KIND_LABELS, HOLIDAY_KIND_STYLES } from "@/constants";
import { formatDays, fromDateKey, toDateKey } from "@/lib/time-off";
import { canCancelLeave, cancelLeave } from "@/store/actions/time-off";
import { useAppState, useCurrentUser } from "@/store/hooks";
import { holidaysFor, leaveBalances } from "@/store/selectors";
import type { LeaveRequest } from "@/types";
import { formatLeaveRange, LeaveRequestItem } from "./leave-request-item";

export function MyLeavePanel({ onRequest }: { onRequest: () => void }) {
  const state = useAppState();
  const me = useCurrentUser();
  const [cancelling, setCancelling] = useState<LeaveRequest | null>(null);
  const today = toDateKey(new Date());
  const year = new Date().getFullYear();
  const balances = leaveBalances(state, me.id, year);
  const upcomingHolidays = holidaysFor(state, me.id)
    .filter((h) => h.date >= today)
    .slice(0, 6);
  const requests = state.leaveRequests
    .filter((r) => r.userId === me.id)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {balances.map(({ type, used, pending, remaining }) => (
          <Card key={type.id} className="p-4">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: type.color }} />
              <span className="truncate">{type.name}</span>
            </p>
            {remaining === null ? (
              <>
                <p className="mt-1 text-2xl font-bold">{used}</p>
                <p className="text-xs text-muted-foreground">days taken · no limit</p>
              </>
            ) : (
              <>
                <p className="mt-1 text-2xl font-bold">
                  {remaining}
                  <span className="text-sm font-medium text-muted-foreground"> / {type.allowance}</span>
                </p>
                <Progress
                  className="mt-2"
                  value={type.allowance ? ((used + pending) / type.allowance) * 100 : 0}
                  color={type.color}
                  label={`${type.name} used`}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {formatDays(used)} used{pending > 0 && ` · ${pending} pending`}
                </p>
              </>
            )}
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">My requests</h2>
            <Button variant="soft" size="sm" onClick={onRequest}>
              <Plus /> Request
            </Button>
          </div>
          {requests.length === 0 ? (
            <EmptyState compact icon={CalendarOff} title="No time off yet" description="Requests you make show up here with their status." />
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {requests.map((r) => (
                <LeaveRequestItem
                  key={r.id}
                  request={r}
                  actions={
                    canCancelLeave(r, me.id) && (
                      <Button variant="ghost" size="sm" onClick={() => setCancelling(r)}>
                        Cancel
                      </Button>
                    )
                  }
                />
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="font-semibold">Upcoming holidays</h2>
          {upcomingHolidays.length === 0 ? (
            <EmptyState compact icon={PartyPopper} title="No holidays ahead" description="Admins can add or import them in the Holidays tab." />
          ) : (
            <ul className="mt-3 space-y-3">
              {upcomingHolidays.map((h) => {
                const date = fromDateKey(h.date);
                return (
                  <li key={h.id} className="flex items-center gap-3">
                    <span className="grid w-11 shrink-0 place-items-center rounded-lg bg-muted py-1 leading-tight">
                      <span className="text-[10px] font-medium uppercase text-muted-foreground">{format(date, "MMM")}</span>
                      <span className="text-base font-bold">{format(date, "d")}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{h.name}</span>
                      <span className="block text-xs text-muted-foreground">{format(date, "EEEE")}</span>
                    </span>
                    <Badge className={HOLIDAY_KIND_STYLES[h.kind]}>{HOLIDAY_KIND_LABELS[h.kind].replace(" holiday", "")}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(open) => !open && setCancelling(null)}
        title="Cancel this leave?"
        description={cancelling ? `${formatLeaveRange(cancelling)} will be returned to your balance.` : undefined}
        confirmLabel="Cancel leave"
        onConfirm={() => {
          if (cancelling && cancelLeave(cancelling.id)) toast.success("Leave cancelled");
        }}
      />
    </div>
  );
}
