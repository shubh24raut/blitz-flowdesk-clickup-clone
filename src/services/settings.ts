import { resetState, setState } from "@/store/store";
import type { ID, NotificationPreferences, Organization, Settings } from "@/types";

export function updateSettings(patch: Partial<Omit<Settings, "notifications">>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function updateNotificationPreferences(patch: Partial<NotificationPreferences>) {
  setState((s) => ({
    ...s,
    settings: { ...s.settings, notifications: { ...s.settings.notifications, ...patch } },
  }));
}

export function updateOrganization(patch: Partial<Omit<Organization, "id">>) {
  setState((s) => ({ ...s, organization: { ...s.organization, ...patch } }));
}

export function markNotificationRead(id: ID) {
  setState((s) => ({
    ...s,
    notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
  }));
}

export function markAllNotificationsRead() {
  setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
}

export function clearNotifications() {
  setState((s) => ({ ...s, notifications: [] }));
}

export function resetDemoData() {
  resetState();
}
