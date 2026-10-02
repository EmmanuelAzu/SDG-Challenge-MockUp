import type { CourseContent, RawCourse } from './types';

/** Milestone pathway courses. All figures are illustrative; limits and rules link out to official sources. */
const RAW: RawCourse[] = [
  {
    slug: 'where-your-money-goes', title: 'Where your money goes', topic: 'Budgeting', level: 'Starter', milestone: 'cash-flow-check',
    lessons: [
      {
        slug: 'money-in-money-out', title: 'Money in, money out', durationSec: 170,
        takeaway: 'Cash flow is money in minus money out. Know your number.',
        cards: [
          { title: 'Start with what comes in', body: 'Money can come from an NSFAS allowance, family, a part-time job or a first salary. List every source, even the small ones.' },
          { title: 'Then what goes out', body: 'Fixed costs (rent, transport, data) barely change. Flexible costs (food, airtime, going out) are where you have the most control.' },
          { title: 'Do the maths', body: 'Money in minus money out is your cash flow. Positive means you have room to save. Negative means you are borrowing from next month.' },
          { title: 'No judgement', body: 'A negative number is not a failure. It is information, and knowing it is the first step to changing it.' },
        ],
        quiz: [
          { prompt: 'Which of these is a fixed cost?', options: ['Takeaways on weekends', 'Monthly rent', 'Impulse airtime top-ups', 'Birthday gifts'], correct: 1, explanation: 'Rent is the same every month, so it is fixed.' },
          { prompt: 'Your money out is more than your money in this month. What does that mean?', options: ['You failed at money', 'You are spending from next month or from savings', 'You should stop tracking', 'Nothing to worry about'], correct: 1, explanation: 'It is information, not failure: the gap is being covered by savings or debt.' },
          { prompt: 'Cash flow is…', options: ['Money in minus money out', 'Money in plus savings', 'Salary minus tax only', 'What is left on the 1st'], correct: 0, explanation: 'Cash flow is simply what comes in minus what goes out.' },
        ],
        action: { title: 'List every source of money in a normal month', description: 'Use the Cash-flow check tool or a note on your phone. Nothing is saved on our servers.' },
      },
      {
        slug: 'spot-the-leaks', title: 'Spot the leaks', durationSec: 170,
        takeaway: 'Leaks are usually small, regular and forgotten.',
        cards: [
          { title: 'Small amounts add up', body: 'R35 a day on snacks and drinks is about R1,050 a month. Small, regular spending is easy to miss.' },
          { title: 'Find your leaks', body: 'Open last month’s bank or mobile-money statement. Circle anything you forgot about: subscriptions, data bundles, delivery fees.' },
          { title: 'Fee watch', body: 'Some accounts charge monthly and per-transaction fees. Ask whether a cheaper account suits you; many banks have low-cost or student options.' },
          { title: 'Keep what you love', body: 'The aim is not to cut everything. Protect one or two things you truly enjoy and trim the rest.' },
        ],
        quiz: [
          { prompt: 'R35 a day for 30 days is roughly…', options: ['R350', 'R1,050', 'R3,500', 'R105'], correct: 1, explanation: '35 × 30 = R1,050.' },
          { prompt: 'Best first step to find leaks?', options: ['Stop spending entirely', 'Read last month’s statement', 'Close your bank account', 'Ask a friend to pay'], correct: 1, explanation: 'Your statement shows what really happened.' },
          { prompt: 'A smart approach is to…', options: ['Cut everything fun', 'Protect a couple of things you love and trim the rest', 'Ignore small amounts', 'Only track big purchases'], correct: 1, explanation: 'A plan you can keep beats a plan that feels like punishment.' },
        ],
        action: { title: 'Circle one thing you forgot you were paying for', description: 'Scan last month’s statement. Decide to keep it or cancel it.' },
      },
    ],
  },
  {
    slug: 'your-first-budget', title: 'Your first budget', topic: 'Budgeting', level: 'Starter', milestone: 'first-budget',
    lessons: [
      {
        slug: 'first-payslip', title: 'Your first payslip, decoded', durationSec: 175,
        takeaway: 'Budget with net pay. It is the money you really get.',
        cards: [
          { title: 'Gross is not what you get', body: 'Gross pay is the headline number. Net pay is what lands in your account after deductions.' },
          { title: 'What comes off', body: 'Usually PAYE (income tax), UIF (a small percentage that funds unemployment cover), and sometimes pension or medical aid. Your payslip lists each one.' },
          { title: 'Why it matters', body: 'Budget with net pay, never gross. Plan around the number you actually receive.' },
          { title: 'Check it every month', body: 'Make sure your hours and deductions look right. If something is off, ask HR or payroll early.' },
        ],
        quiz: [
          { prompt: 'Which number should you budget with?', options: ['Gross', 'Net', 'The number in your offer letter', 'Your hopes'], correct: 1, explanation: 'Net is what reaches your account.' },
          { prompt: 'UIF is…', options: ['A loan', 'A small deduction that funds unemployment cover', 'A bank fee', 'A tip'], correct: 1, explanation: 'UIF contributions support unemployment benefits.' },
          { prompt: 'If something on your payslip looks wrong, you should…', options: ['Ignore it', 'Ask HR or payroll early', 'Wait a year', 'Post about it'], correct: 1, explanation: 'Errors are easiest to fix when caught early.' },
        ],
        action: { title: 'Circle gross, net and one deduction', description: 'Use your payslip, or a sample one you find online.' },
      },
      {
        slug: 'budget-50-30-20', title: 'Build a 50/30/20 budget', durationSec: 175,
        takeaway: 'Give every rand a job before the month starts.',
        cards: [
          { title: 'A simple split', body: '50/30/20 is a starting point: about 50% of take-home pay for needs, 30% for wants, 20% for saving and paying off debt.' },
          { title: 'Needs', body: 'Rent or transport, food, data you need for study or work, and minimum debt payments.' },
          { title: 'Wants', body: 'Eating out, new clothes, streaming, outings. Wants matter. They just come second.' },
          { title: 'Make it yours', body: 'With R5,000 take-home, 50/30/20 is R2,500, R1,500 and R1,000. If rent is 65%, adjust to 65/20/15. A plan beats perfection.' },
        ],
        quiz: [
          { prompt: 'In 50/30/20, the 20 is for…', options: ['Wants', 'Saving and debt', 'Needs', 'Gifts'], correct: 1, explanation: '20% goes to saving and paying off debt.' },
          { prompt: 'With R5,000 take-home, “needs” in 50/30/20 is…', options: ['R1,000', 'R1,500', 'R2,500', 'R3,000'], correct: 2, explanation: '50% of R5,000 is R2,500.' },
          { prompt: 'If your rent is more than 50% of your pay, you should…', options: ['Give up', 'Adjust the split to fit your life', 'Stop paying rent', 'Hide it'], correct: 1, explanation: 'The rule is a guide. Adjust it so the plan is realistic.' },
        ],
        action: { title: 'Try your own split in the budget builder', description: 'Open the Budget builder under Money Milestones. Nothing you type is stored.' },
      },
    ],
  },
  {
    slug: 'saving-habit', title: 'Build a saving habit', topic: 'Saving', level: 'Starter', milestone: 'saving-habit',
    lessons: [
      {
        slug: 'emergency-fund', title: 'Why an emergency fund comes first', durationSec: 170,
        takeaway: 'An emergency fund stops surprises from becoming debt.',
        cards: [
          { title: 'Life happens', body: 'A broken phone, a taxi to the clinic, a delayed allowance. An emergency fund is money set aside just for surprises.' },
          { title: 'Start tiny', body: 'Aim for R500 first, then R1,000, then build towards about three months of essential costs. The right number depends on your life.' },
          { title: 'Keep it separate', body: 'Park it where you will not spend it by accident, but where you can reach it within a day or two.' },
          { title: 'Not for sales', body: 'A sale is not an emergency. Use it for things that are urgent, unexpected and necessary.' },
        ],
        quiz: [
          { prompt: 'A good first target is…', options: ['R500', 'R50,000', 'Nothing until you earn more', 'A new phone'], correct: 0, explanation: 'A small first target is easy to reach and builds momentum.' },
          { prompt: 'Which counts as an emergency?', options: ['A shoe sale', 'A sudden, urgent medical or transport cost', 'A concert ticket', 'New earbuds'], correct: 1, explanation: 'Emergencies are urgent, unexpected and necessary.' },
          { prompt: 'Where should the fund live?', options: ['Mixed with spending money', 'Separate but reachable', 'Locked away for 10 years', 'Under the mattress'], correct: 1, explanation: 'Separate keeps it safe, reachable keeps it useful.' },
        ],
        action: { title: 'Pick your first emergency-fund target', description: 'Choose an amount and decide where you will keep it.' },
      },
      {
        slug: 'pay-yourself-first', title: 'Pay yourself first', durationSec: 165,
        takeaway: 'Move savings first, then spend what is left.',
        cards: [
          { title: 'Flip the order', body: 'Most people save what is left. Paying yourself first means moving savings out as soon as money arrives.' },
          { title: 'Automate it', body: 'Set a monthly transfer for the day after payday, even if it is just R50.' },
          { title: 'Small and steady wins', body: 'R100 a month is R1,200 in a year, and the habit is worth more than the amount.' },
          { title: 'Celebrate', body: 'Watch the number grow. Seeing progress builds confidence.' },
        ],
        quiz: [
          { prompt: 'Paying yourself first means…', options: ['Spend first', 'Move savings out when money arrives', 'Pay friends first', 'Never spend'], correct: 1, explanation: 'Savings first, spending second.' },
          { prompt: 'R100 a month for a year is…', options: ['R100', 'R600', 'R1,200', 'R12,000'], correct: 2, explanation: '100 × 12 = R1,200.' },
          { prompt: 'What helps the habit most?', options: ['Remembering at month-end', 'Automating a transfer', 'Waiting for a bonus', 'Guessing'], correct: 1, explanation: 'Automation removes the need for willpower.' },
        ],
        action: { title: 'Set up a small automatic transfer', description: 'Even R50 counts. If you cannot automate it yet, schedule a reminder for payday.' },
      },
    ],
  },
  {
    slug: 'investing-readiness', title: 'Ready to invest', topic: 'Investing', level: 'Starter', milestone: 'investing-readiness',
    lessons: [
      {
        slug: 'why-start-small', title: 'Why start small', durationSec: 175,
        takeaway: 'Start small, stay long, and only invest money you will not need soon.',
        cards: [
          { title: '“Investing is for later”', body: 'Many young women think investing needs lots of money. Many providers let you start with a small monthly amount. Check each one’s minimum.' },
          { title: 'Time is your edge', body: 'The earlier you start, the longer your money has to grow, even with a small amount.' },
          { title: 'Risk is real', body: 'Investments go up and down. Money you may need soon belongs in savings, not investments.' },
          { title: 'Ready checklist', body: 'An emergency fund started, no expensive debt such as store cards or loan sharks, and money you will not need for five years or more.' },
        ],
        quiz: [
          { prompt: 'Money you need next month should go…', options: ['Into investments', 'Into savings', 'Into shares', 'To a friend'], correct: 1, explanation: 'Short-term money should be easy to reach and not at risk.' },
          { prompt: 'What helps investing most?', options: ['A large amount', 'Time', 'Luck', 'Tips from social media'], correct: 1, explanation: 'Time gives growth room to compound.' },
          { prompt: 'A sign you may be ready is…', options: ['An emergency fund started', 'A hot tip', 'Owing a lot on store cards', 'Fear of missing out'], correct: 0, explanation: 'A safety net comes before investing.' },
        ],
        action: { title: 'Check your own readiness', description: 'Do you have an emergency fund started? Expensive debt? Money you will not need for 5+ years? Note your answers.' },
      },
      {
        slug: 'tfsa-plain-words', title: 'Tax-free savings, in plain words', durationSec: 175,
        takeaway: 'A TFSA is a tax-free container. Check current SARS limits and fees.',
        cards: [
          { title: 'What it is', body: 'A tax-free savings account (TFSA) means the growth, interest and dividends inside it are tax-free. Many banks and investment companies offer one.' },
          { title: 'Limits apply', body: 'SARS sets yearly and lifetime contribution limits. Always check the current limits on the SARS website before you contribute.' },
          { title: 'Watch the penalty', body: 'Going over the limits means a tax penalty, so keep track of what you have put in across all your TFSAs.' },
          { title: 'It is a container', body: 'A TFSA is the wrapper. What goes inside (savings, unit trusts) is your choice, and fees and returns vary.' },
        ],
        quiz: [
          { prompt: 'In a TFSA, growth is…', options: ['Taxed double', 'Tax-free', 'Illegal', 'Guaranteed'], correct: 1, explanation: 'That is the point of a TFSA. Returns themselves are never guaranteed.' },
          { prompt: 'Where do you check contribution limits?', options: ['A friend', 'The SARS website', 'Social media', 'Guess'], correct: 1, explanation: 'Limits change, so go to the source.' },
          { prompt: 'A TFSA is best described as…', options: ['A fixed-return product', 'A tax-free container for savings or investments', 'A loan', 'A bank card'], correct: 1, explanation: 'It is a wrapper, not a specific investment.' },
        ],
        action: { title: 'Compare two TFSA providers’ fees', description: 'Look at two providers’ websites. No sign-up needed. Note the yearly fees.' },
      },
    ],
  },
  {
    slug: 'wealth-milestone', title: 'Grow your wealth', topic: 'Building wealth', level: 'Next step', milestone: 'wealth-milestone',
    lessons: [
      {
        slug: 'compound-growth', title: 'Compound growth in 3 minutes', durationSec: 175,
        takeaway: 'Time and consistency do the heavy lifting.',
        cards: [
          { title: 'Growth on growth', body: 'Compound growth means you earn returns on your original money and on earlier returns.' },
          { title: 'An illustration', body: 'R200 a month for 10 years is R24,000 put in. At an illustrative 8% a year it could grow to about R36,500. This is an illustration, not a forecast.' },
          { title: 'Time beats timing', body: 'Waiting five years to start can cost far more than waiting for the “perfect” moment.' },
          { title: 'No promises', body: 'Real returns vary and can be negative in some years. That is why simulations are always labelled.' },
        ],
        quiz: [
          { prompt: 'Compound growth means…', options: ['Returns only on your first deposit', 'Returns on your money and on past returns', 'A bank fee', 'Guaranteed profit'], correct: 1, explanation: 'Earlier returns also earn returns.' },
          { prompt: 'What matters most for compounding?', options: ['Time', 'Luck', 'A hot tip', 'Trading daily'], correct: 0, explanation: 'The longer money is invested, the more it compounds.' },
          { prompt: 'Illustrative returns are…', options: ['Guaranteed', 'Not a forecast', 'Always 8%', 'Promised by PPS'], correct: 1, explanation: 'They show how growth works. They do not predict it.' },
        ],
        action: { title: 'Pick a monthly amount you could imagine investing', description: 'Choose a number between R50 and R500 and a number of years. Note it down.' },
      },
      {
        slug: 'fees-quiet-thief', title: 'Fees: the quiet thief', durationSec: 170,
        takeaway: 'Know your total yearly fee before you invest.',
        cards: [
          { title: 'Fees compound too', body: 'A 1% yearly fee sounds small, but over decades it can cost a large part of your growth.' },
          { title: 'Where fees hide', body: 'Product fees, platform fees, advice fees and fund fees (often shown as a TER, total expense ratio).' },
          { title: 'Ask three questions', body: 'What do I pay in total each year? Is there a minimum? Can I stop or change at any time?' },
          { title: 'Compare like with like', body: 'Cheaper is not always better, but you should always know what you are paying.' },
        ],
        quiz: [
          { prompt: 'TER stands for…', options: ['Total expense ratio', 'Tax on earnings return', 'Time of entry rate', 'Trade exchange rule'], correct: 0, explanation: 'It shows the yearly running cost of a fund.' },
          { prompt: 'Over decades, a 1% yearly fee…', options: ['Does not matter', 'Can reduce your growth a lot', 'Is illegal', 'Is always worth it'], correct: 1, explanation: 'Fees compound against you.' },
          { prompt: 'A good question to ask a provider is…', options: ['What do I pay in total yearly?', 'What colour is the app?', 'Who else joined?', 'Can I get a guarantee?'], correct: 0, explanation: 'Total yearly cost is the number that matters.' },
        ],
        action: { title: 'Write down the three fee questions', description: 'Keep them handy to ask any provider.' },
      },
    ],
  },
];

