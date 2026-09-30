"use client";

import { CommentThread } from "@/components/comments/comment-thread";
import { useProject } from "@/hooks/use-project";
import { Card, CardContent } from "@/components/ui/card";

export default function ProjectDiscussionsPage() {
  const project = useProject();
  return (
    <Card className="mx-auto max-w-3xl">
      <CardContent>
        <h2 className="text-[15px] font-semibold">Discussions</h2>
        <p className="mb-5 text-sm text-muted-foreground">Project-wide announcements and conversations for the {project.name} team.</p>
        <CommentThread
          projectId={project.id}
          taskId={null}
          emptyHint="Share an update with the team — mention people with @ and attach files."
        />
      </CardContent>
    </Card>
  );
}
