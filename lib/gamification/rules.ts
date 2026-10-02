export type Stats = {
  onboarded: boolean;
  lessons: number;
  perfectQuizzes: number;
  milestones: string[];
  investDone: boolean;
  streakWeeks: number;
  sessionsAttended: number;
  eventCheckins: number;
  buddyJoint: boolean;
  referrals: number;
  oweekDone: boolean;
  circleCup: boolean;
  campusCup: boolean;
  actionWeeks: number;
  payslipDone: boolean;
  goalReached: boolean;
  glossaryTerms: number;
};

export const MILESTONE_SLUGS = ['cash-flow-check', 'first-budget', 'saving-habit', 'investing-readiness', 'wealth-milestone'] as const;

/** Every badge slug the stats currently qualify for. */
export function qualifyingBadges(s: Stats): string[] {
  const out: string[] = [];
  const add = (cond: boolean, slug: string) => cond && out.push(slug);
  add(s.onboarded, 'started');
  add(s.onboarded, 'founding-member'); // beta: everyone who joins now
  add(s.lessons >= 1, 'first-lesson');
  add(s.lessons >= 10, 'curious-mind');
  add(s.perfectQuizzes >= 5, 'quiz-whiz');
  add(s.milestones.includes('first-budget'), 'budget-builder');
  add(MILESTONE_SLUGS.every((m) => s.milestones.includes(m)), 'wealth-builder');
  add(s.investDone, 'investor-ready');
  add(s.streakWeeks >= 3, 'glow-3w');
  add(s.streakWeeks >= 12, 'bloom-12w');
  add(s.sessionsAttended >= 1, 'circle-starter');
  add(s.sessionsAttended >= 4, 'show-up-sisi');
  add(s.eventCheckins >= 1, 'workshop-goer');
  add(s.buddyJoint, 'better-together');
  add(s.referrals >= 1, 'hype-girl');
  add(s.oweekDone, 'oweek-starter');
  add(s.circleCup, 'circle-cup-champion');
  add(s.campusCup, 'campus-cup-champion');
  add(s.actionWeeks >= 4, 'savings-streak');
  add(s.payslipDone, 'payslip-pro');
  add(s.goalReached, 'goal-getter');
  add(s.glossaryTerms >= 10, 'plain-talker');
  return out;
}
