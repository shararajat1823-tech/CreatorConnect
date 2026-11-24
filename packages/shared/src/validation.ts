/**
 * Validation helpers shared between the apps and the server/database functions.
 * All user-supplied links are restricted to supported YouTube URL formats.
 */
import {
  COLLAB_FORMATS,
  CollabFormat,
  Currency,
  CURRENCIES,
  LANGUAGE_CODES,
  LIMITS,
  NICHE_IDS,
  RequestType,
} from './domain.js';

/* -------------------------------------------------------------------------- */
/* YouTube URL validation                                                     */
/* -------------------------------------------------------------------------- */

const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

export interface ParsedChannel {
  kind: 'handle' | 'channel_id' | 'custom' | 'user';
  /** Canonical form, e.g. https://www.youtube.com/@handle */
  normalized: string;
  /** The handle / id / name, without the leading @ for handles. */
  value: string;
}

function parseUrl(raw: string): URL | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!YT_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Parse and normalize a YouTube *channel* URL. Returns null if the URL is not a
 * supported channel link.
 */
export function parseYouTubeChannelUrl(raw: string): ParsedChannel | null {
  const url = parseUrl(raw);
  if (!url) return null;
  const path = url.pathname.replace(/\/+$/, ''); // strip trailing slash
  const segments = path.split('/').filter(Boolean);

  // https://www.youtube.com/@handle
  if (segments.length >= 1 && segments[0].startsWith('@')) {
    const handle = segments[0].slice(1);
    if (/^[A-Za-z0-9._-]{3,30}$/.test(handle)) {
      return { kind: 'handle', value: handle, normalized: `https://www.youtube.com/@${handle}` };
    }
    return null;
  }

  // https://www.youtube.com/channel/UCxxxxxxxx
  if (segments[0] === 'channel' && segments[1]) {
    const id = segments[1];
    if (/^UC[A-Za-z0-9_-]{20,30}$/.test(id)) {
      return { kind: 'channel_id', value: id, normalized: `https://www.youtube.com/channel/${id}` };
    }
    return null;
  }

  // https://www.youtube.com/c/CustomName
  if (segments[0] === 'c' && segments[1]) {
    const name = segments[1];
    if (/^[A-Za-z0-9._-]{1,80}$/.test(name)) {
      return { kind: 'custom', value: name, normalized: `https://www.youtube.com/c/${name}` };
    }
    return null;
  }

  // https://www.youtube.com/user/LegacyName
  if (segments[0] === 'user' && segments[1]) {
    const name = segments[1];
    if (/^[A-Za-z0-9._-]{1,80}$/.test(name)) {
      return { kind: 'user', value: name, normalized: `https://www.youtube.com/user/${name}` };
    }
    return null;
  }

  return null;
}

export function isValidYouTubeChannelUrl(raw: string): boolean {
  return parseYouTubeChannelUrl(raw) !== null;
}

/** Extract an 11-character video id from a watch / youtu.be / shorts URL. */
export function parseYouTubeVideoId(raw: string): string | null {
  const url = parseUrl(raw);
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);

  const isId = (v: string | null): v is string => !!v && /^[A-Za-z0-9_-]{11}$/.test(v);

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    return isId(segments[0]) ? segments[0] : null;
  }
  if (segments[0] === 'watch') {
    const v = url.searchParams.get('v');
    return isId(v) ? v : null;
  }
  if (segments[0] === 'shorts' && isId(segments[1])) {
    return segments[1];
  }
  if (segments[0] === 'embed' && isId(segments[1])) {
    return segments[1];
  }
  return null;
}

export function isValidYouTubeVideoUrl(raw: string): boolean {
  return parseYouTubeVideoId(raw) !== null;
}

export function youTubeThumbnailUrl(videoId: string, quality: 'hq' | 'mq' | 'default' = 'hq'): string {
  const name = quality === 'hq' ? 'hqdefault' : quality === 'mq' ? 'mqdefault' : 'default';
  return `https://i.ytimg.com/vi/${videoId}/${name}.jpg`;
}

export function youTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/* -------------------------------------------------------------------------- */
/* Slugs                                                                       */
/* -------------------------------------------------------------------------- */

