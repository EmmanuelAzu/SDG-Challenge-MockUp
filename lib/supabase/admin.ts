import { createClient } from '@supabase/supabase-js';
import { fakeClient, previewOn } from '@/lib/preview/fake';

/** Service-role client. Server only; never import from client components. */
export const adminClient = () =>
  previewOn() ? fakeClient() : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