const FSCA = { title: 'FSCA: consumer education', url: 'https://www.fsca.co.za/' };
const SARS = { title: 'SARS: tax information', url: 'https://www.sars.gov.za/' };
const TREASURY = { title: 'National Treasury', url: 'https://www.treasury.gov.za/' };

/** Credibility: sources per lesson. Reviews are never invented; a lesson shows "Review pending" until a real review is added in the console. */
const SOURCES: Record<string, { title: string; url?: string }[]> = {
  'money-in-money-out': [TREASURY],
  'spot-the-leaks': [{ title: 'Banking Association South Africa', url: 'https://www.banking.org.za/' }],
  'first-payslip': [SARS, { title: 'Department of Employment and Labour: UIF', url: 'https://www.labour.gov.za/' }],
  'budget-50-30-20': [TREASURY],
  'emergency-fund': [FSCA],
  'pay-yourself-first': [FSCA],
  'why-start-small': [FSCA, { title: 'National Credit Regulator', url: 'https://www.ncr.org.za/' }],
  'tfsa-plain-words': [SARS, TREASURY],
  'compound-growth': [FSCA],
  'fees-quiet-thief': [FSCA],
};

/** Hook-first openers: the first card must earn the next 30 seconds. */
const HOOKS: Record<string, { title: string; body?: string }> = {
  'money-in-money-out': { title: 'Where did your money go last month?', body: 'Most of us cannot say, and that is okay. It starts with what comes in: an NSFAS allowance, family, a part-time job or a first salary. List every source, even the small ones.' },
  'spot-the-leaks': { title: 'R35 a day is R1,050 a month' },
  'first-payslip': { title: 'Your salary is not what you get paid' },
  'budget-50-30-20': { title: 'Give every rand a job' },
  'emergency-fund': { title: 'Your phone screen cracks on the 25th' },
  'pay-yourself-first': { title: 'Stop saving what is left' },
  'why-start-small': { title: 'You do not need a lot to start' },
  'tfsa-plain-words': { title: 'Keep what your savings earn' },
  'compound-growth': { title: 'Money that earns money' },
  'fees-quiet-thief': { title: 'A fee you never see' },
};

