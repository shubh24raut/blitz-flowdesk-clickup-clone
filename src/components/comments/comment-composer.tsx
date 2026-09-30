/* eslint-disable @next/next/no-img-element -- pending image previews are object URLs */
"use client";

import { ImageIcon, Paperclip, SendHorizontal, Smile, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { acceptFiles, MAX_FILE_SIZE } from "@/components/attachments/file-dropzone";
import { UserAvatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { cn, formatBytes } from "@/lib/utils";
import { addComment } from "@/store/actions/comments";
import { useWorkspace, useCurrentUser } from "@/store/hooks";
import type { ID } from "@/types";

export const EMOJIS = ["👍", "❤️", "🎉", "😄", "🚀", "👀", "🔥", "✅", "🙏", "💯", "🤔", "😅", "👏", "✨", "🐛", "📌"];

interface PendingFile {
  file: File;
  preview: string | null;
}

export function CommentComposer({
  projectId,
  taskId,
  parentId = null,
  placeholder = "Write a comment…",
  autoFocus,
  onPosted,
  onCancel,
  showAvatar = true,
  className,
}: {
  projectId: ID;
  taskId: ID | null;
  parentId?: ID | null;
  placeholder?: string;
  autoFocus?: boolean;
  onPosted?: () => void;
  onCancel?: () => void;
  showAvatar?: boolean;
  className?: string;
}) {
  const me = useCurrentUser();
  const state = useWorkspace();
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [posting, setPosting] = useState(false);
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);

  const project = state.projects.find((p) => p.id === projectId);
  const mentionable = useMemo(() => {
    const members = state.users.filter((u) => u.id !== me.id);
    const inProject = project ? members.filter((u) => project.memberIds.includes(u.id)) : members;
    const rest = members.filter((u) => !inProject.includes(u));
    return [...inProject, ...rest];
  }, [state.users, me.id, project]);
  const suggestions = mention
    ? mentionable.filter((u) => u.name.toLowerCase().includes(mention.query.toLowerCase())).slice(0, 6)
    : [];

  // Revoke preview URLs when files are removed or the composer unmounts.
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(() => () => filesRef.current.forEach((f) => f.preview && URL.revokeObjectURL(f.preview)), []);

  function insertAtCursor(text: string, replaceFrom?: number) {
    const el = textRef.current;
    const caret = el?.selectionStart ?? body.length;
    const start = replaceFrom ?? caret;
    const next = body.slice(0, start) + text + body.slice(caret);
    setBody(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = start + text.length;
      el?.setSelectionRange(pos, pos);
    });
  }

  function onChange(value: string) {
    setBody(value);
    const caret = textRef.current?.selectionStart ?? value.length;
    const match = /(^|\s)@([\w]*)$/.exec(value.slice(0, caret));
    if (match) {
      setMention({ query: match[2], start: caret - match[2].length - 1 });
      setMentionIndex(0);
    } else setMention(null);
  }

  function pickMention(name: string) {
    if (!mention) return;
    insertAtCursor(`@${name} `, mention.start);
    setMention(null);
  }

  function addFiles(list: FileList | null) {
    const { accepted, rejected } = acceptFiles(list);
    if (rejected) toast.error(`Files must be under ${MAX_FILE_SIZE / 1024 / 1024} MB`);
    setFiles((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      })),
    ]);
  }

  async function post() {
    if (!body.trim() && files.length === 0) return;
    setPosting(true);
    try {
      await addComment({
        projectId,
        taskId,
        parentId,
        body: body.trim() || (files.length === 1 ? `Shared ${files[0].file.name}` : `Shared ${files.length} files`),
        files: files.map((f) => f.file),
      });
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
      setBody("");
      setFiles([]);
      onPosted?.();
    } catch {
      toast.error("Could not post comment");
    } finally {
      setPosting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mention && suggestions.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pickMention(suggestions[mentionIndex].name);
        return;
      }
      if (e.key === "Escape") {
        e.stopPropagation();
        setMention(null);
        return;
      }
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      post();
    }
    if (e.key === "Escape" && onCancel) {
      e.stopPropagation();
      onCancel();
    }
  }

  const iconButton = "grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground";

  return (
    <div className={cn("flex items-start gap-3", className)}>
      {showAvatar && <UserAvatar user={me} size="md" className="mt-1 hidden size-9 sm:inline-grid" />}
      <div className="relative min-w-0 flex-1">
        <div className="rounded-xl border border-input bg-card shadow-card transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
          <textarea
            ref={textRef}
            value={body}
            autoFocus={autoFocus}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => setTimeout(() => setMention(null), 150)}
            placeholder={placeholder}
            aria-label={placeholder}
            rows={1}
            className="block max-h-40 min-h-11 w-full resize-none bg-transparent px-3.5 py-3 text-sm outline-none field-sizing-content placeholder:text-subtle"
          />
          {files.length > 0 && (
            <ul className="flex flex-wrap gap-2 px-3 pb-2">
              {files.map((f, i) => (
                <li key={`${f.file.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-border bg-muted py-1 pl-1 pr-2 text-xs">
                  {f.preview ? (
                    <img src={f.preview} alt="" className="size-7 rounded object-cover" />
                  ) : (
                    <Paperclip className="ml-1 size-3.5 text-muted-foreground" />
                  )}
                  <span className="max-w-32 truncate font-medium">{f.file.name}</span>
                  <span className="text-muted-foreground">{formatBytes(f.file.size)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.file.name}`}
                    onClick={() => {
                      if (f.preview) URL.revokeObjectURL(f.preview);
                      setFiles((prev) => prev.filter((_, j) => j !== i));
                    }}
                    className="rounded p-0.5 hover:bg-card"
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-0.5 border-t border-border px-2 py-1.5">
            <Popover>
              <Tooltip content="Emoji">
                <PopoverTrigger asChild>
                  <button type="button" aria-label="Insert emoji" className={iconButton}>
                    <Smile className="size-4" />
                  </button>
                </PopoverTrigger>
              </Tooltip>
              <PopoverContent className="grid w-64 grid-cols-8 gap-1 p-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertAtCursor(emoji)}
                    className="grid size-7 place-items-center rounded-md text-lg hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
            <Tooltip content="Mention someone">
              <button type="button" aria-label="Mention someone" className={iconButton} onMouseDown={(e) => e.preventDefault()} onClick={() => {
                const needsSpace = body.length > 0 && !/\s$/.test(body);
                insertAtCursor(needsSpace ? " @" : "@");
                setMention({ query: "", start: (textRef.current?.selectionStart ?? body.length) + (needsSpace ? 1 : 0) });
              }}>
                <span className="text-sm font-semibold">@</span>
              </button>
            </Tooltip>
            <Tooltip content="Attach file">
              <button type="button" aria-label="Attach file" className={iconButton} onClick={() => fileRef.current?.click()}>
                <Paperclip className="size-4" />
              </button>
            </Tooltip>
            <Tooltip content="Add image or video">
              <button type="button" aria-label="Add image or video" className={iconButton} onClick={() => mediaRef.current?.click()}>
                <ImageIcon className="size-4" />
              </button>
            </Tooltip>
            <input ref={fileRef} type="file" multiple className="sr-only" tabIndex={-1} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            <input ref={mediaRef} type="file" multiple accept="image/*,video/*" className="sr-only" tabIndex={-1} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            <div className="ml-auto flex items-center gap-2">
              {onCancel && (
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button size="sm" onClick={post} loading={posting} disabled={!body.trim() && files.length === 0}>
                {!posting && <SendHorizontal className="size-3.5" />}
                {parentId ? "Reply" : "Post"}
              </Button>
            </div>
          </div>
        </div>

        {mention && suggestions.length > 0 && (
          <ul
            role="listbox"
            aria-label="Mention suggestions"
            className="absolute bottom-full left-0 z-20 mb-1 w-64 rounded-xl border border-border bg-popover p-1 shadow-overlay"
          >
            {suggestions.map((u, i) => (
              <li key={u.id} role="option" aria-selected={i === mentionIndex}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickMention(u.name)}
                  className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm", i === mentionIndex && "bg-muted")}
                >
                  <UserAvatar user={u} size="sm" />
                  <span className="flex-1 truncate font-medium">{u.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{u.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