export function slugify(input: string): string {
  return (input ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/* -------------------------------------------------------------------------- */
/* Structured validation for forms (also run server-side)                     */
/* -------------------------------------------------------------------------- */

export type ValidationErrors = Record<string, string>;

export interface ProfileDraftInput {
  channelName?: string;
  youtubeUrl?: string;
  bio?: string;
  niches?: string[];
  languages?: string[];
  country?: string;
  formats?: string[];
  videoUrls?: string[];
}

export function validateProfileDraft(input: ProfileDraftInput): ValidationErrors {
  const errors: ValidationErrors = {};
  const name = (input.channelName ?? '').trim();
  if (!name) errors.channelName = 'Channel name is required.';
  else if (name.length > LIMITS.channelNameMax)
    errors.channelName = `Keep the channel name under ${LIMITS.channelNameMax} characters.`;

  if (!input.youtubeUrl || !isValidYouTubeChannelUrl(input.youtubeUrl)) {
    errors.youtubeUrl =
      'Enter a valid YouTube channel URL (e.g. https://www.youtube.com/@yourchannel).';
  }

  if (input.bio && input.bio.length > LIMITS.bioMax)
    errors.bio = `Keep your bio under ${LIMITS.bioMax} characters.`;

  if (input.niches && input.niches.length > LIMITS.maxNiches)
    errors.niches = `Choose up to ${LIMITS.maxNiches} niches.`;
  if (input.niches && input.niches.some((n) => !NICHE_IDS.includes(n)))
    errors.niches = 'One or more niches are not recognised.';

  if (input.languages && input.languages.some((l) => !LANGUAGE_CODES.includes(l)))
    errors.languages = 'One or more languages are not recognised.';

  if (input.formats && input.formats.some((f) => !COLLAB_FORMATS.includes(f as CollabFormat)))
    errors.formats = 'One or more collaboration formats are not recognised.';

  if (input.videoUrls) {
    if (input.videoUrls.length > LIMITS.maxSelectedVideos)
      errors.videoUrls = `Select up to ${LIMITS.maxSelectedVideos} videos.`;
    else if (input.videoUrls.some((u) => u.trim() && !isValidYouTubeVideoUrl(u)))
      errors.videoUrls = 'Every video link must be a valid YouTube video URL.';
  }

  return errors;
}

export interface RequestInput {
  requestType?: string;
  senderName?: string;
  title?: string;
  deliverables?: string;
  message?: string;
  timeline?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency?: string;
  budgetNegotiable?: boolean;
}

export function validateRequest(input: RequestInput): ValidationErrors {
  const errors: ValidationErrors = {};

  if (input.requestType !== 'paid_sponsorship' && input.requestType !== 'creator_collaboration')
    errors.requestType = 'Choose a valid request type.';

  const senderName = (input.senderName ?? '').trim();
  if (!senderName) errors.senderName = 'Tell the creator who is reaching out.';
  else if (senderName.length > 120) errors.senderName = 'That name is too long.';

  const title = (input.title ?? '').trim();
  if (!title) errors.title = 'A short brief title is required.';
  else if (title.length > LIMITS.briefTitleMax)
    errors.title = `Keep the title under ${LIMITS.briefTitleMax} characters.`;

  const message = (input.message ?? '').trim();
  if (!message) errors.message = 'Add a message describing what you have in mind.';
  else if (message.length > LIMITS.messageMax)
    errors.message = `Keep the message under ${LIMITS.messageMax} characters.`;

  if (input.deliverables && input.deliverables.length > LIMITS.deliverablesMax)
    errors.deliverables = `Keep deliverables under ${LIMITS.deliverablesMax} characters.`;

  if (input.requestType === 'paid_sponsorship' && !input.budgetNegotiable) {
    const { budgetMin, budgetMax, currency } = input;
    if (budgetMin != null || budgetMax != null) {
      if (currency && !CURRENCIES.includes(currency as Currency))
        errors.currency = 'Choose a supported currency.';
      if (budgetMin != null && budgetMin < 0) errors.budgetMin = 'Budget cannot be negative.';
      if (budgetMax != null && budgetMax < 0) errors.budgetMax = 'Budget cannot be negative.';
      if (budgetMin != null && budgetMax != null && budgetMin > budgetMax)
        errors.budgetMax = 'The maximum budget must be greater than the minimum.';
    }
  }

  return errors;
}

export function isValidRequestType(value: string): value is RequestType {
  return value === 'paid_sponsorship' || value === 'creator_collaboration';
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
