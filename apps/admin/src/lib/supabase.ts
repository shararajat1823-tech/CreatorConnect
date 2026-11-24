import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@creatorconnect/shared';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(url && anonKey);
export const marketplaceUrl = (
  (import.meta.env.VITE_MARKETPLACE_URL as string | undefined) || 'http://localhost:4200'
).replace(/\/$/, '');

export const supabase: SupabaseClient<Database> | null = isConfigured
  ? createClient<Database>(url as string, anonKey as string)
  : null;

/** Public URL for an avatar path (or pass through an absolute URL from seed data). */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!url) return null;
  return `${url}/storage/v1/object/public/creator-avatars/${path}`;
}
