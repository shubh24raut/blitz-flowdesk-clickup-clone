"use client";

import { Copy, Ellipsis, MessageSquare, Pencil, Reply, SmilePlus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AttachmentPreviewDialog } from "@/components/attachments/attachment-preview-dialog";
import { AttachmentChip } from "@/components/attachments/attachment-tile";
import { UserAvatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { RichText } from "@/components/shared/rich-text";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatRelative } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { deleteComment, toggleReaction, updateComment } from "@/services/comments";
import { indexes } from "@/store/selectors";
import { useAppState, useCurrentUser } from "@/store/hooks";
import type { Attachment, Comment, ID } from "@/types";
import { CommentComposer, EMOJIS } from "./comment-composer";

interface ThreadProps {
  projectId: ID;
  taskId: ID | null;
  /** Show the composer above the list (desktop) — mobile task view uses a sticky composer instead. */
  showComposer?: boolean;
  composerClassName?: string;
  emptyHint?: string;
}

export function CommentThread({ projectId, taskId, showComposer = true, composerClassName, emptyHint }: ThreadProps) {
  const state = useAppState();
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Comment | null>(null);

  const { roots, replies } = useMemo(() => {
    const all = state.comments.filter((c) => c.projectId === projectId && c.taskId === taskId);
    const replyMap = new Map<ID, Comment[]>();
    for (const c of all) {
      if (!c.parentId) continue;
      replyMap.set(c.parentId, [...(replyMap.get(c.parentId) ?? []), c]);
    }
    for (const list of replyMap.values()) list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return {
      roots: all.filter((c) => !c.parentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      replies: replyMap,
    };
  }, [state.comments, projectId, taskId]);

  const mentionNames = useMemo(() => state.users.map((u) => u.name), [state.users]);

  return (
    <div className="space-y-5">
      {showComposer && <CommentComposer projectId={projectId} taskId={taskId} className={composerClassName} />}
      {roots.length === 0 ? (
        <EmptyState compact icon={MessageSquare} title="No comments yet" description={emptyHint ?? "Start the conversation — mention teammates with @."} />
      ) : (
        <ul className="space-y-5">
          {roots.map((comment) => (
            <li key={comment.id}>
              <CommentItem
                comment={comment}
                mentionNames={mentionNames}
                onPreview={setPreview}
                onDelete={setPendingDelete}
              />
              {(replies.get(comment.id)?.length ?? 0) > 0 && (
                <ul className="ml-11 mt-3 space-y-3 border-l-2 border-border pl-4 sm:ml-12">
                  {replies.get(comment.id)!.map((reply) => (
                    <li key={reply.id}>
                      <CommentItem comment={reply} mentionNames={mentionNames} onPreview={setPreview} onDelete={setPendingDelete} isReply />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      <AttachmentPreviewDialog attachment={preview} onOpenChange={(open) => !open && setPreview(null)} />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete comment?"
        description={
          pendingDelete && !pendingDelete.parentId && replies.get(pendingDelete.id)?.length
            ? "This comment and its replies will be permanently removed."
            : "This comment will be permanently removed."
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (pendingDelete) deleteComment(pendingDelete.id);
          toast.success("Comment deleted");
        }}
      />
    </div>
  );
}

function CommentItem({
  comment,
  mentionNames,
  onPreview,
  onDelete,
  isReply,
}: {
  comment: Comment;
  mentionNames: string[];
  onPreview: (a: Attachment) => void;
  onDelete: (c: Comment) => void;
  isReply?: boolean;
}) {
  const state = useAppState();
  const me = useCurrentUser();
  const author = indexes(state).users.get(comment.authorId);
  const attachments = state.attachments.filter((a) => a.commentId === comment.id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [replying, setReplying] = useState(false);
  const mine = comment.authorId === me.id;

  return (
    <article className="group flex gap-3">
      <UserAvatar user={author} size={isReply ? "md" : "lg"} className={isReply ? "" : "size-9"} />
      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-2">
          <span className="text-sm font-semibold">{author?.name ?? "Former member"}</span>
          <time className="text-xs text-subtle" dateTime={comment.createdAt}>
            {formatRelative(comment.createdAt)}
          </time>
          {comment.editedAt && <span className="text-xs text-subtle">(edited)</span>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Comment actions"
                className="ml-auto rounded-md p-1 text-muted-foreground opacity-100 transition hover:bg-muted sm:opacity-0 sm:group-hover:opacity-100 sm:data-[state=open]:opacity-100"
              >
                <Ellipsis className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40">
              <DropdownMenuItem
                onSelect={() => {
                  navigator.clipboard?.writeText(comment.body).catch(() => undefined);
                  toast.success("Comment copied");
                }}
              >
                <Copy /> Copy text
              </DropdownMenuItem>
              {mine && (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      setDraft(comment.body);
                      setEditing(true);
                    }}
                  >
                    <Pencil /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={() => onDelete(comment)}>
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setEditing(false);
                }
              }}
              aria-label="Edit comment"
              className="block min-h-20 w-full rounded-xl border border-primary bg-card px-3 py-2 text-sm outline-none ring-3 ring-primary/15"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!draft.trim()}
                onClick={() => {
                  updateComment(comment.id, draft);
                  setEditing(false);
                  toast.success("Comment updated");
                }}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <RichText text={comment.body} mentionNames={mentionNames} className="mt-1 text-foreground/80" />
        )}

        {attachments.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {attachments.map((a) => (
              <AttachmentChip key={a.id} attachment={a} onPreview={() => onPreview(a)} />
            ))}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {comment.reactions.map((r) => {
            const reacted = r.userIds.includes(me.id);
            const names = r.userIds.map((id) => (id === me.id ? "You" : indexes(state).users.get(id)?.name ?? "Someone")).join(", ");
            return (
              <button
                key={r.emoji}
                type="button"
                title={names}
                onClick={() => toggleReaction(comment.id, r.emoji)}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs font-medium transition",
                  reacted ? "border-primary/30 bg-primary-light text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="text-sm leading-none">{r.emoji}</span> {r.userIds.length}
              </button>
            );
          })}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Add reaction"
                className="grid size-7 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <SmilePlus className="size-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="flex gap-0.5 p-1.5">
              {EMOJIS.slice(0, 8).map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => toggleReaction(comment.id, emoji)}
                  className="grid size-8 place-items-center rounded-md text-lg transition hover:scale-110 hover:bg-muted"
                >
                  {emoji}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          {!isReply && (
            <button
              type="button"
              onClick={() => setReplying((v) => !v)}
              className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Reply className="size-3.5" /> Reply
            </button>
          )}
        </div>

        {replying && (
          <CommentComposer
            className="mt-3"
            projectId={comment.projectId}
            taskId={comment.taskId}
            parentId={comment.id}
            placeholder={`Reply to ${author?.name.split(" ")[0] ?? "comment"}…`}
            autoFocus
            showAvatar={false}
            onPosted={() => setReplying(false)}
            onCancel={() => setReplying(false)}
          />
        )}
      </div>
    </article>
  );
}
