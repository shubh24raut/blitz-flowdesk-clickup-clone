"use client";

import { FolderX } from "lucide-react";
import Link from "next/link";
import { useParams, useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { ProjectHeader } from "@/components/projects/project-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/store/hooks";

export default function ProjectLayout({ children }: { children: ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();
  const segment = useSelectedLayoutSegment() ?? "overview";
  const project = useAppState().projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <EmptyState
        icon={FolderX}
        title="Project not found"
        description="This project may have been deleted or you don't have access to it."
        action={
          <Button asChild>
            <Link href="/projects">Back to projects</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <ProjectHeader project={project} activeTab={segment} />
      <div className="pt-5">{children}</div>
    </div>
  );
}
