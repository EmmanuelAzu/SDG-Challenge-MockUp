import type { ChapterId } from '@/lib/world/types';

/**
 * The guided pilot: five short chapters that follow Sisi's loop (LEARN, DO, PROGRESS, REWARD, CONNECT),
 * each introduced and wrapped up by Sisi in her warm older-sister voice.
 */
export type Step = { id: string; tip: string; href?: string };
export type Chapter = {
  id: ChapterId; n: number; label: string; title: string; minutes: number; emoji: string;
  intro: { headline: string; body: string[]; cta: string };
  steps: Step[];
  outro: { headline: string; body: string[] };
  href: string;
};

export const CHAPTERS: Chapter[] = [
  {
    id: 'learn', n: 1, label: 'LEARN', title: 'Learn something real in 3 minutes', minutes: 4, emoji: '📚', href: '/learn/money-matters/now-now-stack-it-grow-it',
    intro: {
      headline: 'Hi, I’m Sisi. Let’s start with a lesson.',
      body: ['Think of me as the older sister who explains money without the jargon.', 'Every Sisi lesson is about three minutes: a few cards, a quick quiz, and one tiny thing to do today.', 'We’ll start with a question I hear a lot: what do I do when money lands in my account?'],
      cta: 'Start the lesson',
    },
    steps: [
      { id: 'cards', tip: 'Tap through the six cards. Take your time, there is no clock.' },
      { id: 'quiz', tip: 'Now a quick three-question quiz. Wrong answers are fine: you will see why.' },
      { id: 'action', tip: 'One small thing to do today. Do it, or skip it. No pressure.' },
    ],
    outro: { headline: 'That’s the loop: learn, check, do.', body: ['You also just earned points. They are only a way of seeing progress, and you can switch them off with Focus mode if they are not your thing.'] },
  },
  {
    id: 'do', n: 2, label: 'DO', title: 'Put it into practice', minutes: 3, emoji: '🧮', href: '/tools/budget?template=workshop',
    intro: {
      headline: 'Knowing is nice. Doing is better.',
      body: ['Meet a student with R3,500 a month who is spending R3,600, and who wants a R1,500 laptop.', 'Your job: fix her budget so she is not overspending and can save at least R150 a month.', 'I’ll coach you as you move the sliders.'],
      cta: 'Open the budget',
    },
    steps: [{ id: 'budget', tip: 'Move the sliders so you spend no more than R3,500 and save at least R150 (Emergency savings or Investing). Then tap Save.' }],
    outro: { headline: 'Look what that bought her.', body: ['At R150 a month, the R1,500 laptop is ten months away, with no interest to pay.', 'Borrowing it at 15% would have cost R225 more. That is the lesson from earlier, now in her own numbers.'] },
  },
  {
    id: 'progress', n: 3, label: 'PROGRESS', title: 'See your progress, without the pressure', minutes: 2, emoji: '🌸', href: '/rewards',
    intro: {
      headline: 'Small things add up.',
      body: ['This is where you see it: your Bloom grows as you learn, you collect badges, and you choose how often you want to show up.', 'There are no streaks that break if you miss a day. Pick a weekly target that feels doable.'],
      cta: 'See my progress',
    },
    steps: [{ id: 'target', tip: 'Find “My weekly target” and tap 1, 2 or 3 days a week. Missing a day never resets anything.' }],
    outro: { headline: 'Your target is set.', body: ['Prefer no points or badges at all? Focus mode hides them and your progress still counts. You can change both any time in Profile.'] },
  },
  {
    id: 'reward', n: 4, label: 'REWARD', title: 'A reward that is yours to choose', minutes: 2, emoji: '🎁', href: '/pilot',
    intro: {
      headline: 'Let’s talk about rewards.',
      body: ['Finishing milestones can earn a reward. When you do, you choose how you want it.', 'This is a preview. Nothing here is real money, and every real pilot reward is subject to PPS approval.'],
      cta: 'Show me',
    },
    steps: [{ id: 'choose', tip: 'Choose how you would like a reward.' }],
    outro: { headline: 'That’s how a claim would work.', body: ['In the full app PPS reviews each claim and you watch it move from Claimed to Approved to Paid. Vouchers expire. Investments don’t.'] },
  },
  {
    id: 'connect', n: 5, label: 'CONNECT', title: 'You are not doing this alone', minutes: 3, emoji: '💬', href: '/community',
    intro: {
      headline: 'Money feels easier with people.',
      body: ['Say hello in your community, then meet a Money Buddy: a friend you do a short plan with each week.', 'The women in these chats and your practice buddy are simulated for the pilot, so you can see how it would feel.'],
      cta: 'Meet my community',
    },
    steps: [
      { id: 'hello', tip: 'Open your community’s Lounge, accept the guidelines and say hello. Other women reply in a few seconds.' },
      { id: 'buddy', tip: 'Now open Money Buddy and start with a practice buddy. Look at this week’s plan.', href: '/pathways/buddy' },
      { id: 'nudge', tip: 'Send your buddy a friendly nudge and see what happens.', href: '/pathways/buddy' },
    ],
    outro: { headline: 'That’s the whole loop.', body: ['Learn, do, progress, reward, connect. Each step makes the next one easier, and none of it needs you to be good with money already.'] },
  },
];

export const chapterById = (id: ChapterId) => CHAPTERS.find((c) => c.id === id)!;
export const TOTAL_MINUTES = CHAPTERS.reduce((a, c) => a + c.minutes, 0) + 2; // plus the welcome and the wrap-up
export const GUIDED_MINUTES = 15;

export const PEEK: { id: string; title: string; blurb: string; href: string }[] = [
  { id: 'payslip', title: 'Payslip simulator', blurb: 'See how a salary becomes take-home pay and plan the rest.', href: '/tools/payslip' },
  { id: 'letterbox', title: 'Letterbox', blurb: 'Friends’ wins in one place, never amounts.', href: '/letterbox' },
  { id: 'invest', title: 'Invest HER (simulation)', blurb: 'A guided first investment step with no real money.', href: '/pathways/invest-her' },
  { id: 'events', title: 'Events and calendar', blurb: 'Book a seat, get a QR ticket, check in.', href: '/events' },
  { id: 'talk', title: 'Talk to someone', blurb: 'Ask a real person a money question.', href: '/help/talk' },
  { id: 'support', title: 'Support and Quick exit', blurb: 'Private help and a one-tap exit. Never tracked.', href: '/help/support' },
];

export const REACTIONS: { v: 1 | 2 | 3; emoji: string; label: string }[] = [
  { v: 1, emoji: '😍', label: 'Loved it' },
  { v: 2, emoji: '🙂', label: 'It was okay' },
  { v: 3, emoji: '🙁', label: 'Not for me' },
];

/** Reward preview shown in chapter 4. Mirrors the app's real reward rules (credit is worth 10% more than cash). */
export const REWARD_PREVIEW = { cash: 50, credit: 55 };
