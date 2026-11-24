import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { MetaService } from '../../core/meta.service';
import { AUTH_SHELL_STYLES } from './auth-shell';

@Component({
  selector: 'app-sign-in',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="cc-container auth-wrap">
      <div class="cc-panel auth-card">
        <h1>Sign in</h1>
        <p class="cc-muted">Welcome back.</p>
        @if (error()) { <div class="cc-form-error" role="alert">{{ error() }}</div> }
        <form (ngSubmit)="submit()" novalidate>
          <div class="cc-field">
            <label class="cc-label" for="email">Email</label>
            <input id="email" class="cc-input" type="email" name="email" autocomplete="email"
              [(ngModel)]="email" required />
          </div>
          <div class="cc-field">
            <label class="cc-label" for="password">Password</label>
            <input id="password" class="cc-input" type="password" name="password"
              autocomplete="current-password" [(ngModel)]="password" required />
          </div>
          <div class="auth-links">
            <span></span>
            <a routerLink="/auth/reset">Forgot password?</a>
          </div>
          <button class="cc-btn cc-btn--primary cc-btn--block" type="submit" [disabled]="busy()">
            {{ busy() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
        <p class="auth-foot">
          New here? <a routerLink="/auth/sign-up" [queryParams]="{ redirect: redirect() }">Create an account</a>
        </p>
      </div>
    </div>
  `,
  styles: [AUTH_SHELL_STYLES],
})
export class SignInComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(MetaService);

  email = '';
  password = '';
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly redirect = () => this.route.snapshot.queryParamMap.get('redirect') ?? '/dashboard';

  constructor() {
    this.meta.setPage({ title: 'Sign in', noindex: true });
  }

  async submit(): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    const res = await this.auth.signIn(this.email.trim(), this.password);
    this.busy.set(false);
    if (!res.ok) {
      this.error.set(res.error ?? 'Could not sign in.');
      return;
    }
    this.router.navigateByUrl(this.redirect());
  }
}
