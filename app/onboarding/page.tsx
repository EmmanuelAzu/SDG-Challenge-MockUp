'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { OnboardingFlow } from '@/components/onboarding-flow';
import { useMe } from '@/lib/world/hooks';

function Inner() {
  const slug = useSearchParams().get('community');
  const { w, me } = useMe()!;
  const preset = w.communities.find((c) => c.slug === slug)?.id ?? null;
  return <OnboardingFlow communities={w.communities} presetCommunity={preset} defaultName={me.displayName} />;
}
export default function Onboarding() { return <Suspense><Inner /></Suspense>; }
