import { requireUser } from '@/lib/auth';
import { OnboardingFlow } from '@/components/onboarding-flow';

export const dynamic = 'force-dynamic';

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ community?: string }> }) {
  const { community } = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: communities }, { data: profile }] = await Promise.all([
    supabase.from('communities').select('id,slug,name,kind').order('name'),
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
  ]);
  const preset = (communities ?? []).find((c) => c.slug === community)?.id ?? null;
  return <OnboardingFlow communities={communities ?? []} presetCommunity={preset} defaultName={profile?.display_name ?? ''} />;
}
