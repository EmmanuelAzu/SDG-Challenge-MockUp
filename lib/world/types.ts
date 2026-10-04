import type { TrackSlug } from '@/lib/content/life-tracks';

export type Role = 'member' | 'facilitator' | 'community_admin' | 'professional' | 'pps_admin';
export type ISO = string;

export type User = {
  id: string;
  email: string;
  /** Mock only: stored in plain text in the browser. */
  password: string;
  displayName: string;
  nickname: string;
  role: Role;
  color: string;
  lifeTrack: TrackSlug | null;
  weeklyTarget: 1 | 2 | 3;
  focusMode: boolean;
  shareMilestones: boolean;
  showOnLeaderboard: boolean;
  shareNameMode: 'first' | 'nickname';
  goals: string[];
  reminderDays: number[]; // ISO weekday 1 = Mon … 7 = Sun
  reminderEnabled: boolean;
  consentedAt: ISO | null;
  onboardedAt: ISO | null;
  referralCode: string;
  referredBy: string | null;
  createdAt: ISO;
  /** Seeded fictional member (not a real login). */
  sim?: boolean;
};

export type Community = { id: string; slug: string; name: string; description: string; kind: 'university' | 'workplace' | 'community' | 'oweek'; joinCode: string; requiresApproval: boolean; tags: string[]; emoji: string; color: string; createdAt: ISO };
export type CommunityMember = { communityId: string; userId: string; role: 'member' | 'facilitator' | 'admin'; status: 'pending' | 'active'; joinedAt: ISO; agreedAt: ISO | null };
export type Circle = { id: string; communityId: string; name: string; topic: string; facilitatorId: string; weekday: number; startTime: string; capacity: number; isOpen: boolean };
export type CircleMember = { circleId: string; userId: string; agreedAt: ISO | null; joinedAt: ISO };

export type PointEvent = { id: string; userId: string; communityId: string | null; source: string; sourceId: string; points: number; at: ISO };
export type UserBadge = { id: string; userId: string; slug: string; earnedAt: ISO };
export type LessonProgress = { status: 'started' | 'completed' | 'passed'; quizScore: number | null; startedAt: ISO; completedAt: ISO | null };
export type Survey = { userId: string; kind: 'pre' | 'post'; answers: number[]; at: ISO };
export type Feedback = { userId: string; lessonId: string; rating: number; text: string; at: ISO };
export type TopicSuggestion = { id: string; userId: string; body: string; voters: string[]; at: ISO };
export type ShareLink = { code: string; userId: string; badgeId: string; at: ISO; revoked: boolean };

export type Channel = { id: string; kind: 'circle' | 'community' | 'buddy'; refId: string };
export type Message = { id: string; channelId: string; userId: string | null; body: string; replyTo: string | null; kind: 'user' | 'system'; pinned: boolean; deleted: boolean; at: ISO; image?: string };
export type Reaction = { messageId: string; userId: string; emoji: string };
export type Report = { id: string; messageId: string; reporterId: string; reason: string; status: 'open' | 'dismissed' | 'actioned'; at: ISO };

export type EventType = 'workshop' | 'expert_qa' | 'oweek' | 'meetup';
export type SisiEvent = { id: string; communityId: string | null; type: EventType; title: string; description: string; agenda: string[]; hostName: string; hostRole: string; startsAt: ISO; endsAt: ISO; location: string; online: boolean; capacity: number; emoji: string; published: boolean };
export type Booking = { id: string; eventId: string; userId: string; status: 'booked' | 'waitlisted' | 'cancelled' | 'checked_in'; ticketCode: string; waitlistPosition: number | null; at: ISO };
export type Session = { id: string; communityId: string; circleId: string; title: string; startsAt: ISO; endsAt: ISO; location: string; seriesId: string; cancelled: boolean };
export type Attendance = { sessionId: string; userId: string; rating: number | null };

export type FeedKind = 'badge' | 'milestone' | 'level' | 'weekly' | 'announcement';
export type FeedPost = { id: string; userId: string; communityId: string | null; kind: FeedKind; text: string; refSlug?: string; pinned?: boolean; at: ISO };
export type FeedReaction = { postId: string; userId: string; emoji: string };
export type FeedNote = { id: string; postId: string; userId: string; body: string; at: ISO };

export type Challenge = { id: string; communityId: string | null; title: string; description: string; points: number; weekStart: string };
export type CampusSeason = { id: string; name: string; startsOn: string; endsOn: string; prizeText: string; communityIds: string[]; awardedAt: ISO | null };

export type BudgetCategory = 'rent' | 'transport' | 'groceries' | 'utilities' | 'family' | 'emergency' | 'investing' | 'fun';
export type Budget = { template: string; income: number; lines: Record<BudgetCategory, number>; savedAt: ISO };
export type Deposit = { id: string; amount: number; at: ISO };
export type SavingsGoal = { id: string; userId: string; name: string; emoji: string; target: number; dueOn: string | null; deposits: Deposit[]; createdAt: ISO; reachedAt: ISO | null };
export type InvestState = { affordability: Record<string, string>; monthly: number; years: number; rate: number; explainersSeen: string[]; simulated: boolean; simRuns: number; checklist: string[]; startedAt: ISO; finishedAt: ISO | null };

export type PayslipRun = { id: string; gross: number; retirementPct: number; allocation: Record<BudgetCategory, number>; at: ISO };

