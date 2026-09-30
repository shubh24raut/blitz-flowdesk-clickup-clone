"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CommandSearch } from "@/components/layout/command-search";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { TaskDrawer } from "@/components/tasks/task-drawer";
import { TaskFormDialog, type TaskFormDefaults } from "@/components/tasks/task-form-dialog";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import type { ID } from "@/types";

interface UIContextValue {
  activeTaskId: ID | null;
  openTask: (id: ID) => void;
  closeTask: () => void;
  openCreateTask: (defaults?: TaskFormDefaults) => void;
  openCreateProject: () => void;
  openCreateWorkspace: () => void;
  openSearch: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}

/** Opens the task drawer for `?task=<id>` links (notifications, copied links) and then cleans the URL. */
function TaskLinkListener({ onTask }: { onTask: (id: ID) => void }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const taskParam = params.get("task");
  useEffect(() => {
    if (!taskParam) return;
    onTask(taskParam);
    router.replace(pathname, { scroll: false });
  }, [taskParam, onTask, router, pathname]);
  return null;
}

/**
 * App-wide overlays (task drawer, create dialogs, search) are mounted once here
 * so any screen — dashboard, calendar, board — can open them.
 */
export function UIProvider({ children }: { children: ReactNode }) {
  const [activeTaskId, setActiveTaskId] = useState<ID | null>(null);
  const [taskDefaults, setTaskDefaults] = useState<TaskFormDefaults | null>(null);
  const [projectOpen, setProjectOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const openTask = useCallback((id: ID) => setActiveTaskId(id), []);
  const closeTask = useCallback(() => setActiveTaskId(null), []);
  const openCreateTask = useCallback((defaults: TaskFormDefaults = {}) => setTaskDefaults(defaults), []);
  const openCreateProject = useCallback(() => setProjectOpen(true), []);
  const openCreateWorkspace = useCallback(() => setWorkspaceOpen(true), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(
    () => ({ activeTaskId, openTask, closeTask, openCreateTask, openCreateProject, openCreateWorkspace, openSearch }),
    [activeTaskId, openTask, closeTask, openCreateTask, openCreateProject, openCreateWorkspace, openSearch],
  );

  return (
    <UIContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <TaskLinkListener onTask={openTask} />
      </Suspense>
      <TaskDrawer taskId={activeTaskId} onClose={closeTask} />
      <TaskFormDialog
        open={taskDefaults !== null}
        defaults={taskDefaults ?? {}}
        onOpenChange={(open) => !open && setTaskDefaults(null)}
      />
      <ProjectFormDialog open={projectOpen} onOpenChange={setProjectOpen} />
      <CreateWorkspaceDialog open={workspaceOpen} onOpenChange={setWorkspaceOpen} />
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </UIContext.Provider>
  );
}
