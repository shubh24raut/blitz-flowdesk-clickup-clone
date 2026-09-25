import { attachmentKind, uid } from "@/lib/utils";
import { getState, setState } from "@/store/store";
import type { Attachment, ID } from "@/types";
import { actorId, now, withActivity } from "./internal";

/** Small images are inlined as data URLs so their previews survive a reload. */
const INLINE_IMAGE_LIMIT = 350 * 1024;
const INLINE_TEXT_LIMIT = 64 * 1024;

function readAs(file: File, mode: "dataURL" | "text"): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    if (mode === "dataURL") reader.readAsDataURL(file);
    else reader.readAsText(file);
  });
}

/**
 * Turns browser `File`s into attachment records with local previews.
 * No upload happens — previews use data URLs or object URLs.
 */
export async function buildAttachments(
  files: File[],
  context: { projectId: ID; taskId: ID | null; commentId?: ID | null },
): Promise<Attachment[]> {
  const uploadedById = actorId(getState());
  return Promise.all(
    files.map(async (file) => {
      const kind = attachmentKind(file.type, file.name);
      let url: string | null = null;
      let textContent: string | undefined;
      if (kind === "image" && file.size <= INLINE_IMAGE_LIMIT) url = await readAs(file, "dataURL");
      else if (kind === "code" && file.size <= INLINE_TEXT_LIMIT) textContent = await readAs(file, "text");
      else url = URL.createObjectURL(file);
      return {
        id: uid("at"),
        projectId: context.projectId,
        taskId: context.taskId,
        commentId: context.commentId ?? null,
        name: file.name,
        kind,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        url,
        textContent,
        uploadedById,
        createdAt: now(),
      } satisfies Attachment;
    }),
  );
}

export async function addAttachments(files: File[], context: { projectId: ID; taskId: ID | null }) {
  const attachments = await buildAttachments(files, context);
  const task = context.taskId ? getState().tasks.find((t) => t.id === context.taskId) : undefined;
  setState((s) =>
    withActivity(
      { ...s, attachments: [...attachments, ...s.attachments] },
      {
        action: attachments.length > 1 ? `uploaded ${attachments.length} files to` : `uploaded “${attachments[0]?.name}” to`,
        target: task?.title ?? s.projects.find((p) => p.id === context.projectId)?.name,
        projectId: context.projectId,
        taskId: context.taskId,
      },
    ),
  );
  return attachments;
}

export function removeAttachment(id: ID) {
  const attachment = getState().attachments.find((a) => a.id === id);
  if (attachment?.url?.startsWith("blob:")) URL.revokeObjectURL(attachment.url);
  setState((s) => ({ ...s, attachments: s.attachments.filter((a) => a.id !== id) }));
}