export type ChapterId = 'learn' | 'do' | 'progress' | 'reward' | 'connect';
export type PilotChapter = { startedAt?: ISO; doneAt?: ISO; seen?: boolean; reaction?: 1 | 2 | 3 };
/** What the tester did, recorded passively. No amounts they type, no message text. */
export type PilotFacts = {
  quizScore?: number | null; quizAttempts?: number; budgetOk?: boolean; weeklyTarget?: number; rewardChoice?: 'cash' | 'credit';
  messageSent?: boolean; buddyStarted?: boolean; nudged?: boolean; points?: number; level?: string; badges?: string[];
};
export type PilotRun = {
  id: string; // anonymous participant id, e.g. 7K3Q
  userId: string | null; // local account; never exported
  simulated?: boolean;
  path: 'quick' | 'account';
  consentAt: ISO;
  profile: { ageBand: string; status: string; experience: string } | null;
  device: 'mobile' | 'desktop';
  stage: 'story' | 'done';
  startedAt: ISO;
  finishedAt: ISO | null;
  chapters: Partial<Record<ChapterId, PilotChapter>>;
  facts: PilotFacts;
  peeked: string[]; // optional extras they opened (self-reported taps)
};

export type Friendship = { id: string; fromId: string; toId: string; status: 'pending' | 'accepted'; at: ISO };
export type HelpRequest = { id: string; userId: string; kind: 'question' | 'call'; topic: string; body: string; windows: string[]; status: 'open' | 'answered' | 'closed'; answer: string; answeredBy: string | null; at: ISO; answeredAt: ISO | null };
export type SafetyGroup = 'emergency' | 'gbv' | 'counselling' | 'student';
export type SafetyResource = { id: string; group: SafetyGroup; name: string; description: string; phone: string; hours: string; verified: boolean };

export type BuddyItem = { id: string; title: string; kind: 'action' | 'manual'; lessonId?: string };
export type BuddyPlan = { weekKey: string; weekStart: ISO; items: BuddyItem[]; done: Record<string, string[]> };
export type BuddyPair = { id: string; inviterId: string; inviteeId: string | null; code: string; status: 'pending' | 'active' | 'ended'; sim: boolean; createdAt: ISO; plans: BuddyPlan[]; nudges: { fromId: string; at: ISO }[]; jointAt: ISO | null };

export type Claim = { id: string; userId: string; rewardSlug: string; status: 'claimed' | 'approved' | 'rejected' | 'paid'; choice: 'cash' | 'credit'; cash: number; credit: number; refKey: string; note: string; at: ISO; updatedAt: ISO };
export type Draw = { id: string; challengeId: string; weekKey: string; entrants: string[]; winners: string[]; prizes: number; prize: number; at: ISO };

export type Notification = { id: string; userId: string; kind: string; title: string; body: string; href: string; at: ISO; read: boolean; key?: string };
export type AnalyticsEvent = { id: string; userId: string; name: string; props: Record<string, string | number | boolean>; at: ISO };

/** The whole mock backend: one JSON document in localStorage. */
export type World = {
  version: number;
  clockOffsetMs: number;
  users: Record<string, User>;
  communities: Community[];
  communityMembers: CommunityMember[];
  circles: Circle[];
  circleMembers: CircleMember[];
  lessonProgress: Record<string, LessonProgress>; // `${userId}:${lessonId}`
  actionCompletions: Record<string, { status: 'done' | 'skipped'; at: ISO }>; // `${userId}:${actionId}`
  milestonesDone: Record<string, Record<string, ISO>>; // userId -> milestoneSlug -> at
  pointEvents: PointEvent[];
  userBadges: UserBadge[];
  surveys: Survey[];
  glossaryLookups: Record<string, string[]>;
  feedback: Feedback[];
  topicSuggestions: TopicSuggestion[];
  shares: ShareLink[];
  channels: Channel[];
  messages: Message[];
  reactions: Reaction[];
  reports: Report[];
  blocks: { blockerId: string; blockedId: string }[];
  mutes: { channelId: string; userId: string; until: ISO }[];
  reads: Record<string, ISO>; // `${userId}:${channelId}`
  events: SisiEvent[];
  bookings: Booking[];
  sessions: Session[];
  rsvps: Record<string, 'going' | 'maybe' | 'no'>; // `${sessionId}:${userId}`
  attendance: Attendance[];
  feed: FeedPost[];
  feedReactions: FeedReaction[];
  feedNotes: FeedNote[];
  challenges: Challenge[];
  challengeDone: { challengeId: string; userId: string; at: ISO }[];
  seasons: CampusSeason[];
  askedShare: Record<string, boolean>;
  budgets: Record<string, Budget>;
  payslipRuns: Record<string, PayslipRun[]>;
  buddies: BuddyPair[];
  claims: Claim[];
  draws: Draw[];
  goals: SavingsGoal[];
  invest: Record<string, InvestState>;
  pilot: Record<string, PilotRun>;
  pilotImports: PilotRun[];
  friendships: Friendship[];
  helpRequests: HelpRequest[];
  safety: SafetyResource[];
  notifications: Notification[];
  analytics: AnalyticsEvent[];
};

export type EarnedBadge = { id: string; slug: string; name: string; meaning: string; rarity: string };
export type Earned = { badges: EarnedBadge[]; milestones: string[]; points: number };
