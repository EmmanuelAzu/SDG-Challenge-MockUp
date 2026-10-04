/**
 * Pilot instruments: every question the pilot asks, with where it comes from.
 * Draft instruments: item quality (difficulty, discrimination) is checked on pilot data. See docs/PILOT.md.
 * Knowledge items are source-checked against the PPS Money Matters facilitator guide, booklet and slides.
 */

export type Form = 'A' | 'B';
export type KItem = {
  id: string;
  concept: string;
  outcome: string; // learning outcome it evidences
  taughtIn: string; // where in the 10-minute path it is taught
  source: string; // where the correct answer comes from
  forms: Record<Form, { prompt: string; options: string[]; correct: number }>;
};

export const KNOWLEDGE: KItem[] = [
  {
    id: 'k1', concept: 'Match a goal to spend, save or grow', outcome: 'Tell spending, saving and growing wealth apart', taughtIn: 'Lesson: Now-Now, Stack It, Grow It',
    source: 'Facilitator guide §4 / booklet “Spending, saving & growing your wealth”: Now-Now 0–12 months, Stack It short–medium term, Grow It 5+ years',
    forms: {
      A: { prompt: 'You need money for something in about 6 months. Which fits best?', options: ['Spend it as soon as you get it', 'Save it in an easy-access savings account', 'Put all of it in shares', 'Lock it away for 10 years'], correct: 1 },
      B: { prompt: 'You are building money for a goal that is 10 years or more away. Which usually fits best?', options: ['Keep it as cash at home', 'Spend it now', 'Invest it for long-term growth', 'Put it in a 3-month savings account only'], correct: 2 },
    },
  },
  {
    id: 'k2', concept: 'The cost of borrowing', outcome: 'Understand how saving avoids interest on debt', taughtIn: 'Lesson: Now-Now, Stack It, Grow It (laptop example)',
    source: 'Facilitator guide §4 laptop example: R1,500 at 15% over 12 months = R1,725 (interest added to the price)',
    forms: {
      A: { prompt: 'You buy a R1,000 jacket on credit. The shop adds 10% interest and you repay over 12 months. Roughly what do you repay in total?', options: ['R1,000', 'R1,010', 'R1,100', 'R1,200'], correct: 2 },
      B: { prompt: 'You borrow R2,000 for a phone. The lender adds 20% interest, repaid over 12 months. What do you repay in total?', options: ['R2,020', 'R2,200', 'R2,400', 'R4,000'], correct: 2 },
    },
  },
  {
    id: 'k3', concept: 'What an emergency fund is for', outcome: 'Understand saving for the unexpected', taughtIn: 'Lesson: Now-Now, Stack It, Grow It (Stack It card)',
    source: 'Booklet “Emergency fund”: money stacked for life surprises such as medical bills, broken laptops, school fees',
    forms: {
      A: { prompt: 'What is an emergency fund mainly for?', options: ['A holiday you have planned', 'Unexpected, necessary costs, like a broken phone you need for study', 'Buying shares', 'Birthday gifts'], correct: 1 },
      B: { prompt: 'Which of these is a good reason to use your emergency fund?', options: ['A sale on sneakers', 'A friend’s weekend trip', 'Your laptop breaks and you need it for work or study', 'A new game release'], correct: 2 },
    },
  },
  {
    id: 'k4', concept: 'Needs versus wants', outcome: 'Build a budget by separating needs and wants', taughtIn: 'Mission: Budget builder (workshop scenario)',
    source: 'Facilitator guide §9: needs = rent, food, transport, electricity; wants = entertainment, fashion, fast food',
    forms: {
      A: { prompt: 'Which of these is a want rather than a need?', options: ['Rent', 'Groceries', 'A streaming subscription', 'Transport to campus or work'], correct: 2 },
      B: { prompt: 'Which of these is a need rather than a want?', options: ['Takeaways', 'New sneakers', 'Concert tickets', 'Rent'], correct: 3 },
    },
  },
  {
    id: 'k5', concept: 'Income minus spending', outcome: 'Know whether a budget leaves room to save', taughtIn: 'Mission: Budget builder (workshop scenario)',
    source: 'Facilitator guide §9 scenario: R3,500 income vs R3,600 expenses = R100 short with no savings',
    forms: {
      A: { prompt: 'You receive R2,500 a month and spend R2,700. What is true?', options: ['You have R200 left over', 'You are R200 short, so you must cut spending, borrow or use savings', 'You are exactly on budget', 'You have saved R2,700'], correct: 1 },
      B: { prompt: 'You receive R4,000 a month and spend R3,750. What is true?', options: ['You are R250 short', 'You are exactly on budget', 'You have R250 left over that you could save', 'You have R7,750'], correct: 2 },
    },
  },
  {
    id: 'k6', concept: 'A SMART money goal', outcome: 'Set specific, measurable, time-bound goals', taughtIn: 'Lesson: Now-Now, Stack It, Grow It (SMART card)',
    source: 'Facilitator guide §7 and booklet “Setting SMART goals”: weak “save some money” vs strong “save R3,000 in 6 months for a laptop”',
    forms: {
      A: { prompt: 'Which is the strongest money goal?', options: ['Spend less', 'Put R200 a month aside for 9 months to pay my R1,800 course fee', 'Try to save', 'Have money'], correct: 1 },
      B: { prompt: 'Which is the strongest money goal?', options: ['Save some money', 'Be careful with money', 'Save R1,500 over 5 months, R300 a month, for a phone', 'Be better with money'], correct: 2 },
    },
  },
];

