import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { MetaService } from '../../core/meta.service';
import { AUTH_SHELL_STYLES } from './auth-shell';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="cc-container auth-wrap">
      <div class="cc-panel auth-card">
        @if (sent()) {
          <h1>Check your email</h1>
          <p class="cc-muted">
            If an account exists for <strong>{{ email }}</strong>, we’ve sent a link to reset your
            password.
          </p>
          <a class="cc-btn cc-btn--secondary cc-btn--block" routerLink="/auth/sign-in">Back to sign in</a>
        } @else {
          <h1>Reset your password</h1>
          <p class="cc-muted">Enter your email and we’ll send a reset link.</p>
          @if (error()) { <div class="cc-form-error" role="alert">{{ error() }}</div> }
          <form (ngSubmit)="submit()" novalidate>
            <div class="cc-field">
              <label class="cc-label" for="email">Email</label>
              <input id="email" class="cc-input" type="email" name="email" autocomplete="email" [(ngModel)]="email" required />
            </div>
            <button class="cc-btn cc-btn--primary cc-btn--block" type="submit" [disabled]="busy()">
              {{ busy() ? 'Sending…' : 'Send reset link' }}
            </button>
          </form>
          <p class="auth-foot"><a routerLink="/auth/sign-in">Back to sign in</a></p>
        }
      </div>
    </div>
  `,
  styles: [AUTH_SHELL_STYLES],
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly meta = inject(MetaService);
  email = '';
  readonly busy = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.meta.setPage({ title: 'Reset your password', noindex: true });
  }

  async submit(): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    const res = await this.auth.sendPasswordReset(this.email.trim());
    this.busy.set(false);
    if (!res.ok) this.error.set(res.error ?? 'Could not send reset email.');
    else this.sent.set(true);
  }
}
