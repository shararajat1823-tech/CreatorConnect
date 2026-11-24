import { Component, Input, afterNextRender, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  type MessageRow,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  type RequestStatus,
} from '@creatorconnect/shared';
import { AuthService } from '../../core/auth.service';
import { RequestsService, RequestWithCreator } from '../../core/requests.service';
import { StateViewComponent } from '../../ui/state-view.component';

@Component({
  selector: 'app-thread',
  imports: [FormsModule, RouterLink, StateViewComponent],
  template: `
    <p><a routerLink="/dashboard" class="back">‹ Back to inbox</a></p>

    @if (loading()) {
      <app-state-view [spinner]="true" title="Loading conversation…" />
    } @else if (notFound()) {
      <app-state-view icon="🔒" title="Conversation not available"
        message="This conversation doesn't exist or you don't have access to it.">
        <a class="cc-btn cc-btn--secondary" routerLink="/dashboard">Back to inbox</a>
      </app-state-view>
    } @else if (request()) {
      @let r = request()!;
      <div class="cc-panel head">
        <div class="cc-spread">
          <div>
            <div class="row-top">
              <span class="cc-chip">{{ typeLabel(r.request_type) }}</span>
              <span class="cc-badge" [class]="'cc-badge--' + r.status">{{ statusLabel(r.status) }}</span>
            </div>
            <h1>{{ r.title }}</h1>
            <p class="cc-subtle">
              {{ amRecipient() ? 'From ' + r.sender_name : 'To ' + (r.creatorChannel ?? 'creator') }}
            </p>
          </div>
        </div>

        <dl class="details">
          @if (r.deliverables) { <div><dt>Deliverables</dt><dd>{{ r.deliverables }}</dd></div> }
          @if (r.timeline) { <div><dt>Timeline</dt><dd>{{ r.timeline }}</dd></div> }
          @if (r.request_type === 'paid_sponsorship') {
            <div><dt>Budget</dt><dd>{{ budgetText(r) }}</dd></div>
          }
        </dl>

        @if (actionError()) { <div class="cc-form-error" role="alert">{{ actionError() }}</div> }

        <div class="actions cc-row">
          @if (r.status === 'pending' && amRecipient()) {
            <button class="cc-btn cc-btn--primary" (click)="setStatus('accepted')" [disabled]="busy()">Accept</button>
            <button class="cc-btn cc-btn--secondary" (click)="setStatus('declined')" [disabled]="busy()">Decline</button>
          }
          @if (r.status === 'pending' && !amRecipient()) {
            <button class="cc-btn cc-btn--secondary" (click)="setStatus('withdrawn')" [disabled]="busy()">Withdraw request</button>
          }
        </div>
      </div>

      <section class="messages" aria-label="Messages">
        @for (m of messages(); track m.id) {
          <div class="bubble" [class.mine]="m.sender_id === myId()">
            <p class="body">{{ m.body }}</p>
            <span class="time cc-subtle">{{ time(m.created_at) }}</span>
          </div>
        }
      </section>

      @if (canReply()) {
        <form class="reply cc-panel" (ngSubmit)="send()" novalidate>
          <label class="cc-label" for="reply">Reply</label>
          <textarea id="reply" class="cc-textarea" name="reply" [(ngModel)]="replyBody"
            placeholder="Write a reply…" required></textarea>
          @if (replyError()) { <span class="cc-error">{{ replyError() }}</span> }
          <div class="cc-row" style="margin-top: 0.5rem">
            <button class="cc-btn cc-btn--primary" type="submit" [disabled]="sending()">
              {{ sending() ? 'Sending…' : 'Send reply' }}
            </button>
          </div>
        </form>
      } @else {
        <p class="cc-subtle closed">This conversation is {{ statusLabel(request()!.status).toLowerCase() }}.</p>
      }
    }
  `,
  styles: [
    `
      .back { font-weight: 600; text-decoration: none; }
      .head { margin-bottom: var(--cc-space-5); }
      .head h1 { font-size: var(--cc-text-2xl); margin: 0.3rem 0; }
      .row-top { display: flex; gap: 0.5rem; }
      .details { display: grid; gap: 0.75rem; margin: var(--cc-space-4) 0 0; }
      .details dt { font-size: var(--cc-text-xs); text-transform: uppercase; letter-spacing: 0.05em; color: var(--cc-text-subtle); }
      .details dd { margin: 0.15rem 0 0; }
      .actions { margin-top: var(--cc-space-4); }
      .messages { display: flex; flex-direction: column; gap: var(--cc-space-3); margin: var(--cc-space-5) 0; }
      .bubble { max-width: 80%; padding: 0.7rem 0.95rem; border-radius: var(--cc-radius-lg); background: var(--cc-surface); border: 1px solid var(--cc-border); align-self: flex-start; }
      .bubble.mine { align-self: flex-end; background: var(--cc-accent-soft); border-color: var(--cc-accent-border); }
      .bubble .body { margin: 0; white-space: pre-line; }
      .bubble .time { display: block; margin-top: 0.3rem; font-size: var(--cc-text-xs); }
      .reply { margin-top: var(--cc-space-4); }
      .closed { text-align: center; margin-top: var(--cc-space-5); }
    `,
  ],
})
export class ThreadComponent {
  private readonly requests = inject(RequestsService);
  private readonly auth = inject(AuthService);

