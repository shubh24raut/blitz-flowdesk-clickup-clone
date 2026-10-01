import { resolveActiveOrganizationId } from "@/store/organization";
import { setState } from "@/store/store";
import type { ID, NotificationPreferences, Settings } from "@/types";

/** Organization edits live in `./organizations`; re-exported for existing imports. */
export { updateOrganization } from "./organizations";

export function updateSettings(patch: Partial<Omit<Settings, "notifications">>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function updateNotificationPreferences(patch: Partial<NotificationPreferences>) {
  setState((s) => ({
    ...s,
    settings: { ...s.settings, notifications: { ...s.settings.notifications, ...patch } },
  }));
}

export function markNotificationRead(id: ID) {
  setState((s) => ({
    ...s,
    notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
  }));
}

/** Only touches the active organization's notifications. */
export function markAllNotificationsRead() {
  setState((s) => {
    const orgId = resolveActiveOrganizationId(s);
    return { ...s, notifications: s.notifications.map((n) => (n.organizationId === orgId ? { ...n, read: true } : n)) };
  });
}

/** Only clears the active organization's notifications. */
export function clearNotifications() {
  setState((s) => {
    const orgId = resolveActiveOrganizationId(s);
    return { ...s, notifications: s.notifications.filter((n) => n.organizationId !== orgId) };
  });
}

