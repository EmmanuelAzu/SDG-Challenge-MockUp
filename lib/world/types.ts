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

export type Community = { id: string; slug: string; name: string; description: string; kind: 'university' | 'workplace' | 'community' | 'oweek'; joinCode: string; requiresApproval: boolean };
export type CommunityMember = { communityId: string; userId: string; role: 'member' | 'facilitator' | 'admin'; status: 'pending' | 'active'; joinedAt: ISO };
export type Circle = { id: string; communityId: string; name: string; topic: string; facilitatorId: string; weekday: number; startTime: string; capacity: number; isOpen: boolean };
export type CircleMember = { circleId: string; userId: string; agreedAt: ISO | null; joinedAt: ISO };

export type PointEvent = { id: string; userId: string; communityId: string | null; source: string; sourceId: string; points: number; at: ISO };
export type UserBadge = { id: string; userId: string; slug: string; earnedAt: ISO };
export type LessonProgress = { status: 'started' | 'completed' | 'passed'; quizScore: number | null; startedAt: ISO; completedAt: ISO | null };
export type Survey = { userId: string; kind: 'pre' | 'post'; answers: number[]; at: ISO };
export type Feedback = { userId: string; lessonId: string; rating: number; text: string; at: ISO };
export type TopicSuggestion = { id: string; userId: string; body: string; voters: string[]; at: ISO };
export type ShareLink = { code: string; userId: string; badgeId: string; at: ISO; revoked: boolean };

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
  notifications: Notification[];
  analytics: AnalyticsEvent[];
};

export type EarnedBadge = { id: string; slug: string; name: string; meaning: string; rarity: string };
export type Earned = { badges: EarnedBadge[]; milestones: string[]; points: number };