  @Input() id = '';

  readonly request = signal<RequestWithCreator | null>(null);
  readonly messages = signal<MessageRow[]>([]);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly busy = signal(false);
  readonly sending = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly replyError = signal<string | null>(null);
  replyBody = '';

  readonly myId = () => this.auth.user()?.id ?? null;
  readonly amRecipient = computed(() => this.request()?.recipient_id === this.myId());
  readonly canReply = computed(() => {
    const s = this.request()?.status;
    return s === 'pending' || s === 'accepted';
  });

  constructor() {
    afterNextRender(async () => {
      await this.auth.whenReady;
      await this.reload();
    });
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    const t = await this.requests.getThread(this.id);
    if (!t.request) {
      this.notFound.set(true);
    } else {
      this.request.set(t.request);
      this.messages.set(t.messages);
    }
    this.loading.set(false);
  }

  async setStatus(status: RequestStatus): Promise<void> {
    this.actionError.set(null);
    this.busy.set(true);
    const res = await this.requests.setStatus(this.id, status);
    this.busy.set(false);
    if (res.error) this.actionError.set(res.error);
    else await this.reload();
  }

  async send(): Promise<void> {
    const body = this.replyBody.trim();
    this.replyError.set(null);
    if (!body) {
      this.replyError.set('Message cannot be empty.');
      return;
    }
    this.sending.set(true);
    const res = await this.requests.postMessage(this.id, body);
    this.sending.set(false);
    if (res.error) {
      this.replyError.set(res.error);
      return;
    }
    this.replyBody = '';
    await this.reload();
  }

  typeLabel(t: string): string {
    return REQUEST_TYPE_LABELS[t as keyof typeof REQUEST_TYPE_LABELS] ?? t;
  }
  statusLabel(s: string): string {
    return REQUEST_STATUS_LABELS[s as keyof typeof REQUEST_STATUS_LABELS] ?? s;
  }
  time(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  budgetText(r: RequestWithCreator): string {
    if (r.budget_negotiable) return 'Negotiable';
    const cur = r.currency ?? 'USD';
    if (r.budget_min != null && r.budget_max != null) return `${cur} ${r.budget_min}–${r.budget_max}`;
    if (r.budget_min != null) return `From ${cur} ${r.budget_min}`;
    if (r.budget_max != null) return `Up to ${cur} ${r.budget_max}`;
    return 'Not specified';
  }
}
