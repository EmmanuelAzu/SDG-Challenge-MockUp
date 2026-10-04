import type { SafetyResource } from '@/lib/world/types';

/**
 * Starting list for the Support page. Every entry begins UNVERIFIED and shows a visible flag
 * until a PPS admin checks the number and ticks "verified" in the staff console.
 */
export const SAFETY_DEFAULTS: SafetyResource[] = [
  { id: 'sr-saps', group: 'emergency', name: 'Police (SAPS)', description: 'If you are in danger right now.', phone: '10111', hours: '24 hours', verified: false },
  { id: 'sr-112', group: 'emergency', name: 'Emergency from a mobile phone', description: 'Works on any network, even without airtime.', phone: '112', hours: '24 hours', verified: false },
  { id: 'sr-gbv', group: 'gbv', name: 'GBV Command Centre', description: 'Free, confidential support if you or someone you know is being abused.', phone: '0800428428', hours: '24 hours', verified: false },
  { id: 'sr-sgv', group: 'gbv', name: 'Stop Gender Violence helpline', description: 'Free, confidential help and referrals.', phone: '0800150150', hours: '24 hours', verified: false },
  { id: 'sr-sadag', group: 'counselling', name: 'SADAG mental health line', description: 'Talk to a counsellor about stress, anxiety or feeling low.', phone: '0800456789', hours: '24 hours', verified: false },
  { id: 'sr-lifeline', group: 'counselling', name: 'Lifeline', description: 'Counselling for emotional distress.', phone: '0861322322', hours: '24 hours', verified: false },
  { id: 'sr-campus', group: 'student', name: 'Your campus student wellness centre', description: 'Free counselling and support for registered students. Ask your campus for the number.', phone: '', hours: 'Campus hours', verified: false },
];

export const SAFETY_GROUPS: { id: SafetyResource['group']; title: string }[] = [
  { id: 'emergency', title: 'If you feel unsafe right now' },
  { id: 'gbv', title: 'Gender-based violence support' },
  { id: 'counselling', title: 'Counselling' },
  { id: 'student', title: 'Student wellness' },
];
