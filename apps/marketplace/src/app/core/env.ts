import { environment } from '../../environments/environment';

export const env = environment;

/** True when a Supabase backend is configured. When false the app renders
 *  "not configured" / empty states instead of crashing (useful for prerender). */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

/** Build a public storage URL, or pass through an absolute URL (used by seed data). */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!env.supabaseUrl) return null;
  return `${env.supabaseUrl}/storage/v1/object/public/creator-avatars/${path}`;
}
