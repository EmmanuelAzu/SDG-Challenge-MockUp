export type QuizAnswers = {
  source: 'allowance' | 'nsfas' | 'part-time' | 'salary' | 'none';
  goal: 'budget' | 'emergency-fund' | 'save-for-something' | 'investing' | 'first-salary';
  timeframe: 'month' | 'year' | 'longer';
  obligations: 'none' | 'debt' | 'family' | 'both';
  checkins: 1 | 2 | 3;
};
export type TrackSlug = 'student' | 'first-payslip' | 'rent-independence' | 'invest-small';

export const TRACKS: { slug: TrackSlug; name: string; description: string; lessons: string[]; firstPathway: 'milestones' | 'invest-her' }[] = [
  { slug: 'student', name: 'Student life', description: 'Make an allowance or NSFAS money last, and start small habits.', firstPathway: 'milestones',
    lessons: ['money-in-money-out', 'spot-the-leaks', 'budget-50-30-20', 'emergency-fund', 'pay-yourself-first', 'why-start-small'] },
  { slug: 'first-payslip', name: 'First payslip', description: 'Understand your pay, then make it work.', firstPathway: 'milestones',
    lessons: ['first-payslip', 'budget-50-30-20', 'money-in-money-out', 'pay-yourself-first', 'emergency-fund', 'tfsa-plain-words'] },
  { slug: 'rent-independence', name: 'Rent & independence', description: 'Cover your own costs, rent included, without panic.', firstPathway: 'milestones',
    lessons: ['money-in-money-out', 'budget-50-30-20', 'spot-the-leaks', 'emergency-fund', 'pay-yourself-first', 'first-payslip'] },
  { slug: 'invest-small', name: 'Invest small', description: 'A guided, simulated first step into investing with small rand amounts.', firstPathway: 'invest-her',
    lessons: ['why-start-small', 'tfsa-plain-words', 'compound-growth', 'fees-quiet-thief', 'emergency-fund', 'pay-yourself-first'] },
];

/** "Where do I start?" result. Simple, explainable rules; the user can change their track any time. */
export function assignTrack(a: QuizAnswers): { track: TrackSlug; weeklyTarget: 1 | 2 | 3; firstPathway: 'milestones' | 'invest-her' } {
  let track: TrackSlug = 'student';
  if (a.goal === 'investing') track = 'invest-small';
  else if (a.source === 'salary' || a.goal === 'first-salary') track = 'first-payslip';
  else if (a.source === 'part-time' && (a.goal === 'budget' || a.goal === 'emergency-fund' || a.obligations === 'family' || a.obligations === 'both')) track = 'rent-independence';
  const t = TRACKS.find((x) => x.slug === track)!;
  return { track, weeklyTarget: a.checkins, firstPathway: t.firstPathway };
}

export const QUIZ: { key: keyof QuizAnswers; question: string; options: [string | number, string][] }[] = [
  { key: 'source', question: 'Where does your money mostly come from?', options: [['allowance', 'Allowance from family'], ['nsfas', 'NSFAS or a bursary'], ['part-time', 'Part-time work'], ['salary', 'A salary'], ['none', 'Nothing yet']] },
  { key: 'goal', question: 'What is your main goal right now?', options: [['budget', 'Make a budget'], ['emergency-fund', 'Build an emergency fund'], ['save-for-something', 'Save for something'], ['investing', 'Start investing'], ['first-salary', 'Prepare for my first salary']] },
  { key: 'timeframe', question: 'When do you want to see a change?', options: [['month', 'This month'], ['year', 'This year'], ['longer', 'Over a longer time']] },
  { key: 'obligations', question: 'Do you have any of these on your plate?', options: [['none', 'None of these'], ['debt', 'Debt I am paying off'], ['family', 'Family I support'], ['both', 'Both']] },
  { key: 'checkins', question: 'How many days a week can you do 3 minutes?', options: [[1, '1 day'], [2, '2 days'], [3, '3 days']] },
];
