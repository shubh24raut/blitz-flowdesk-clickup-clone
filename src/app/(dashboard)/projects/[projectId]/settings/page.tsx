"use client";

import { Archive, ArchiveRestore, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { StageManager } from "@/components/projects/stage-manager";
import { useProject } from "@/hooks/use-project";
import { UserAvatar } from "@/components/shared/avatar";
import { ProjectStatusBadge } from "@/components/shared/badges";
import { UserPicker } from "@/components/shared/pickers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { formatLong } from "@/lib/dates";
import { archiveProject, deleteProject, setProjectMembers, updateProject } from "@/store/actions/projects";
import { getProjectTasks, getUsers, indexes } from "@/store/selectors";
import { useAppState, useCurrentUser } from "@/store/hooks";

export default function ProjectSettingsPage() {
  const project = useProject();
  const state = useAppState();
  const me = useCurrentUser();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState("");
  const members = getUsers(state, project.memberIds);
  const client = project.clientId ? indexes(state).clients.get(project.clientId) : undefined;
  const taskCount = getProjectTasks(state, project.id).length;
  const archived = project.status === "Archived";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card>
        <CardContent>
          <StageManager projectId={project.id} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil /> Edit
            </Button>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{project.name}</dd>
              <dt className="text-muted-foreground">Key</dt>
              <dd className="font-mono text-xs">{project.key}</dd>
              <dt className="text-muted-foreground">Client</dt>
              <dd>{client?.name ?? "Internal"}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <ProjectStatusBadge status={project.status} />
              </dd>
              <dt className="text-muted-foreground">Timeline</dt>
              <dd>
                {formatLong(project.startDate)} → {formatLong(project.dueDate)}
              </dd>
              <dt className="text-muted-foreground">Color</dt>
              <dd>
                <span className="inline-block size-4 rounded-full align-middle" style={{ backgroundColor: project.color }} />
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <UserPicker
              users={state.users}
              value={project.memberIds}
              onChange={(ids) => {
                setProjectMembers(project.id, ids);
              }}
              align="end"
              trigger={
                <Button variant="secondary" size="sm">
                  <UserPlus /> Manage
                </Button>
              }
            />
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <UserAvatar user={m} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {m.name} {m.id === me.id && <span className="text-xs text-muted-foreground">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${m.name} from project`}
                    onClick={() => {
                      setProjectMembers(project.id, project.memberIds.filter((id) => id !== m.id));
                      toast.success(`${m.name} removed from ${project.name}`);
                    }}
                    className="rounded-md p-1.5 text-subtle hover:bg-muted hover:text-red-500"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
              {members.length === 0 && <li className="text-sm text-muted-foreground">No members yet.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-red-200 dark:border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-600">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{archived ? "Restore project" : "Archive project"}</p>
              <p className="text-sm text-muted-foreground">
                {archived ? "Make the project active again." : "Hide the project from active lists. Everything is kept and can be restored."}
              </p>
            </div>
            {archived ? (
              <Button
                variant="secondary"
                onClick={() => {
                  updateProject(project.id, { status: "Active" });
                  toast.success("Project restored");
                }}
              >
                <ArchiveRestore /> Restore
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setConfirmArchive(true)}>
                <Archive /> Archive
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Delete project</p>
              <p className="text-sm text-muted-foreground">Permanently delete this project and its {taskCount} tasks.</p>
            </div>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProjectFormDialog open={editing} onOpenChange={setEditing} project={project} />
      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={`Archive “${project.name}”?`}
        description="The project will be hidden from dashboards and active lists."
        confirmLabel="Archive"
        destructive={false}
        onConfirm={() => {
          archiveProject(project.id);
          toast.success("Project archived");
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          setConfirmDelete(open);
          if (!open) setTyped("");
        }}
        title={`Delete “${project.name}”?`}
        description={`This permanently removes the project, its stages, ${taskCount} tasks, comments and files.`}
        confirmLabel="Delete project"
        confirmDisabled={typed !== project.name}
        onConfirm={() => {
          router.push("/projects");
          deleteProject(project.id);
          toast.success("Project deleted");
        }}
      >
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted-foreground">
            Type <span className="font-semibold text-foreground">{project.name}</span> to confirm
          </span>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Project name confirmation" />
        </label>
      </ConfirmDialog>
    </div>
  );
}
