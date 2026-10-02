export const COMMUNITIES = [
  { slug: 'wits', name: 'Wits University', kind: 'university', description: 'Wits women building money confidence together.', join_code: 'WITS26', requires_approval: false },
  { slug: 'uj', name: 'University of Johannesburg', kind: 'university', description: 'UJ sisters, small steps, big futures.', join_code: 'UJ26', requires_approval: false },
  { slug: 'pps-yp', name: 'PPS Young Professionals', kind: 'workplace', description: 'First-jobbers growing their money skills.', join_code: 'PPSYP26', requires_approval: false },
] as const;

export const CIRCLES = [
  { community: 'wits', name: 'First Salary Sisters', topic: 'Making your first salary work', weekday: 2, start: '18:00' },
  { community: 'wits', name: 'TFSA Thursdays', topic: 'Tax-free savings, step by step', weekday: 4, start: '17:30' },
  { community: 'wits', name: 'Budget Besties', topic: 'Budgets that survive the month', weekday: 3, start: '18:30' },
  { community: 'wits', name: 'Invest Curious', topic: 'Small-amount investing, explained', weekday: 1, start: '17:00' },
  { community: 'uj', name: 'UJ Money Moves', topic: 'Student budgets and saving', weekday: 3, start: '17:00' },
  { community: 'uj', name: 'Side Hustle Sisters', topic: 'Earning more, keeping more', weekday: 5, start: '16:00' },
  { community: 'pps-yp', name: 'Early Career Circle', topic: 'From payslip to plan', weekday: 2, start: '18:00' },
] as const;

export const MEMBER_NAMES = [
  'Nomsa Dlamini', 'Thandi Mokoena', 'Lerato Sithole', 'Zanele Khumalo', 'Aisha Patel', 'Palesa Molefe', 'Naledi Nkosi', 'Ayanda Zulu', 'Kea Mahlangu',
  'Lindiwe Ndlovu', 'Refilwe Mabaso', 'Busi Radebe', 'Chloe van der Merwe', 'Priya Naidoo', 'Amahle Cele', 'Tumi Moloi', 'Sipho Mthembu', 'Karabo Tau',
  'Fatima Essop', 'Nandi Shabalala', 'Rethabile Pule', 'Ntombi Dube', 'Megan Jacobs', 'Yolanda Gumede', 'Boitumelo Sebola', 'Anele Mkhize',
];

export const CHALLENGES = [
  { title: 'Track every rand for 3 days', description: 'Note down what you spend for three days. No judgement, just noticing.', points: 20 },
  { title: 'Name your savings goal', description: 'Pick one thing you are saving for and tell your Circle what it is (not the amount!).', points: 20 },
];

export const REWARDS = [
  { slug: 'milestones-cash', title: 'R50 cash for 3 milestones', amount_cash: 50, amount_credit: 0, rule: { milestones: 3 } },
  { slug: 'all-pathways', title: 'R500 investment credit + R100 cash for all three pathways', amount_cash: 100, amount_credit: 500, rule: { pathways: 3 } },
  { slug: 'weekly-draw', title: 'R25 weekly challenge prize draw', amount_cash: 25, amount_credit: 0, rule: { weekly: true } },
  { slug: 'buddy-joint', title: 'R100 joint buddy reward', amount_cash: 100, amount_credit: 0, rule: { buddy: true } },
];

export const SAFETY = [
  { category: 'Emergency', name: 'SAPS emergency', phone: '10111', sms: null, description: 'Police emergency line.' },
  { category: 'Emergency', name: 'Emergency from a mobile phone', phone: '112', sms: null, description: 'Works from any mobile network.' },
  { category: 'Gender-based violence', name: 'GBV Command Centre', phone: '0800 428 428', sms: '*120*7867# (USSD)', description: 'Free, 24 hours. SMS/USSD help available.' },
  { category: 'Counselling', name: 'SADAG suicide crisis line', phone: '0800 567 567', sms: null, description: 'Free counselling and crisis support.' },
  { category: 'Counselling', name: 'Lifeline SA', phone: '0861 322 322', sms: null, description: 'Emotional support and counselling.' },
  { category: 'Student wellness', name: 'Wits CCDU (verify number)', phone: null, sms: null, description: 'Campus counselling and careers. Number to be verified.' },
  { category: 'Student wellness', name: 'Campus Protection Services (verify number)', phone: null, sms: null, description: 'On-campus safety. Number to be verified.' },
];

/** Friendly, SA-flavoured Circle chat. General education chatter, no financial advice. */
export const CHAT_LINES = [
  'Hey everyone! Just finished the payslip lesson, I had no idea what UIF was 😅',
  'Same! I always thought gross was what I got paid',
  'Haha net pay is the one that matters 💗',
  'Anyone else track their spending this week? My data bundles are scary',
  'Mine too!! Found two subscriptions I forgot about',
  'Which ones? I need to check mine',
  'A music app and a gym I never go to 🙈',
  'Okay that is my sign to check my statement tonight',
  'Reminder that our next session is on Thursday, bring one budget question',
  'Will do! I want to ask about the 50/30/20 split when rent is high',
  'Rent is 60% for me, so I adjusted it to 60/20/20 and it feels doable',
  'That is exactly how it is supposed to work, make it yours',
  'I set up a R100 transfer for the day after payday, small but it is a start',
  'Love that. Small and steady 👏',
  'Does anyone know where to check the TFSA limits? I keep forgetting',
  'SARS website, they update it. The lesson said to always check the current numbers',
  'Right, thanks Kea!',
  'I got the Budget Builder badge today 🎉',
  'Congrats!! Share it so we can see 🔥',
  'Posted it on my status, my cousin asked what Sisi is lol',
  'Tell her to join through your link 😄',
  'Quiz question 2 got me, I said gross instead of net',
  'It happens! You can retry as many times as you like',
  'Who is coming to the expert Q&A about investing with R200 a month?',
  'Me! I have so many questions about fees',
  'Fees are the quiet thief, that lesson was so good',
  'Okay emergency fund target: R500 first. Nobody judge me 😂',
  'No judgement here, R500 is a great start 💗',
  'Anyone want to be a money buddy this week?',
  'Yes please! I will send you an invite',
  'Challenge this week is tracking spend for 3 days, who is in?',
  'In! Day one done already',
  'Proud of us honestly, a month ago I never opened my banking app',
  'Same. Now I actually look at it 😅',
  'Facilitator tip: write your goal on your phone wallpaper',
  'Ooh that is clever, doing it now',
  'Thank you all for being so kind here, it makes this less scary',
  'We got you 💗',
  'See you all on Thursday!',
  'Yes! Bringing snacks (not from my leak list 😂)',
];
