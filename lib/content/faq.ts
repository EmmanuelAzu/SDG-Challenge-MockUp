export type Faq = { id: string; group: string; q: string; a: string };

/** Editable FAQ. Keep any figure in line with the spec's points table; no other statistics. */
export const FAQ: Faq[] = [
  { id: 'what', group: 'About Sisi', q: 'What is Sisi?', a: 'Sisi is money confidence, together: three-minute lessons, a Circle of friends, simple tools and badges, made for young South African women. Think of it as a smart older sister who explains money without the jargon.' },
  { id: 'advice', group: 'About Sisi', q: 'Is this financial advice?', a: 'No. Everything on Sisi is education. We explain how things work so you can decide for yourself. For advice about your own situation, speak to a licensed financial adviser.' },
  { id: 'real-money', group: 'About Sisi', q: 'Does the simulator use real money?', a: 'Never. Invest HER, the Payslip simulator and the budget tools are simulations and are always labelled. Returns and tax figures shown are illustrative, not a forecast.' },
  { id: 'mock', group: 'About Sisi', q: 'Why does it say this is a mock?', a: 'This version is a preview. What you do is saved only in this browser and nothing is sent to a server. Clearing your browser data clears your progress.' },
  { id: 'privacy-amounts', group: 'Privacy', q: 'Who can see my budget, goals and payslip amounts?', a: 'Only you. Amounts never appear on leaderboards, share cards or analytics. Buddies only see whether you finished a task, never how much.' },
  { id: 'never-ask', group: 'Privacy', q: 'What will Sisi never ask me for?', a: 'Your income, ID number or bank account numbers. If anyone in a chat asks for them, report the message.' },
  { id: 'delete', group: 'Privacy', q: 'How do I delete my data?', a: 'Profile → Delete my account / reset my data. You can also export everything first as a file.' },
  { id: 'points', group: 'Points and streaks', q: 'How do I earn points?', a: 'Finishing a lesson earns 10, a quiz 5, a lesson action 15, a session 25 and an event check-in 30. Hitting your weekly target earns 25. Sharing never earns points.' },
  { id: 'streak', group: 'Points and streaks', q: 'Do I lose my streak if I miss a day?', a: 'No. Sisi uses a weekly target of 1 to 3 days that you choose. Missing a day never resets anything.' },
  { id: 'focus', group: 'Points and streaks', q: 'Can I turn off the badges and leaderboards?', a: 'Yes. Focus mode in Profile hides badges, levels and leaderboards. Your progress still counts.' },
  { id: 'compete', group: 'Points and streaks', q: 'Do I have to compete?', a: 'No. Showing up on leaderboards is optional and you can opt out any time in Profile.' },
  { id: 'rewards', group: 'Rewards', q: 'How do rewards work?', a: 'When you reach a reward you can claim it and choose cash or investment credit (the credit is worth 10% more). PPS reviews each claim. All rewards are pilot rewards, subject to PPS approval.' },
  { id: 'draw', group: 'Rewards', q: 'How does the weekly prize draw work?', a: 'Doing the week’s challenge enters you. Each Monday five winners are drawn from everyone who entered, and the page shows how many entered and how many prizes there are.' },
  { id: 'buddy', group: 'Community', q: 'How does Money Buddy work?', a: 'Invite a friend. Each week you each get three small money things to do. When you both finish you each earn 20 points. You can nudge your buddy once a day.' },
  { id: 'report', group: 'Community', q: 'How do I report or block someone?', a: 'Open the ⋯ menu on any message and choose Report or Block. Facilitators review reports. Blocking hides that person for you.' },
  { id: 'chat-safety', group: 'Community', q: 'What should I not share in chat?', a: 'Account numbers, ID numbers or exact amounts. Keep it friendly and general.' },
  { id: 'support', group: 'Help', q: 'I need to talk to someone about something heavy.', a: 'Open Help → Support for free, confidential numbers. The Support page has a Quick exit button that leaves straight away.' },
  { id: 'talk', group: 'Help', q: 'Can I ask a money question to a person?', a: 'Yes. Help → Talk to someone lets you ask a question or request a 15-minute call. Answers come from a PPS-approved professional and are general education, not personalised advice.' },
];
