"use client";

import { AttachmentGallery } from "@/components/attachments/attachment-gallery";
import { useProject } from "@/hooks/use-project";
import { Card, CardContent } from "@/components/ui/card";
import { formatBytes } from "@/lib/utils";
import { addAttachments } from "@/store/actions/attachments";
import { indexes } from "@/store/selectors";
import { useAppState } from "@/store/hooks";

export default function ProjectFilesPage() {
  const project = useProject();
  const state = useAppState();
  const idx = indexes(state);
  const files = state.attachments.filter((a) => a.projectId === project.id);
  const taskTitles = new Map(state.tasks.map((t) => [t.id, t.title]));
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-semibold">Project files</h2>
            <p className="text-sm text-muted-foreground">
              Everything attached to this project, its tasks and comments · {files.length} files · {formatBytes(totalSize)}
            </p>
          </div>
        </div>
        <AttachmentGallery
          attachments={files}
          columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
          onUpload={async (list) => {
            await addAttachments(list, { projectId: project.id, taskId: null });
          }}
          subtitleFor={(a) =>
            a.taskId ? `${taskTitles.get(a.taskId) ?? "Task"}` : `Project · ${idx.users.get(a.uploadedById)?.name.split(" ")[0] ?? ""}`
          }
        />
      </CardContent>
    </Card>
  );
}
