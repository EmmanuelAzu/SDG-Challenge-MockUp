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
  {
    slug: 'oweek-starter', title: 'O-Week Starter', topic: 'Starting out', level: 'Starter', milestone: null,
    lessons: [
      {
        slug: 'first-month-plan', title: 'Your first-month plan', durationSec: 165,
        takeaway: 'Cover the essentials first, then split what is left. Plan the month before it starts.',
        cards: [
          { title: 'The first month is the hardest', body: 'New place, new routine, and a big first allowance or deposit. Without a plan, it is easy to spend the early weeks as if the money will never run out.' },
          { title: 'Essentials first', body: 'Write down what you must pay: accommodation, transport, food, data. Pay or set these aside first, before anything fun.' },
          { title: 'Split the rest', body: 'What is left is yours to spread across the weeks. Dividing it by the number of weeks gives you a weekly number you can actually check.' },
          { title: 'Keep a small cushion', body: 'Hold back a little for surprises, like a cracked phone screen or a lab fee. Even a small buffer stops one surprise from wrecking your month.' },
        ],
        quiz: [
          { prompt: 'What do you sort out first in a first-month plan?', options: ['Fun spending', 'Essentials like accommodation, food and transport', 'Gifts', 'Savings you cannot touch'], correct: 1, explanation: 'Essentials are the things you cannot skip, so they come first.' },
          { prompt: 'Why divide what is left into weekly amounts?', options: ['It looks neat', 'It gives you a number you can check as you go', 'Banks require it', 'It lowers prices'], correct: 1, explanation: 'A weekly number is easier to track than a whole month.' },
          { prompt: 'A small cushion is for…', options: ['Treating yourself', 'Surprises', 'Lending to friends', 'Nothing'], correct: 1, explanation: 'A buffer absorbs one-off surprises.' },
        ],
        action: { title: 'Write your essentials and a weekly spending number', description: 'Use a note on your phone or the Budget builder. Nothing leaves this browser.' },
      },
      {
        slug: 'scam-smart', title: 'Scam-smart on campus', durationSec: 165,
        takeaway: 'Real offers do not ask for your PIN, OTP or an upfront fee. Pause before you pay or click.',
        cards: [
          { title: 'Scammers love new students', body: 'Fake bursaries, fake rooms to rent and fake job offers all target people who are new and in a hurry.' },
          { title: 'Common warning signs', body: 'You are asked to pay a fee upfront, to act today, or to share a PIN, password or one-time pin (OTP). Real banks and universities never ask for these.' },
          { title: 'Pause and check', body: 'Before you pay, look up the organisation yourself, not through the link you were sent. Ask someone you trust, like a senior student or your Circle.' },
          { title: 'If it happens', body: 'Tell your bank straight away, keep the messages, and report it. It is not your fault, and speaking up quickly helps.' },
        ],
        quiz: [
          { prompt: 'Who legitimately asks for your OTP?', options: ['Your bank, by SMS', 'A bursary officer', 'Nobody. Never share it', 'A landlord'], correct: 2, explanation: 'An OTP is for you only. Anyone asking for it is a warning sign.' },
          { prompt: 'A room listing asks for a deposit before you can view it. You should…', options: ['Pay quickly so you do not lose it', 'Pause and check it yourself first', 'Send your ID number', 'Share it widely'], correct: 1, explanation: 'Pressure to pay before viewing is a classic scam sign.' },
          { prompt: 'If you think you were scammed, you should…', options: ['Stay quiet', 'Tell your bank straight away', 'Delete all messages', 'Pay again'], correct: 1, explanation: 'Fast reporting gives the bank the best chance to help.' },
        ],
        action: { title: 'Save your bank’s fraud line in your phone', description: 'Find the number on your bank’s official website or card, not from a message.' },
      },
      {
        slug: 'student-accounts', title: 'Student accounts in plain words', durationSec: 165,
        takeaway: 'Compare monthly fees before you choose an account. Cheaper is often fine for a student.',
        cards: [
          { title: 'An account has a price', body: 'Many accounts charge a monthly fee and fees per transaction. These small charges add up over a year.' },
          { title: 'Ask about student options', body: 'Several banks offer low-cost or student accounts. Ask what the monthly fee is, what ATM and card payments cost, and whether there is a fee to withdraw cash.' },
          { title: 'Match the account to you', body: 'If you mostly tap to pay and rarely use cash, the cheapest basic account may be enough. Pick for how you actually spend.' },
          { title: 'Protect your account', body: 'Keep your PIN and app password to yourself, turn on notifications for every transaction, and check your balance weekly.' },
        ],
        quiz: [
          { prompt: 'Which fees should you compare?', options: ['Only the monthly fee', 'Monthly and per-transaction fees', 'Only ATM colours', 'None'], correct: 1, explanation: 'Per-transaction fees can matter as much as the monthly fee.' },
          { prompt: 'A good way to choose an account is…', options: ['Pick what a friend has without checking', 'Match it to how you actually spend', 'Pick the fanciest card', 'Choose at random'], correct: 1, explanation: 'The best account fits your habits and costs the least.' },
          { prompt: 'Transaction notifications help you…', options: ['Spot problems early', 'Earn interest', 'Avoid all fees', 'Skip budgeting'], correct: 0, explanation: 'You see strange activity quickly.' },
        ],
        action: { title: 'Compare two accounts’ monthly fees', description: 'Check two banks’ websites. No sign-up needed.' },
      },
    ],
  },
  {
    slug: 'money-matters', title: 'Money Matters', topic: 'Money basics', level: 'Starter', milestone: null,
    lessons: [
      {
        slug: 'money-words', title: 'Money words that matter', durationSec: 160,
        takeaway: 'A few plain-words definitions make every money decision easier.',
        cards: [
          { title: 'If someone gave you R10,000 today…', body: 'Would you spend it, keep it for a rainy day, or make it grow? There is no wrong answer. It simply shows how you think about money, and financial literacy gives you the tools to choose on purpose.' },
          { title: 'Money in, money out', body: 'Income is the money you earn from work, a business, a bursary or an allowance. Expenses are what you spend it on, like food, transport, rent and airtime.' },
          { title: 'Saving, interest and debt', body: 'Savings are money you keep aside instead of spending. Interest is the extra you earn when you save, and the extra you pay when you borrow. Debt is money you owe, like a loan or a card balance.' },
          { title: 'Inflation, assets and compounding', body: 'Inflation is the rise in prices over time, so the same R20 buys less than it used to. An asset is something you own that can earn money or grow in value. Compounding is when your earnings start earning too.' },
        ],
        quiz: [
          { prompt: 'Inflation means…', options: ['Your salary goes up every year', 'Prices rise over time, so money buys less', 'Interest paid by a bank', 'Money you owe'], correct: 1, explanation: 'Inflation is the general rise in prices over time.' },
          { prompt: 'Interest is…', options: ['Always a bad thing', 'Only for banks', 'Costly when you owe money and helpful when it grows your savings', 'The same as income'], correct: 2, explanation: 'It works against you on debt and for you on savings.' },
          { prompt: 'True or false: credit cards are free money.', options: ['True', 'False. You pay it back, often with interest'], correct: 1, explanation: 'Credit is borrowed money, so you repay it, usually with interest.' },
        ],
        action: { title: 'Write your own one-line meaning of income and expenses', description: 'Use examples from your life, like your allowance or your airtime.' },
      },
      {
        slug: 'now-now-stack-it-grow-it', title: 'Now-Now, Stack It, Grow It', durationSec: 190,
        takeaway: 'Match each goal to the right bucket: spend it, stack it or grow it.',
        cards: [
          { title: 'R10,000 lands in your account. Now what?', body: 'Most of us do one of three things: spend it, save it or grow it. All three are useful. The skill is knowing which money belongs where.' },
          { title: 'Spend: “Now-Now”', body: 'Now-Now money covers today’s needs and wants: food, transport, airtime, a movie with friends. These are goals within about 0 to 12 months. Before you spend, ask: do I need this, or do I just want it right now?' },
          { title: 'Save: “Stack It”', body: 'Stacking is setting money aside for short and medium-term goals in a low-risk, easy-access place like a savings account. Start small: even R100 a month builds the habit. An emergency fund is money you stack for surprises like a broken phone or a medical bill. Over time, aim for 3 to 6 months of basic living costs.' },
          { title: 'Borrow or save? The laptop example', body: 'A laptop costs R1,500. Borrow it and repay over 12 months with 15% interest added: R1,725 in total, so R225 more. Or save R150 a month for 12 months: you have R1,800, buy it cash and still have R300 left. Example only: real loans quote interest in different ways, so always ask for the total you will repay.' },
          { title: 'Grow: “Grow It”', body: 'Growing is investing for long-term goals, 5 years or more, like a home or retirement. Investments can grow faster than prices rise, but they can also fall and nothing is guaranteed. Illustration: R150 a month for a year at an assumed 8% a year is about R1,870, and left alone for 5 more years about R2,700. It is an assumption, not a forecast.' },
          { title: 'Give your goal a number and a date', body: '“Save some money” is hard to follow. “Save R3,000 in 6 months for a laptop for my studies” is a goal you can track. Make it Specific, Measurable, Achievable, Relevant and Time-bound: a SMART goal.' },
        ],
        quiz: [
          { prompt: 'Which bucket fits “new sneakers next month”?', options: ['Now-Now (spend)', 'Stack It (save)', 'Grow It (invest)', 'None of them'], correct: 0, explanation: 'Something you want within the next year that you will spend on is a Now-Now goal.' },
          { prompt: 'In the laptop example, why did saving cost less than borrowing?', options: ['There was no interest to pay', 'Saving is taxed less', 'Laptops get cheaper each month', 'Banks lend for free'], correct: 0, explanation: 'Borrowing added R225 of interest. Saving added none.' },
          { prompt: 'An emergency fund is best used for…', options: ['A sale on sneakers', 'An unexpected, necessary cost like a broken phone you need for study', 'A holiday', 'A friend’s gift'], correct: 1, explanation: 'Emergencies are urgent, unexpected and necessary.' },
        ],
        action: { title: 'Sort one goal into Now-Now, Stack It or Grow It', description: 'Pick something you want and decide which bucket it belongs in, and by when.' },
      },
      {
        slug: 'assets-risk-reward', title: 'Assets, risk and reward', durationSec: 185,
        takeaway: 'An asset earns money or grows in value. The safer it is, the smaller the growth you can expect.',
        cards: [
          { title: 'Not everything expensive is an asset', body: 'An asset earns money or grows in value. A flat you rent out earns rent. A bicycle you rent out earns money. A phone or a car used only for yourself usually loses value and costs money to keep.' },
          { title: 'Four common asset types', body: 'Cash and money market: very low risk, very low growth, for the short term. Bonds: you lend to a government or company for interest, low to medium risk. Property: medium to high risk, with rent and possible growth, slower to sell. Shares: part-ownership of a company, high risk and high potential growth, for the long term.' },
          { title: 'Risk and reward travel together', body: 'The safer an investment, the smaller the growth you can usually expect. The riskier it is, the bigger the potential growth and the bigger the ups and downs. Money you need within a year belongs somewhere safe. Money you will not touch for 5 years or more can ride out the ups and downs.' },
          { title: 'Where to invest', body: 'A savings account is a safe parking spot that will not lose money but will not grow much. A unit trust or ETF pools many people’s money, managed by a professional, and gives you a slice of shares, bonds, property or cash. A TFSA is a tax-free container for either. Check SARS for the current limits.' },
        ],
        quiz: [
          { prompt: 'Which is most likely an asset?', options: ['A new phone for yourself', 'A car used only for personal trips', 'A flat you rent out', 'Designer sneakers'], correct: 2, explanation: 'It earns rental income and can grow in value.' },
          { prompt: 'Which usually has the highest potential growth and the biggest ups and downs?', options: ['Cash', 'Bonds', 'Property', 'Shares'], correct: 3, explanation: 'Shares carry the most risk and the most potential reward over the long term.' },
          { prompt: 'A TFSA is best described as…', options: ['A guaranteed return', 'A tax-free container for savings or investments', 'A type of loan', 'A bank card'], correct: 1, explanation: 'It is the wrapper. What goes inside it is your choice.' },
        ],
        action: { title: 'Name one asset you own or could own, and how risky it is', description: 'Use the four types above. Be honest about how soon you might need the money.' },
      },
      {
        slug: 'start-early', title: 'Starting early beats starting big', durationSec: 195,
        takeaway: 'Time does a lot of the work. Start small, start early and keep going.',
        cards: [
          { title: 'R500 a month. Three people. Very different endings.', body: 'Joshua, Aisha and Sipho each plan to retire at 60. Each puts away R500 a month. The only difference is when they start.' },
          { title: 'Compounding, in plain words', body: 'Compounding means you earn on your savings and on the earnings you already made. Think of planting a tree: the longer it grows, the more fruit it makes, and the fruit grows more trees.' },
          { title: 'What starting early does', body: 'At an assumed 8% a year: Joshua starts at 20 and has about R1.75 million at 60. Aisha starts at 30 and has about R745,000. Sipho starts at 40 and has about R295,000. Joshua paid in R240,000 and Sipho R120,000, so Joshua paid in R120,000 more but ends with about six times as much. Illustration only. Real returns vary and are not guaranteed.' },
          { title: 'Why not just keep cash?', body: 'Prices rise over time. What R20 bought at the tuck shop when you started school buys less today. If your money is not growing, it quietly loses buying power, which is why long-term money usually needs to grow faster than prices.' },
          { title: 'How to start now', body: 'Start a savings habit with whatever you can afford. Open a TFSA when you are able. Set one long-term SMART goal. Save or invest regularly: consistency matters more than the amount. Raise it as your income grows. Pay your future self first.' },
        ],
        quiz: [
          { prompt: 'Joshua paid in twice as much as Sipho but ended with about…', options: ['Twice as much', 'Three times as much', 'Six times as much', 'The same'], correct: 2, explanation: 'Extra years of compounding add far more than the extra deposits.' },
          { prompt: 'Why can keeping all your money in cash cost you over many years?', options: ['Banks charge no fees', 'Prices rise, so the same rand buys less', 'Cash is illegal to keep', 'Interest is always negative'], correct: 1, explanation: 'Inflation reduces what money can buy.' },
          { prompt: 'What matters most when you are just starting out?', options: ['Starting with a large amount', 'Starting early and being consistent', 'Waiting for a perfect time', 'Picking the riskiest option'], correct: 1, explanation: 'Time and consistency do much of the work.' },
        ],
        action: { title: 'Retirement goal starter', description: 'Pick an age you would like to retire and a monthly amount you could start with. Only you see this.' },
      },
      {
        slug: 'smart-goals', title: 'SMART goals that stick', durationSec: 175,
        takeaway: 'A goal with a number and a date is one you can track and reach.',
        cards: [
          { title: '“Save some money” is not a plan', body: 'Goals give your money a job. Instead of spending without thinking, a clear goal helps you decide what each rand is for. Saving gets easier when you know what you are saving for.' },
          { title: 'S, M and A', body: 'Specific: what exactly do you want, like a school uniform? Measurable: how much will it cost, like R1,200? Achievable: can you realistically afford it, like R200 a month for six months?' },
          { title: 'R and T', body: 'Relevant: why does it matter to you? Time-bound: by when? For example, “by the start of next term”. If you can measure it, you can track it. If you can track it, you can reach it.' },
          { title: 'Short, medium and long term', body: 'Short term is 0 to 12 months, like saving R3,000 for an emergency fund in six months. Medium term is 1 to 5 years, like saving R30,000 for a car deposit in two years. Long term is 5 years or more, like buying a home. Write one of each.' },
          { title: 'Put your goal in your budget', body: 'Every goal needs a monthly amount. For example, R300 a month for six months to buy a camera. Check in weekly, review monthly, and celebrate each time you stick to it.' },
        ],
        quiz: [
          { prompt: 'Which is the strongest money goal?', options: ['Save more', 'Save R3,000 in 6 months for a laptop', 'Be rich someday', 'Stop wasting money'], correct: 1, explanation: 'It is specific, measurable and has a deadline.' },
          { prompt: 'R200 a month for 6 months adds up to…', options: ['R600', 'R1,200', 'R2,000', 'R12,000'], correct: 1, explanation: '200 × 6 = R1,200.' },
          { prompt: 'The T in SMART stands for…', options: ['Tough', 'Time-bound', 'Tax', 'Typical'], correct: 1, explanation: 'A goal needs a date.' },
        ],
        action: { title: 'Write one short, one medium and one long-term goal', description: 'Use the Savings goals tool. Give each a number and a date.' },
      },
      {
        slug: 'payslip-walkthrough', title: 'Read a payslip line by line', durationSec: 180,
        takeaway: 'Gross is not net. Take-home pay is gross minus deductions, and some deductions are protection for you.',
        cards: [
          { title: 'Why does R11,500 become R9,819.25?', body: 'A payslip is more than proof of payment. It shows what you earned, what was taken off and what you actually take home. Understanding it ends the “where did my money go?” confusion.' },
          { title: 'Earnings', body: 'Gross earnings are your basic salary plus things like overtime or bonuses. In our sample, the basic salary is R11,500. Gross is the number before anything is taken off.' },
          { title: 'Deductions', body: 'In the sample: PAYE tax R260.75, UIF R120, medical aid R750 and pension R550. Together that is R1,680.75. The exact amounts on your own payslip will differ, because tax depends on current SARS tables.' },
          { title: 'Net pay is the number to budget with', body: 'R11,500 minus R1,680.75 is R9,819.25. That is what lands in your bank account. Gross is not net. Deductions reduce the total.' },
          { title: 'Losses or protection?', body: 'UIF is like a parachute if you lose your job. Pension is income you are building for later. Medical aid is health cover. Think of them as forced savings and protection, not just money lost. Also check your leave balances: annual, family responsibility and special leave.' },
        ],
        quiz: [
          { prompt: 'A payslip shows gross R11,500 and total deductions R1,680.75. What is the net pay?', options: ['R13,180.75', 'R10,319.25', 'R9,819.25', 'R9,500'], correct: 2, explanation: '11,500 − 1,680.75 = R9,819.25.' },
          { prompt: 'Which deduction builds income for when you stop working?', options: ['UIF', 'Pension', 'PAYE', 'Overtime'], correct: 1, explanation: 'Pension contributions are saved for retirement.' },
          { prompt: 'UIF is best described as…', options: ['A fee for your bank', 'Protection if you lose your job', 'A savings account', 'A bonus'], correct: 1, explanation: 'It supports you if you are unemployed or on certain leave.' },
        ],
        action: { title: 'Try the Payslip simulator with a salary of your choice', description: 'It uses illustrative figures and never your real details.' },
      },
      {
        slug: 'budget-scenario', title: 'The R3,500 laptop budget', durationSec: 185,
        takeaway: 'A budget is not about restriction. It is about knowing where your money goes so you can aim it.',
        cards: [
          { title: 'R3,500 in. R3,600 out.', body: 'You get R3,500 a month from a bursary or part-time job. You want a R1,500 laptop. Your spending today: rent or board R1,200, transport R800, food R700, airtime and data R300, entertainment R400 and clothing R200. That is R3,600: R100 more than you earn, with nothing saved.' },
          { title: 'Needs and wants', body: 'Needs are essentials: rent, food, transport, electricity. Wants are nice-to-haves: entertainment, fashion, fast food. Some things depend on context. Airtime for studying may be a need; extra data for streaming is a want.' },
          { title: 'The 50/30/20 guide', body: 'A starting guide: about 50% of take-home for needs, 30% for wants and 20% for savings and paying off debt. It is a guideline, not a strict rule. Your numbers will shift with your situation.' },
          { title: 'One way to fix it', body: 'Trim wants first: entertainment and clothing from R600 to R400, data from R300 to R250, and look for savings in transport, say R100. The total falls to R3,250. That leaves R250: R150 for the laptop and R100 as a cushion. Everyone’s trade-offs differ. This is one example.' },
          { title: 'Make it stick', body: 'Check in weekly: am I on plan? Review monthly: did I overspend, and what do I change? Celebrate every time you stick to it. A budget gives you control and freedom.' },
        ],
        quiz: [
          { prompt: 'You earn R3,500 and spend R3,600. What is true?', options: ['You saved R100', 'You are R100 short, so you borrow or dip into savings', 'You are exactly on budget', 'You have R3,600 left'], correct: 1, explanation: 'Spending is more than income by R100.' },
          { prompt: 'In 50/30/20, the 20% is for…', options: ['Needs', 'Wants', 'Savings and paying off debt', 'Taxes only'], correct: 2, explanation: 'It is for your future self and debt repayment.' },
          { prompt: 'A budget is mainly about…', options: ['Never having fun', 'Knowing where your money goes so you stay in control', 'Spending more', 'Avoiding all saving'], correct: 1, explanation: 'It is a plan that gives you control and reduces stress.' },
        ],
        action: { title: 'Build the R3,500 scenario in the Budget builder', description: 'Choose the Workshop scenario template and aim to save at least R150 without spending more than R3,500.' },
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
  'first-month-plan': [TREASURY],
  'scam-smart': [FSCA, { title: 'Banking Association South Africa', url: 'https://www.banking.org.za/' }],
  'student-accounts': [{ title: 'Banking Association South Africa', url: 'https://www.banking.org.za/' }],
  'money-words': [FSCA, TREASURY],
  'now-now-stack-it-grow-it': [FSCA, { title: 'National Credit Regulator', url: 'https://www.ncr.org.za/' }],
  'assets-risk-reward': [FSCA, SARS],
  'start-early': [FSCA, SARS],
  'smart-goals': [FSCA],
  'payslip-walkthrough': [SARS, { title: 'Department of Employment and Labour: UIF', url: 'https://www.labour.gov.za/' }],
  'budget-scenario': [TREASURY, FSCA],
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
  'now-now-stack-it-grow-it': { 2: 'If it is urgent, unexpected and necessary, then it is an emergency. Otherwise it can wait.', 3: 'If you can wait, then saving usually costs less than borrowing.', 5: 'If you can measure it, then you can track it. If you can track it, then you can reach it.' },
  'assets-risk-reward': { 2: 'If you will need the money within a year, then keep it somewhere safe, not in shares.', 3: 'If someone promises high returns with no risk, then treat it as a scam warning.' },
  'start-early': { 2: 'If you start earlier, then time does more of the work, even with the same monthly amount.' },
  'payslip-walkthrough': { 3: 'If your net pay is lower than you expected, then check each deduction line before you panic.' },
  'budget-scenario': { 3: 'If your spending is higher than your income, then trim wants first and still try to save something.' },
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
