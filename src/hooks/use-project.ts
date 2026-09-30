"use client";

import { useParams } from "next/navigation";
import { useWorkspace } from "@/store/hooks";
import type { Project } from "@/types";

/** The project for the current `/projects/[projectId]/*` route. The layout guarantees it exists. */
export function useProject(): Project {
  const { projectId } = useParams<{ projectId: string }>();
  const project = useWorkspace().projects.find((p) => p.id === projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);
  return project;
}
