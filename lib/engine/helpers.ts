import type { Notification, World, AnalyticsEvent } from '@/lib/world/types';

let seq = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Adds a notification; a repeated `key` for the same user is ignored (idempotent). */
export function notify(w: World, userId: string, n: Pick<Notification, 'kind' | 'title' | 'body' | 'href'> & { key?: string }, now: Date) {
  if (n.key && w.notifications.some((x) => x.userId === userId && x.key === n.key)) return false;
  w.notifications.push({ id: uid('n'), userId, read: false, at: now.toISOString(), ...n });
  return true;
}

export function track(w: World, userId: string, name: string, props: AnalyticsEvent['props'], now: Date) {
  w.analytics.push({ id: uid('e'), userId, name, props, at: now.toISOString() });
}

export const firstName = (displayName: string) => displayName.split(' ')[0] || displayName;
