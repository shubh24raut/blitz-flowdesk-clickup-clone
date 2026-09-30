"use client";

import { FolderKanban, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { useUI } from "@/components/providers/ui-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { PROJECT_STATUSES } from "@/constants";
import { cn } from "@/lib/utils";
import { archiveProject, deleteProject } from "@/store/actions/projects";
import { getUsers, indexes, projectProgress } from "@/store/selectors";
import { useAppState } from "@/store/hooks";
import type { Project, ProjectStatus } from "@/types";

type StatusFilter = "All" | ProjectStatus;
type Sort = "recent" | "due" | "name" | "progress";

export default function ProjectsPage() {
  const state = useAppState();
  const { openCreateProject } = useUI();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [clientId, setClientId] = useState("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const idx = indexes(state);

  const counts = useMemo(() => {
    const map: Record<StatusFilter, number> = { All: 0, Active: 0, "On Hold": 0, Completed: 0, Archived: 0 };
    for (const p of state.projects) {
      map[p.status]++;
      if (p.status !== "Archived") map.All++;
    }
    return map;
  }, [state.projects]);

  const projects = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = state.projects.filter(
      (p) =>
        (status === "All" ? p.status !== "Archived" : p.status === status) &&
        (clientId === "all" || (clientId === "none" ? !p.clientId : p.clientId === clientId)) &&
        (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
    );
    return list.sort((a, b) => {
      if (sort === "due") return a.dueDate.localeCompare(b.dueDate);
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "progress") return projectProgress(state, b.id).percent - projectProgress(state, a.id).percent;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [state, search, status, clientId, sort]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Projects"
        description="All client and internal projects in your workspace."
        actions={
          <Button onClick={openCreateProject}>
            <Plus /> New Project
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Project status" className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-card">
          {(["All", ...PROJECT_STATUSES] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                status === s ? "bg-primary-light text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s} <span className="ml-0.5 text-xs opacity-70">{counts[s]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects…" className="sm:w-60" />
          <div className="grid grid-cols-2 gap-2">
            <Select size="sm" value={clientId} onValueChange={setClientId} aria-label="Filter by client" className="" options={[{ value: "all", label: "All clients" }, { value: "none", label: "Internal" }, ...state.clients.map((c) => ({ value: c.id, label: c.name }))]} />
            <Select size="sm" value={sort} onValueChange={(v) => setSort(v as Sort)} aria-label="Sort projects" className="" options={[{ value: "recent", label: "Newest" }, { value: "due", label: "Due date" }, { value: "name", label: "Name" }, { value: "progress", label: "Progress" }]} />
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={search || clientId !== "all" ? "No projects match your filters" : `No ${status === "All" ? "" : status.toLowerCase()} projects`}
          description="Create a project to start organising tasks with your own workflow stages."
          action={
            <Button onClick={openCreateProject}>
              <Plus /> New Project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              client={p.clientId ? idx.clients.get(p.clientId) : undefined}
              members={getUsers(state, p.memberIds)}
              progress={projectProgress(state, p.id)}
              onEdit={() => setEditing(p)}
              onArchive={() => {
                archiveProject(p.id);
                toast.success(`“${p.name}” archived`, { description: "Find it under the Archived tab." });
              }}
              onDelete={() => setDeleting(p)}
            />
          ))}
        </div>
      )}

      <ProjectFormDialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} project={editing ?? undefined} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        description="The project, its stages, tasks, comments and files will be permanently removed."
        confirmLabel="Delete project"
        onConfirm={() => {
          if (deleting) deleteProject(deleting.id);
          toast.success("Project deleted");
        }}
      />
    </div>
  );
}
