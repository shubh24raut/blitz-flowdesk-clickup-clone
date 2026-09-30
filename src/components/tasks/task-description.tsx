"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MarkdownEditor } from "@/components/shared/markdown-editor";
import { RichText } from "@/components/shared/rich-text";
import { Button } from "@/components/ui/button";
import { updateTask } from "@/store/actions/tasks";
import type { Task } from "@/types";

export function TaskDescription({ task, mentionNames }: { task: Task; mentionNames: string[] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.description);

  function save() {
    updateTask(task.id, { description: draft.trim() });
    setEditing(false);
    toast.success("Description updated");
  }

  return (
    <section aria-labelledby="description-heading">
      <div className="flex items-center justify-between">
        <h3 id="description-heading" className="text-[15px] font-semibold">
          Description
        </h3>
        {!editing && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setDraft(task.description);
              setEditing(true);
            }}
          >
            <Pencil className="size-3.5" /> Edit
          </Button>
        )}
      </div>
      {editing ? (
        <div className="mt-3 space-y-2">
          <MarkdownEditor
            value={draft}
            onChange={setDraft}
            autoFocus
            rows={7}
            placeholder="Add more detail — use - for bullet points, **bold**, @mentions…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
              if (e.key === "Escape") {
                e.stopPropagation();
                setEditing(false);
              }
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="hidden text-xs text-subtle sm:block">Ctrl + Enter to save · Esc to cancel</p>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={save}>
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : task.description ? (
        <RichText text={task.description} mentionNames={mentionNames} className="mt-2" />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 w-full rounded-xl border border-dashed border-border px-4 py-4 text-left text-sm text-subtle hover:bg-muted"
        >
          Add a description…
        </button>
      )}
    </section>
  );
}
