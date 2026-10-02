export const POINTS = {
  lesson: 10,
  quiz: 5,
  action: 15,
  session: 25,
  event: 30,
  weekly_target: 25,
  challenge: 20,
  buddy: 20,
  feedback: 5, // lesson rating or topic suggestion, max FEEDBACK_PER_WEEK awards a week
  onboarding: 10,
} as const;
export type PointSource = keyof typeof POINTS;
export const FEEDBACK_PER_WEEK = 5;
/** Sharing never earns points (evidence: only 1 of 10 motivated by share rewards). */

/** Sources that do not count as an "active day" toward the weekly target. */
export const NON_ACTIVITY_SOURCES = ['weekly_target', 'onboarding', 'feedback'] as const;
