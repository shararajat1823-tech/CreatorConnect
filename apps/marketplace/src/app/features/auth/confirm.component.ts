import { Component, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { MetaService } from '../../core/meta.service';
import { AUTH_SHELL_STYLES } from './auth-shell';

@Component({
  selector: 'app-confirm',
  imports: [RouterLink],
  template: `
    <div class="cc-container auth-wrap">
      <div class="cc-panel auth-card">
        @if (status() === 'ok') {
          <h1>Email confirmed 🎉</h1>
          <p class="cc-muted">Your account is ready. Welcome aboard!</p>
          <a class="cc-btn cc-btn--primary cc-btn--block" routerLink="/dashboard">Go to your dashboard</a>
          <p class="auth-foot"><a routerLink="/list-your-channel">Or list your channel</a></p>
        } @else if (status() === 'pending') {
          <h1>Confirming…</h1>
          <p class="cc-muted">One moment while we confirm your email.</p>
        } @else {
          <h1>Confirmation link</h1>
          <p class="cc-muted">
            If your link has expired, sign in to request a new confirmation email.
          </p>
          <a class="cc-btn cc-btn--secondary cc-btn--block" routerLink="/auth/sign-in">Go to sign in</a>
        }
      </div>
    </div>
  `,
  styles: [AUTH_SHELL_STYLES],
})
export class ConfirmComponent {
  private readonly auth = inject(AuthService);
  private readonly meta = inject(MetaService);
  readonly status = signal<'pending' | 'ok' | 'unknown'>('pending');

  constructor() {
    this.meta.setPage({ title: 'Confirm your email', noindex: true });
    afterNextRender(async () => {
      await this.auth.whenReady;
      // Give Supabase a tick to process the token from the URL.
      setTimeout(() => this.status.set(this.auth.isSignedIn() ? 'ok' : 'unknown'), 600);
    });
  }
}
