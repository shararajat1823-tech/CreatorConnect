/**
 * Domain model: enumerations, labels and reference data shared by the
 * marketplace, the admin app and the database. These string values match the
 * Postgres enums / check constraints defined in the Supabase migrations — keep
 * them in sync.
 */

/* -------------------------------------------------------------------------- */
/* Creator profile lifecycle                                                  */
/* -------------------------------------------------------------------------- */

export const CREATOR_STATUSES = [
  'draft',
  'under_review',
  'changes_requested',
  'published',
  'suspended',
] as const;
export type CreatorStatus = (typeof CREATOR_STATUSES)[number];

export const CREATOR_STATUS_LABELS: Record<CreatorStatus, string> = {
  draft: 'Draft',
  under_review: 'Under Review',
  changes_requested: 'Changes Requested',
  published: 'Published',
  suspended: 'Suspended',
};

/** Statuses whose public, approved content is visible in the directory. */
export const PUBLIC_CREATOR_STATUSES: CreatorStatus[] = ['published'];

/* -------------------------------------------------------------------------- */
/* Collaboration / sponsorship formats                                        */
/* -------------------------------------------------------------------------- */

export const COLLAB_FORMATS = [
  'sponsored_mention',
  'dedicated_video',
  'shorts',
  'product_review',
  'guest_appearance',
  'joint_video',
] as const;
export type CollabFormat = (typeof COLLAB_FORMATS)[number];

export const COLLAB_FORMAT_LABELS: Record<CollabFormat, string> = {
  sponsored_mention: 'Sponsored mention',
  dedicated_video: 'Dedicated video',
  shorts: 'Shorts',
  product_review: 'Product review',
  guest_appearance: 'Guest appearance',
  joint_video: 'Joint video',
};

/* -------------------------------------------------------------------------- */
/* Requests (sponsorship / collaboration)                                     */
/* -------------------------------------------------------------------------- */

export const REQUEST_TYPES = ['paid_sponsorship', 'creator_collaboration'] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  paid_sponsorship: 'Paid Sponsorship',
  creator_collaboration: 'Creator Collaboration',
};

export const REQUEST_STATUSES = ['pending', 'accepted', 'declined', 'withdrawn'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
};

/* -------------------------------------------------------------------------- */
/* Moderation                                                                 */
/* -------------------------------------------------------------------------- */

export const MODERATION_ACTIONS = [
  'approved',
  'changes_requested',
  'suspended',
  'unpublished',
  'reinstated',
] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

export const REPORT_REASONS = [
  'misleading',
  'impersonation',
  'spam',
  'inappropriate',
  'not_a_real_channel',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  misleading: 'Misleading or inaccurate',
  impersonation: 'Impersonation',
  spam: 'Spam',
  inappropriate: 'Inappropriate content',
  not_a_real_channel: 'Not a real channel',
  other: 'Other',
};

export const REPORT_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/* -------------------------------------------------------------------------- */
/* Reference data for filters                                                 */
/* -------------------------------------------------------------------------- */

export interface SubscriberRange {
  id: string;
  label: string;
  min: number;
  max: number | null;
}

export const SUBSCRIBER_RANGES: SubscriberRange[] = [
  { id: 'under_1k', label: 'Under 1K', min: 0, max: 999 },
  { id: '1k_10k', label: '1K – 10K', min: 1_000, max: 9_999 },
  { id: '10k_100k', label: '10K – 100K', min: 10_000, max: 99_999 },
  { id: '100k_1m', label: '100K – 1M', min: 100_000, max: 999_999 },
  { id: '1m_plus', label: '1M+', min: 1_000_000, max: null },
];

export const SUBSCRIBER_RANGE_IDS = SUBSCRIBER_RANGES.map((r) => r.id);

/** Map an exact subscriber count to the matching range id (or null). */
export function subscriberRangeForCount(count: number | null | undefined): string | null {
  if (count == null) return null;
  const match = SUBSCRIBER_RANGES.find((r) => count >= r.min && (r.max == null || count <= r.max));
  return match ? match.id : null;
}

export interface Niche {
  id: string;
  label: string;
}

export const NICHES: Niche[] = [
  { id: 'gaming', label: 'Gaming' },
  { id: 'tech', label: 'Tech & Reviews' },
  { id: 'beauty', label: 'Beauty & Fashion' },
  { id: 'fitness', label: 'Fitness & Health' },
  { id: 'food', label: 'Food & Cooking' },
  { id: 'travel', label: 'Travel' },
  { id: 'education', label: 'Education' },
  { id: 'finance', label: 'Finance & Business' },
  { id: 'lifestyle', label: 'Lifestyle & Vlogs' },
  { id: 'music', label: 'Music' },
  { id: 'comedy', label: 'Comedy & Entertainment' },
  { id: 'diy', label: 'DIY & Crafts' },
  { id: 'parenting', label: 'Parenting & Family' },
  { id: 'sports', label: 'Sports' },
  { id: 'arts', label: 'Art & Design' },
];

export const NICHE_IDS = NICHES.map((n) => n.id);

export interface LanguageOption {
  code: string;
  label: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'hi', label: 'Hindi' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ar', label: 'Arabic' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ru', label: 'Russian' },
  { code: 'it', label: 'Italian' },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export interface CountryOption {
  code: string;
  label: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'IN', label: 'India' },
  { code: 'BR', label: 'Brazil' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'ES', label: 'Spain' },
  { code: 'MX', label: 'Mexico' },
  { code: 'JP', label: 'Japan' },
  { code: 'KR', label: 'South Korea' },
  { code: 'ID', label: 'Indonesia' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'ZA', label: 'South Africa' },
  { code: 'OTHER', label: 'Other' },
];

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code);

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'BRL', 'CAD', 'AUD', 'JPY'] as const;
export type Currency = (typeof CURRENCIES)[number];

/* -------------------------------------------------------------------------- */
/* Limits (mirror server-side validation and DB constraints)                  */
/* -------------------------------------------------------------------------- */

export const LIMITS = {
  channelNameMax: 80,
  bioMax: 2000,
  briefTitleMax: 120,
  messageMax: 4000,
  deliverablesMax: 1000,
  maxSelectedVideos: 6,
  maxNiches: 3,
  maxFormats: COLLAB_FORMATS.length,
  imageMaxBytes: 5 * 1024 * 1024, // 5 MB
  imageAllowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

/** Human label helpers that fall back to the raw id. */
export function labelFor<T extends string>(map: Record<T, string>, id: T | string): string {
  return (map as Record<string, string>)[id] ?? id;
}