/** "If you…, then…" callouts, keyed by lesson slug and card index. */
const CALLOUTS: Record<string, Record<number, string>> = {
  'money-in-money-out': { 2: 'If your money out is higher than your money in, then something has to give: spend less, earn more, or use savings.' },
  'first-payslip': { 2: 'If your net pay is lower than you expected, then check every deduction on your payslip before you panic.' },
  'budget-50-30-20': { 3: 'If your rent is above half of your take-home pay, then shrink wants first and still save something.' },
  'emergency-fund': { 3: 'If it is urgent, unexpected and necessary, then it is an emergency. Otherwise it can wait.' },
  'why-start-small': { 2: 'If you may need the money within a few years, then keep it in savings, not investments.' },
  'tfsa-plain-words': { 3: 'If you open a TFSA, then check the current SARS limits and the provider’s fees first.' },
  'compound-growth': { 3: 'If someone promises a fixed high return with no risk, then treat it as a scam warning.' },
  'fees-quiet-thief': { 2: 'If a provider cannot tell you the total yearly fee, then do not invest with them yet.' },
};

export const COURSES: CourseContent[] = RAW.map((c) => ({
  ...c,
  lessons: c.lessons.map((l) => ({
    ...l,
    sources: SOURCES[l.slug] ?? [],
    cards: l.cards.map((card, i) => ({
      ...card,
      ...(i === 0 && HOOKS[l.slug] ? { title: HOOKS[l.slug].title, body: HOOKS[l.slug].body ?? card.body } : {}),
      ...(CALLOUTS[l.slug]?.[i] ? { callout: CALLOUTS[l.slug][i] } : {}),
    })),
  })),
}));

export const MILESTONES = [
  { slug: 'cash-flow-check', title: 'Cash-flow check', badge: null },
  { slug: 'first-budget', title: 'First budget', badge: 'budget-builder' },
  { slug: 'saving-habit', title: 'Saving habit', badge: null },
  { slug: 'investing-readiness', title: 'Investing readiness', badge: null },
  { slug: 'wealth-milestone', title: 'Wealth milestone', badge: null },
];
