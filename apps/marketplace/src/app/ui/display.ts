import {
  COLLAB_FORMAT_LABELS,
  COUNTRIES,
  LANGUAGES,
  NICHES,
  SUBSCRIBER_RANGES,
  type CollabFormat,
} from '@creatorconnect/shared';

const nicheMap = new Map(NICHES.map((n) => [n.id, n.label]));
const langMap = new Map(LANGUAGES.map((l) => [l.code, l.label]));
const countryMap = new Map(COUNTRIES.map((c) => [c.code, c.label]));
const rangeMap = new Map(SUBSCRIBER_RANGES.map((r) => [r.id, r.label]));

export const nicheLabel = (id: string): string => nicheMap.get(id) ?? id;
export const languageLabel = (code: string): string => langMap.get(code) ?? code;
export const countryLabel = (code: string | null | undefined): string =>
  code ? countryMap.get(code) ?? code : '';
export const subscriberRangeLabel = (id: string | null | undefined): string =>
  id ? rangeMap.get(id) ?? id : '';
export const formatLabel = (id: string): string =>
  COLLAB_FORMAT_LABELS[id as CollabFormat] ?? id;

/** Approximate subscriber count like "185K" / "1.2M". */
export function formatSubscribers(count: number | null | undefined): string {
  if (count == null) return '';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(count % 1_000_000 === 0 ? 0 : 1)}M`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}K`;
  return String(count);
}
