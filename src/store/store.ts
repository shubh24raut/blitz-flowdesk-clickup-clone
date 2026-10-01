import { createInitialState, STATE_VERSION } from "@/store/initial-state";
import type { AppState } from "@/types";

/**
 * Minimal external store backing the mock data layer.
 *
 * UI components read state through the hooks in `./hooks` and never write to
 * it directly — every mutation goes through an action function in
 * `src/store/actions`, so swapping this module for real API calls later only
 * touches the action layer.
 */

const STORAGE_KEY = "flowdesk:state";
export const THEME_STORAGE_KEY = "flowdesk:theme";

type Listener = () => void;

const listeners = new Set<Listener>();
let serverState: AppState | null = null;
let state: AppState | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let quotaWarned = false;

/** Object URLs die with the page, so drop them when restoring from storage. */
function sanitize(loaded: AppState): AppState {
  return {
    ...loaded,
    attachments: loaded.attachments.map((a) =>
      a.url?.startsWith("blob:") ? { ...a, url: null } : a,
    ),
  };
}

function load(): AppState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as AppState;
      // Older saves (including the removed demo data) are discarded.
      if (saved.version === STATE_VERSION) return sanitize(saved);
    }
  } catch {
    // Corrupt or inaccessible storage — start empty.
  }
  return createInitialState();
}

function write() {
  persistTimer = null;
  if (!state) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.localStorage.setItem(THEME_STORAGE_KEY, state.settings.theme);
  } catch (error) {
    if (!quotaWarned) {
      quotaWarned = true;
      console.warn("FlowDesk: local storage is full; recent changes will not survive a reload.", error);
    }
  }
}

/** Writes are debounced, then flushed immediately if the page is being hidden or unloaded. */
function flush() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    write();
  }
}

let flushListenersAttached = false;

function persist() {
  if (typeof window === "undefined" || !state) return;
  if (!flushListenersAttached) {
    flushListenersAttached = true;
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
  }
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(write, 200);
}

export function getState(): AppState {
  if (!state) state = load();
  return state;
}

export function getServerState(): AppState {
  if (!serverState) serverState = createInitialState();
  return serverState;
}

function emit() {
  for (const listener of listeners) listener();
}

export function setState(updater: (current: AppState) => AppState) {
  state = updater(getState());
  persist();
  emit();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

/** Keeps multiple tabs in sync. */
function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  state = load();
  emit();
}

/** Persists immediately — used for session changes that must survive an instant reload. */
export function flushPersistence() {
  flush();
}
