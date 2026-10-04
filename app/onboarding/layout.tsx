import { SessionGate } from '@/components/shell/session-gate';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <SessionGate>{children}</SessionGate>;
}
