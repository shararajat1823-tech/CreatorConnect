import { Injectable, computed, inject, signal } from '@angular/core';
import type { Session, User } from '@supabase/supabase-js';
import { env } from './env';
import { SupabaseService } from './supabase.service';

export interface AuthResult {
  ok: boolean;
  error?: string;
  /** Set on sign-up when email confirmation is required. */
  needsConfirmation?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supa = inject(SupabaseService);

  readonly user = signal<User | null>(null);
  readonly session = signal<Session | null>(null);
  /** True once the initial session lookup has completed (browser only). */
  readonly ready = signal(false);
  readonly isSignedIn = computed(() => this.user() !== null);

  private markReady!: () => void;
  /** Resolves once the initial session has been determined. */
  readonly whenReady = new Promise<void>((resolve) => (this.markReady = resolve));

  constructor() {
    const client = this.supa.client;
    if (!client || !this.supa.isBrowser) {
      // On the server we never have a session; mark ready so guards don't hang.
      this.setReady();
      return;
    }
    client.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
      this.user.set(data.session?.user ?? null);
      this.setReady();
    });
    client.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      this.user.set(session?.user ?? null);
      this.setReady();
    });
  }

  private setReady(): void {
    if (!this.ready()) {
      this.ready.set(true);
      this.markReady();
    }
  }

  async signUp(email: string, password: string, displayName: string): Promise<AuthResult> {
    const client = this.supa.client;
    if (!client) return { ok: false, error: 'Backend not configured.' };
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${env.siteUrl}/auth/confirm`,
      },
    });
    if (error) return { ok: false, error: error.message };
    // When confirmations are on, there's no active session yet.
    return { ok: true, needsConfirmation: !data.session };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const client = this.supa.client;
    if (!client) return { ok: false, error: 'Backend not configured.' };
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async signOut(): Promise<void> {
    await this.supa.client?.auth.signOut();
    this.user.set(null);
    this.session.set(null);
  }

  async sendPasswordReset(email: string): Promise<AuthResult> {
    const client = this.supa.client;
    if (!client) return { ok: false, error: 'Backend not configured.' };
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.siteUrl}/auth/update-password`,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async updatePassword(password: string): Promise<AuthResult> {
    const client = this.supa.client;
    if (!client) return { ok: false, error: 'Backend not configured.' };
    const { error } = await client.auth.updateUser({ password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async resendConfirmation(email: string): Promise<AuthResult> {
    const client = this.supa.client;
    if (!client) return { ok: false, error: 'Backend not configured.' };
    const { error } = await client.auth.resend({ type: 'signup', email });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async requestAccountDeletion(): Promise<AuthResult> {
    const client = this.supa.client;
    if (!client) return { ok: false, error: 'Backend not configured.' };
    const { error } = await client.rpc('request_account_deletion');
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }
}
