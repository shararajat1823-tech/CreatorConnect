import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS } from '@creatorconnect/shared';
import { AuthService } from '../../core/auth.service';
import { RequestsService, RequestWithCreator } from '../../core/requests.service';
import { StateViewComponent } from '../../ui/state-view.component';

@Component({
  selector: 'app-inbox',
  imports: [RouterLink, StateViewComponent],
  template: `
    <div class="cc-spread">
      <h1>Your requests</h1>
      <div class="switch" role="tablist" aria-label="Inbox folder">
        <button role="tab" [attr.aria-selected]="tab() === 'received'" [class.active]="tab() === 'received'"
          (click)="tab.set('received')">Received ({{ received().length }})</button>
        <button role="tab" [attr.aria-selected]="tab() === 'sent'" [class.active]="tab() === 'sent'"
          (click)="tab.set('sent')">Sent ({{ sent().length }})</button>
      </div>
    </div>

    @if (loading()) {
      <app-state-view [spinner]="true" title="Loading your inbox…" />
    } @else if (current().length === 0) {
      @if (tab() === 'received') {
        <app-state-view icon="📥" title="No requests yet"
          message="When someone sends your channel a brief or a collaboration proposal, it shows up here.">
          <a class="cc-btn cc-btn--secondary" routerLink="/dashboard/channel">Set up your channel</a>
        </app-state-view>
      } @else {
        <app-state-view icon="✉️" title="You haven't sent any requests"
          message="Find a creator and send a sponsorship brief or collaboration proposal.">
          <a class="cc-btn cc-btn--primary" routerLink="/directory">Browse creators</a>
        </app-state-view>
      }
    } @else {
      <ul class="list">
        @for (r of current(); track r.id) {
          <li>
            <a class="row cc-card" [routerLink]="['/dashboard/requests', r.id]">
              <div class="row-main">
                <div class="row-top">
                  <span class="cc-chip">{{ typeLabel(r.request_type) }}</span>
                  <span class="cc-badge" [class]="'cc-badge--' + r.status">{{ statusLabel(r.status) }}</span>
                </div>
                <div class="title">{{ r.title }}</div>
                <div class="cc-subtle sub">
                  @if (tab() === 'received') {
                    From {{ r.sender_name }}
                  } @else {
                    To {{ r.creatorChannel ?? 'creator' }}
                  }
                  · {{ formatDate(r.updated_at) }}
                </div>
              </div>
              <span class="chevron" aria-hidden="true">›</span>
            </a>
          </li>
        }
      </ul>
    }
  `,
  styles: [
    `
      .switch { display: inline-flex; background: var(--cc-bg-subtle); border-radius: var(--cc-radius-pill); padding: 3px; }
      .switch button { border: 0; background: transparent; font: inherit; font-weight: 600; font-size: var(--cc-text-sm); padding: 0.4rem 0.9rem; border-radius: var(--cc-radius-pill); cursor: pointer; color: var(--cc-text-muted); }
      .switch button.active { background: var(--cc-surface); color: var(--cc-text); box-shadow: var(--cc-shadow-sm); }
      .list { list-style: none; padding: 0; margin: var(--cc-space-5) 0 0; display: flex; flex-direction: column; gap: var(--cc-space-3); }
      .row { display: flex; align-items: center; gap: var(--cc-space-4); padding: var(--cc-space-4); text-decoration: none; color: inherit; }
      .row:hover { border-color: var(--cc-border-strong); box-shadow: var(--cc-shadow-sm); }
      .row-main { flex: 1; min-width: 0; }
      .row-top { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.3rem; flex-wrap: wrap; }
      .title { font-weight: 700; }
      .sub { font-size: var(--cc-text-sm); }
      .chevron { font-size: 1.5rem; color: var(--cc-text-subtle); }
    `,
  ],
})
export class InboxComponent {
  private readonly requests = inject(RequestsService);
  private readonly auth = inject(AuthService);

  readonly tab = signal<'received' | 'sent'>('received');
  readonly received = signal<RequestWithCreator[]>([]);
  readonly sent = signal<RequestWithCreator[]>([]);
  readonly loading = signal(true);
  readonly current = computed(() => (this.tab() === 'received' ? this.received() : this.sent()));

  constructor() {
    afterNextRender(async () => {
      await this.auth.whenReady;
      const uid = this.auth.user()?.id;
      if (!uid) {
        this.loading.set(false);
        return;
      }
      const [rec, snt] = await Promise.all([
        this.requests.listReceived(uid),
        this.requests.listSent(uid),
      ]);
      this.received.set(rec);
      this.sent.set(snt);
      if (rec.length === 0 && snt.length > 0) this.tab.set('sent');
      this.loading.set(false);
    });
  }

  typeLabel(t: string): string {
    return REQUEST_TYPE_LABELS[t as keyof typeof REQUEST_TYPE_LABELS] ?? t;
  }
  statusLabel(s: string): string {
    return REQUEST_STATUS_LABELS[s as keyof typeof REQUEST_STATUS_LABELS] ?? s;
  }
  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
