import { adminClient } from '@/lib/supabase/admin';

/** Fire-and-forget product analytics. Never call from /help/support. */
export async function track(userId: string | null, name: string, props: Record<string, unknown> = {}) {
  try {
    await adminClient().from('analytics_events').insert({ user_id: userId, name, props });
  } catch {
    /* analytics must never break a user action */
  }
}
