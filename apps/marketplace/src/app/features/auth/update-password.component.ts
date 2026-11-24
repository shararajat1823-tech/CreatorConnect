import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { MetaService } from '../../core/meta.service';
import { AUTH_SHELL_STYLES } from './auth-shell';

@Component({
  selector: 'app-update-password',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="cc-container auth-wrap">
      <div class="cc-panel auth-card">
        @if (done()) {
          <h1>Password updated</h1>
          <p class="cc-muted">You can now use your new password.</p>
          <a class="cc-btn cc-btn--primary cc-btn--block" routerLink="/dashboard">Go to dashboard</a>
        } @else {
          <h1>Set a new password</h1>
          <p class="cc-muted">Choose a new password for your account.</p>
          @if (error()) { <div class="cc-form-error" role="alert">{{ error() }}</div> }
          <form (ngSubmit)="submit()" novalidate>
            <div class="cc-field">
              <label class="cc-label" for="password">New password</label>
              <input id="password" class="cc-input" type="password" name="password" autocomplete="new-password"
                [(ngModel)]="password" minlength="8" required />
              <span class="cc-hint">At least 8 characters.</span>
            </div>
            <button class="cc-btn cc-btn--primary cc-btn--block" type="submit" [disabled]="busy()">
              {{ busy() ? 'Saving…' : 'Update password' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [AUTH_SHELL_STYLES],
})
export class UpdatePasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly meta = inject(MetaService);
  private readonly router = inject(Router);
  password = '';
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.meta.setPage({ title: 'Set a new password', noindex: true });
  }

  async submit(): Promise<void> {
    this.error.set(null);
    if (this.password.length < 8) {
      this.error.set('Password must be at least 8 characters.');
      return;
    }
    this.busy.set(true);
    const res = await this.auth.updatePassword(this.password);
    this.busy.set(false);
    if (!res.ok) this.error.set(res.error ?? 'Could not update password.');
    else this.done.set(true);
  }
}
