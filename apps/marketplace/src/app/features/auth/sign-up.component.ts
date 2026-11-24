import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { MetaService } from '../../core/meta.service';
import { AUTH_SHELL_STYLES } from './auth-shell';

@Component({
  selector: 'app-sign-up',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="cc-container auth-wrap">
      <div class="cc-panel auth-card">
        @if (sent()) {
          <h1>Check your email</h1>
          <p class="cc-muted">
            We sent a confirmation link to <strong>{{ email }}</strong>. Click it to activate your
            account, then sign in.
          </p>
          <a class="cc-btn cc-btn--secondary cc-btn--block" routerLink="/auth/sign-in">Go to sign in</a>
          <p class="auth-foot">
            Didn’t get it?
            <button class="linkbtn" type="button" (click)="resend()" [disabled]="busy()">Resend</button>
          </p>
        } @else {
          <h1>Create your account</h1>
          <p class="cc-muted">One account to send briefs and list your own channel.</p>
          @if (error()) { <div class="cc-form-error" role="alert">{{ error() }}</div> }
          <form (ngSubmit)="submit()" novalidate>
            <div class="cc-field">
              <label class="cc-label" for="name">Display name</label>
              <input id="name" class="cc-input" name="name" autocomplete="name" [(ngModel)]="name" required />
            </div>
            <div class="cc-field">
              <label class="cc-label" for="email">Email</label>
              <input id="email" class="cc-input" type="email" name="email" autocomplete="email" [(ngModel)]="email" required />
            </div>
            <div class="cc-field">
              <label class="cc-label" for="password">Password</label>
              <input id="password" class="cc-input" type="password" name="password" autocomplete="new-password"
                [(ngModel)]="password" minlength="8" required />
              <span class="cc-hint">At least 8 characters.</span>
            </div>
            <button class="cc-btn cc-btn--primary cc-btn--block" type="submit" [disabled]="busy()">
              {{ busy() ? 'Creating…' : 'Create account' }}
            </button>
          </form>
          <p class="auth-foot">Already have an account? <a routerLink="/auth/sign-in">Sign in</a></p>
        }
      </div>
    </div>
  `,
  styles: [
    AUTH_SHELL_STYLES +
      `.linkbtn { background: none; border: 0; color: var(--cc-accent-ink); font: inherit; font-weight: 600; cursor: pointer; text-decoration: underline; }`,
  ],
})
export class SignUpComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(MetaService);

  name = '';
  email = '';
  password = '';
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly sent = signal(false);

  constructor() {
    this.meta.setPage({ title: 'Create an account', noindex: true });
  }

  async submit(): Promise<void> {
    this.error.set(null);
    if (this.password.length < 8) {
      this.error.set('Password must be at least 8 characters.');
      return;
    }
    this.busy.set(true);
    const res = await this.auth.signUp(this.email.trim(), this.password, this.name.trim());
    this.busy.set(false);
    if (!res.ok) {
      this.error.set(res.error ?? 'Could not create account.');
      return;
    }
    if (res.needsConfirmation) {
      this.sent.set(true);
    } else {
      const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '/dashboard';
      this.router.navigateByUrl(redirect);
    }
  }

  async resend(): Promise<void> {
    this.busy.set(true);
    await this.auth.resendConfirmation(this.email.trim());
    this.busy.set(false);
  }
}
