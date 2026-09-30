"use client";

import { Archive, CalendarDays, Ellipsis, ExternalLink, ListTodo, Pencil, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { AvatarStack, LetterTile } from "@/components/shared/avatar";
import { ProjectStatusBadge } from "@/components/shared/badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { dueTone, formatLong } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { toggleProjectStar } from "@/store/actions/projects";
import type { Client, Project, User } from "@/types";

export function ProjectCard({
  project,
  client,
  members,
  progress,
  onEdit,
  onArchive,
  onDelete,
}: {
  project: Project;
  client?: Client;
  members: User[];
  progress: { total: number; done: number; percent: number };
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const href = `/projects/${project.id}/tasks`;
  const tone = dueTone(project.dueDate, project.status === "Completed");

  return (
    <article className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-raised">
      <div className="flex items-start gap-3">
        <LetterTile name={project.name} color={project.color} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold">
            <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
              {project.name}
            </Link>
          </h2>
          <p className="truncate text-xs text-muted-foreground">{client?.name ?? "Internal project"}</p>
        </div>
        <div className="relative z-10 flex items-center">
          <button
            type="button"
            onClick={() => toggleProjectStar(project.id)}
            aria-pressed={project.starred}
            aria-label={project.starred ? "Remove from favorites" : "Add to favorites"}
            className="rounded-md p-1.5 text-subtle hover:text-amber-500"
          >
            <Star className={cn("size-4", project.starred && "fill-amber-400 text-amber-400")} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label={`${project.name} actions`} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
                <Ellipsis className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44">
              <DropdownMenuItem asChild>
                <Link href={href}>
                  <ExternalLink /> Open
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil /> Edit
              </DropdownMenuItem>
              {project.status !== "Archived" && (
                <DropdownMenuItem onSelect={onArchive}>
                  <Archive /> Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={onDelete}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">{project.description || "No description"}</p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold">{progress.percent}%</span>
        </div>
        <Progress value={progress.percent} color={project.color} label={`${project.name} progress`} />
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
        <ProjectStatusBadge status={project.status} />
        <span className={cn("inline-flex items-center gap-1", tone === "overdue" && "text-red-500")}>
          <CalendarDays className="size-3.5" /> {formatLong(project.dueDate)}
        </span>
        <span className="hidden items-center gap-1 sm:inline-flex">
          <ListTodo className="size-3.5" /> {progress.total}
        </span>
        <AvatarStack users={members} max={3} size="sm" className="relative z-10 ml-auto" />
      </div>
    </article>
  );
}
