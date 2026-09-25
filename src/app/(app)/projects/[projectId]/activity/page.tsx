"use client";

import { useMemo, useState } from "react";
import { useProject } from "@/components/projects/use-project";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { getUsers } from "@/store/selectors";
import { useAppState } from "@/store/hooks";

const KINDS = [
  { id: "all", label: "All", match: () => true },
  { id: "moves", label: "Moves", match: (action: string) => action === "moved" },
  { id: "comments", label: "Comments", match: (action: string) => /comment|replied|posted/.test(action) },
  { id: "files", label: "Files", match: (action: string) => /upload|attachment/.test(action) },
  { id: "changes", label: "Changes", match: (action: string) => /changed|renamed|updated|stage|completed/.test(action) },
] as const;

export default function ProjectActivityPage() {
  const project = useProject();
  const state = useAppState();
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("all");
  const [member, setMember] = useState("all");
  const members = getUsers(state, project.memberIds);

  const activities = useMemo(() => {
    const matcher = KINDS.find((k) => k.id === kind)!.match;
    return state.activities.filter(
      (a) => a.projectId === project.id && matcher(a.action) && (member === "all" || a.actorId === member),
    );
  }, [state.activities, project.id, kind, member]);

  return (
    <Card className="mx-auto max-w-3xl">
      <CardContent>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
                  kind === k.id ? "border-primary bg-primary-light text-primary" : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
          <NativeSelect value={member} onChange={(e) => setMember(e.target.value)} aria-label="Filter by member" className="sm:w-48">
            <option value="all">Everyone</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <ActivityFeed activities={activities} emptyText="No activity matches these filters." />
      </CardContent>
    </Card>
  );
}
