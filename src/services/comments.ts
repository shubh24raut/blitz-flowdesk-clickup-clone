import { uid } from "@/lib/utils";
import { getState, setState } from "@/store/store";
import type { Comment, ID } from "@/types";
import { buildAttachments } from "./attachments";
import { actorId, now, replaceById, withActivity } from "./internal";

export interface CommentInput {
  projectId: ID;
  taskId: ID | null;
  parentId?: ID | null;
  body: string;
  files?: File[];
}

export async function addComment(input: CommentInput): Promise<Comment> {
  const state = getState();
  const comment: Comment = {
    id: uid("cm"),
    projectId: input.projectId,
    taskId: input.taskId,
    parentId: input.parentId ?? null,
    authorId: actorId(state),
    body: input.body.trim(),
    reactions: [],
    createdAt: now(),
    editedAt: null,
  };
  const attachments = input.files?.length
    ? await buildAttachments(input.files, { projectId: input.projectId, taskId: input.taskId, commentId: comment.id })
    : [];
  const task = input.taskId ? state.tasks.find((t) => t.id === input.taskId) : undefined;
  setState((s) =>
    withActivity(
      { ...s, comments: [...s.comments, comment], attachments: [...attachments, ...s.attachments] },
      {
        action: input.parentId ? "replied to a comment on" : task ? "commented on" : "posted in discussions for",
        target: task?.title ?? s.projects.find((p) => p.id === input.projectId)?.name,
        projectId: input.projectId,
        taskId: input.taskId,
      },
    ),
  );
  return comment;
}

export function updateComment(id: ID, body: string) {
  setState((s) => ({
    ...s,
    comments: replaceById(s.comments, id, (c) => ({ ...c, body: body.trim(), editedAt: now() })),
  }));
}

/** Deletes a comment together with its replies and attachments. */
export function deleteComment(id: ID) {
  setState((s) => {
    const removed = new Set([id, ...s.comments.filter((c) => c.parentId === id).map((c) => c.id)]);
    return {
      ...s,
      comments: s.comments.filter((c) => !removed.has(c.id)),
      attachments: s.attachments.filter((a) => !a.commentId || !removed.has(a.commentId)),
    };
  });
}

export function toggleReaction(commentId: ID, emoji: string) {
  setState((s) => {
    const me = actorId(s);
    return {
      ...s,
      comments: replaceById(s.comments, commentId, (c) => {
        const existing = c.reactions.find((r) => r.emoji === emoji);
        let reactions = c.reactions;
        if (!existing) reactions = [...reactions, { emoji, userIds: [me] }];
        else if (existing.userIds.includes(me)) {
          reactions = reactions
            .map((r) => (r.emoji === emoji ? { ...r, userIds: r.userIds.filter((u) => u !== me) } : r))
            .filter((r) => r.userIds.length > 0);
        } else {
          reactions = reactions.map((r) => (r.emoji === emoji ? { ...r, userIds: [...r.userIds, me] } : r));
        }
        return { ...c, reactions };
      }),
    };
  });
}