export const NOT_SURE = -1;

/** Self-efficacy items (1 = not at all, 5 = completely). Wording matches the Sisi check-in so results can be compared. */
export const CONFIDENCE = [
  'I feel confident making everyday money decisions.',
  'I could build a monthly budget and stick to it.',
  'I know how to start saving for an emergency.',
];

/** Single Ease Question (Sauro): 1 = very difficult, 7 = very easy. Asked once after each mission. */
export const SEQ_PROMPT = 'Overall, how easy or difficult was that?';

/** UMUX-Lite (Lewis et al., 2013), 7-point agree/disagree, wording adapted to Sisi. */
export const UMUX = ['Sisi has the features I need to learn about money.', 'Sisi is easy to use.'];

export const NPS_PROMPT = 'How likely are you to recommend Sisi to a friend?';
export const SAFETY_PROMPT = 'I felt comfortable taking part in the community.';

export const UNDERSTOOD = {
  prompt: 'Which best describes Sisi?',
  options: ['Education about money, not personal financial advice', 'Personal financial advice', 'A bank', 'A loan provider'],
  correct: 0,
};

export const USEFUL = ['The lesson', 'The budget tool', 'The community', 'None of them'];
export const AGAIN: { id: 'yes' | 'maybe' | 'no'; label: string }[] = [{ id: 'yes', label: 'Yes' }, { id: 'maybe', label: 'Maybe' }, { id: 'no', label: 'No' }];

export const PROFILE = {
  ageBand: ['18–20', '21–23', '24–26', 'Other'],
  status: ['Student', 'Working', 'Both', 'Neither'],
  experience: ['New to budgeting', 'Tried it a bit', 'I budget regularly'],
};

/** Day-7 follow-up (behaviour, not just knowledge). */
export const FOLLOW_DID = ['Made or updated a budget', 'Set a savings goal', 'Saved money I would not have saved otherwise', 'Talked about money with someone', 'Opened Sisi again'];

export type MissionDef = {
  id: string; title: string; minutes: number; core: boolean; verb: string;
  steps: string[]; success: string; href: string; auto: boolean; hint?: string;
};

