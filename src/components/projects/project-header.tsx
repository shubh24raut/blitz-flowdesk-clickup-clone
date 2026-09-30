"use client";

import { ChevronRight, FolderKanban, Pencil, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AvatarStack } from "@/components/shared/avatar";
import { ProjectStatusBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn, withAlpha } from "@/lib/utils";
import { toggleProjectStar } from "@/store/actions/projects";
import { getUsers, indexes } from "@/store/selectors";
import { useWorkspace } from "@/store/hooks";
import type { Project } from "@/types";
import { ProjectFormDialog } from "./project-form-dialog";

export const PROJECT_TABS = [
  { slug: "overview", label: "Overview" },
  { slug: "tasks", label: "Tasks" },
  { slug: "files", label: "Files" },
  { slug: "discussions", label: "Discussions" },
  { slug: "timeline", label: "Timeline" },
  { slug: "activity", label: "Activity" },
  { slug: "settings", label: "Settings" },
] as const;

export function ProjectHeader({ project, activeTab }: { project: Project; activeTab: string }) {
  const state = useWorkspace();
  const [editing, setEditing] = useState(false);
  const client = project.clientId ? indexes(state).clients.get(project.clientId) : undefined;
  const members = getUsers(state, project.memberIds);
  const tabLabel = PROJECT_TABS.find((t) => t.slug === activeTab)?.label;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/projects" className="font-medium text-primary hover:underline">
          Projects
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/projects/${project.id}/overview`} className="truncate hover:text-foreground">
          {project.name}
        </Link>
        {tabLabel && (
          <>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">{tabLabel}</span>
          </>
        )}
      </nav>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl"
            style={{ backgroundColor: withAlpha(project.color, 0.14), color: project.color }}
          >
            <FolderKanban className="size-6" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight">{project.name}</h1>
              <Tooltip content={project.starred ? "Remove from favorites" : "Add to favorites"}>
                <button
                  type="button"
                  onClick={() => toggleProjectStar(project.id)}
                  aria-pressed={project.starred}
                  aria-label="Favorite"
                  className="rounded-md p-1 text-subtle transition hover:text-amber-500"
                >
                  <Star className={cn("size-4.5", project.starred && "fill-amber-400 text-amber-400")} />
                </button>
              </Tooltip>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {project.description || "No description"}
              {client && (
                <>
                  {" · "}
                  <Link href={`/clients/${client.id}`} className="font-medium text-foreground hover:text-primary">
                    {client.name}
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AvatarStack users={members} max={4} size="md" />
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil /> Edit
          </Button>
        </div>
      </div>

      <nav aria-label="Project sections" className="no-scrollbar -mx-4 mt-5 flex gap-1 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
        {PROJECT_TABS.map((tab) => {
          const active = tab.slug === activeTab;
          return (
            <Link
              key={tab.slug}
              href={`/projects/${project.id}/${tab.slug}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative -mb-px shrink-0 border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition",
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <ProjectFormDialog open={editing} onOpenChange={setEditing} project={project} />
    </div>
  );
}
