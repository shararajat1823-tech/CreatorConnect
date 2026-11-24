import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import type { Database } from '@creatorconnect/shared';
import { env, isSupabaseConfigured } from './env';

/**
 * Provides a typed Supabase client.
 * - In the browser: persists the auth session (localStorage) and detects the
 *   session returned in confirmation/recovery links.
 * - On the server (SSR/prerender): an anonymous, session-less client used only
 *   for reading public data. If Supabase isn't configured, `client` is null and
 *   callers fall back to empty/error states.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly configured = isSupabaseConfigured;
  readonly isBrowser = isPlatformBrowser(this.platformId);
  private _client: SupabaseClient<Database> | null = null;

  get client(): SupabaseClient<Database> | null {
    if (!this.configured) return null;
    if (this._client) return this._client;
    this._client = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: this.isBrowser,
        autoRefreshToken: this.isBrowser,
        detectSessionInUrl: this.isBrowser,
      },
    });
    return this._client;
  }
}