export const MISSIONS: MissionDef[] = [
  { id: 'join', title: 'Join a community', minutes: 1, core: true, verb: 'Joined', href: '/pilot', auto: true,
    steps: ['Pick the community that feels most like you.', 'You are in. That counts as done.'], success: 'You joined a community.' },
  { id: 'learn', title: 'Learn: Now-Now, Stack It, Grow It', minutes: 2, core: true, verb: 'Finished', href: '/learn/money-matters/now-now-stack-it-grow-it', auto: true,
    steps: ['Read the six cards, tapping Next.', 'The quick quiz afterwards is optional. Skip it to stay on time.'], success: 'You finished the lesson.' },
  { id: 'budget', title: 'Fix the R3,500 budget', minutes: 2, core: true, verb: 'Saved', href: '/tools/budget?template=workshop', auto: true,
    hint: 'Needs are essentials like rent, food and transport. Wants are nice-to-haves. Surplus = income − spending.',
    steps: ['You earn R3,500 a month and spend R3,600. You want a R1,500 laptop.', 'Move the sliders so you spend no more than R3,500 and save at least R150 a month (emergency savings or investing).', 'Tap Save my budget.'], success: 'You saved a budget that spends no more than R3,500 and saves at least R150.' },
  { id: 'community', title: 'Say hello in your community', minutes: 1, core: true, verb: 'Posted', href: '/community', auto: true,
    steps: ['Open your community and its Lounge chat.', 'Accept the guidelines, then send one friendly message, or react to a post in Feed.', 'Please do not share personal details.'], success: 'You sent a message or reacted to a post.' },
  { id: 'payslip', title: 'Payslip simulator', minutes: 2, core: false, verb: 'Saved', href: '/tools/payslip', auto: true,
    steps: ['Pick a salary, set your retirement slider and share out the rest.', 'Save the scenario.'], success: 'You saved a payslip scenario.' },
  { id: 'buddy', title: 'Money Buddy', minutes: 1, core: false, verb: 'Started', href: '/pathways/buddy', auto: true,
    steps: ['Try with a practice buddy.', 'Look at this week’s plan and nudge your buddy.'], success: 'You started a pairing.' },
  { id: 'letterbox', title: 'Letterbox (friends)', minutes: 1, core: false, verb: 'Added', href: '/letterbox', auto: true,
    steps: ['Search for a nickname and add a friend, or accept a request.'], success: 'You have a friend in Letterbox.' },
  { id: 'invest', title: 'Invest HER (simulation)', minutes: 2, core: false, verb: 'Started', href: '/pathways/invest-her', auto: true,
    steps: ['Start the guided simulation. No real money is involved.'], success: 'You started the simulation.' },
  { id: 'talk', title: 'Talk to someone', minutes: 1, core: false, verb: 'Asked', href: '/help/talk', auto: true,
    steps: ['Ask a money question to a person.', 'Do not include personal details.'], success: 'You sent a question.' },
  { id: 'support', title: 'Find Support (and Quick exit)', minutes: 1, core: false, verb: 'Opened', href: '/help/support', auto: false,
    steps: ['Open Help, then Support. Spot the Quick exit button.', 'Do not tap the numbers. This page is private and is never tracked.'], success: 'You found the Support page.' },
  { id: 'rewards', title: 'Rewards', minutes: 1, core: false, verb: 'Looked', href: '/rewards', auto: false,
    steps: ['Open Rewards and read how a reward could be earned.'], success: 'You looked at Rewards.' },
];
export const CORE = MISSIONS.filter((m) => m.core);
export const EXTRA = MISSIONS.filter((m) => !m.core);
export const TIME_BUDGET_MIN = 10;

/** Paste the published Google Form link here once it exists (see docs/pilot-form). Empty hides the button. */
export const FEEDBACK_FORM_URL = '';

/** Quick-start communities offered to testers (no approval needed). */
export const QUICK_COMMUNITIES = ['wits', 'uj', 'student-savers', 'first-salary-club', 'invest-curious', 'side-hustle-sisters'];

/** Deterministic hash helpers for assigning forms and shuffling options per participant. */
export const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
export const formFor = (pid: string): Form => (hash(pid) % 2 === 0 ? 'A' : 'B');
export const otherForm = (f: Form): Form => (f === 'A' ? 'B' : 'A');

/** Display order of option indexes: a stable shuffle per participant and item, so position never gives the answer away. */
export function optionOrder(pid: string, itemId: string, stage: string, n: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  let seed = hash(`${pid}:${itemId}:${stage}`) || 1;
  for (let i = n - 1; i > 0; i--) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const j = seed % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}
