import {
  COLLAB_FORMAT_LABELS,
  COUNTRIES,
  CREATOR_STATUS_LABELS,
  LANGUAGES,
  NICHES,
  REPORT_REASON_LABELS,
  SUBSCRIBER_RANGES,
  type CollabFormat,
  type CreatorStatus,
  type ReportReason,
} from '@creatorconnect/shared';

const nicheMap = new Map(NICHES.map((n) => [n.id, n.label]));
const langMap = new Map(LANGUAGES.map((l) => [l.code, l.label]));
const countryMap = new Map(COUNTRIES.map((c) => [c.code, c.label]));
const rangeMap = new Map(SUBSCRIBER_RANGES.map((r) => [r.id, r.label]));

export const nicheLabel = (id: string) => nicheMap.get(id) ?? id;
export const languageLabel = (code: string) => langMap.get(code) ?? code;
export const countryLabel = (code: string | null | undefined) =>
  code ? countryMap.get(code) ?? code : '';
export const rangeLabel = (id: string | null | undefined) => (id ? rangeMap.get(id) ?? id : '');
export const formatLabel = (id: string) => COLLAB_FORMAT_LABELS[id as CollabFormat] ?? id;
export const statusLabel = (s: string) => CREATOR_STATUS_LABELS[s as CreatorStatus] ?? s;
export const reportReasonLabel = (r: string) => REPORT_REASON_LABELS[r as ReportReason] ?? r;

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function subscribersText(count: number | null | undefined): string {
  if (count == null) return '—';
  return count.toLocaleString();
}
