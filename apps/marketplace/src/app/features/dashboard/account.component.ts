import { Component, afterNextRender, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-account',
  template: `
    <h1>Account</h1>
    <div class="cc-panel cc-stack">
      <div>
        <div class="cc-label">Signed in as</div>
        <div>{{ email() ?? '—' }}</div>
      </div>
      <hr class="cc-divider" />
      <button class="cc-btn cc-btn--secondary" type="button" (click)="signOut()">Sign out</button>
    </div>

    <div class="cc-panel danger cc-stack">
      <h2>Delete account</h2>
      <p class="cc-muted">
        Requesting deletion immediately unpublishes your channel and removes it from the public
        directory, and flags your account for removal. This cannot be undone.
      </p>
      @if (deletionDone()) {
        <div class="cc-form-success" role="status">
          Your account is flagged for deletion and your public listing has been removed.
        </div>
      } @else if (confirming()) {
        @if (error()) { <div class="cc-form-error" role="alert">{{ error() }}</div> }
        <div class="cc-row">
          <button class="cc-btn cc-btn--danger" type="button" (click)="confirmDelete()" [disabled]="busy()">
            {{ busy() ? 'Submitting…' : 'Yes, request deletion' }}
          </button>
          <button class="cc-btn cc-btn--ghost" type="button" (click)="confirming.set(false)">Cancel</button>
        </div>
      } @else {
        <button class="cc-btn cc-btn--danger" type="button" (click)="confirming.set(true)">
          Request account deletion
        </button>
      }
    </div>
  `,
  styles: [`.danger { margin-top: var(--cc-space-5); border-color: #eccfcc; } h2 { font-size: var(--cc-text-xl); }`],
})
export class AccountComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal<string | null>(null);
  readonly confirming = signal(false);
  readonly busy = signal(false);
  readonly deletionDone = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    afterNextRender(async () => {
      await this.auth.whenReady;
      this.email.set(this.auth.user()?.email ?? null);
    });
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigateByUrl('/');
  }

  async confirmDelete(): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    const res = await this.auth.requestAccountDeletion();
    this.busy.set(false);
    if (!res.ok) {
      this.error.set(res.error ?? 'Could not submit request.');
      return;
    }
    this.confirming.set(false);
    this.deletionDone.set(true);
  }
}
