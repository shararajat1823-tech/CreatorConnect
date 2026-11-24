import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CURRENCIES,
  REQUEST_TYPE_LABELS,
  type RequestType,
  validateRequest,
} from '@creatorconnect/shared';
import { AuthService } from '../../core/auth.service';
import { RequestsService } from '../../core/requests.service';

@Component({
  selector: 'app-request-form',
  imports: [FormsModule, RouterLink],
  template: `
    <form class="cc-panel" (ngSubmit)="submit()" novalidate>
      <h2>{{ typeLabel() }}</h2>
      <p class="cc-muted">
        {{
          type() === 'paid_sponsorship'
            ? 'Send a paid sponsorship brief to ' + channelName() + '.'
            : 'Propose a collaboration with ' + channelName() + '.'
        }}
      </p>

      @if (success()) {
        <div class="cc-form-success" role="status">
          Your request was sent. You can follow the conversation in your inbox.
        </div>
        <div class="cc-row" style="margin-top: 1rem">
          <a class="cc-btn cc-btn--primary" [routerLink]="['/dashboard/requests', success()]">
            Open conversation
          </a>
          <a class="cc-btn cc-btn--ghost" routerLink="/dashboard">Go to dashboard</a>
        </div>
      } @else {
        @if (formError()) {
          <div class="cc-form-error" role="alert">{{ formError() }}</div>
        }

        <div class="cc-field">
          <label class="cc-label" for="r-name">Your name or organization</label>
          <input id="r-name" class="cc-input" name="senderName" [(ngModel)]="model.senderName"
            [attr.aria-invalid]="!!errors()['senderName']" required />
          @if (errors()['senderName']) { <span class="cc-error">{{ errors()['senderName'] }}</span> }
        </div>

        <div class="cc-field">
          <label class="cc-label" for="r-title">Brief title</label>
          <input id="r-title" class="cc-input" name="title" [(ngModel)]="model.title"
            placeholder="e.g. Spring launch — dedicated video"
            [attr.aria-invalid]="!!errors()['title']" required />
          @if (errors()['title']) { <span class="cc-error">{{ errors()['title'] }}</span> }
        </div>

        <div class="cc-field">
          <label class="cc-label" for="r-deliverables">
            {{ type() === 'paid_sponsorship' ? 'Requested deliverables' : 'What would each of you contribute?' }}
          </label>
          <textarea id="r-deliverables" class="cc-textarea" name="deliverables"
            [(ngModel)]="model.deliverables"
            placeholder="{{ type() === 'paid_sponsorship' ? 'e.g. One dedicated 8–10 min video + 1 Shorts teaser' : 'e.g. You film the intro, I film the challenge, we both cross-post' }}"></textarea>
        </div>

        <div class="cc-field">
          <label class="cc-label" for="r-timeline">Preferred timeline</label>
          <input id="r-timeline" class="cc-input" name="timeline" [(ngModel)]="model.timeline"
            placeholder="e.g. Mid-April, 3 week lead time" />
        </div>

        @if (type() === 'paid_sponsorship') {
          <fieldset class="budget">
            <legend class="cc-label">Budget</legend>
            <label class="neg">
              <input type="checkbox" name="neg" [(ngModel)]="model.budgetNegotiable" />
              Negotiable
            </label>
            @if (!model.budgetNegotiable) {
              <div class="budget-row">
                <input class="cc-input" type="number" min="0" name="bmin" [(ngModel)]="model.budgetMin" placeholder="Min" aria-label="Minimum budget" />
                <span aria-hidden="true">–</span>
                <input class="cc-input" type="number" min="0" name="bmax" [(ngModel)]="model.budgetMax" placeholder="Max" aria-label="Maximum budget" />
                <select class="cc-select" name="cur" [(ngModel)]="model.currency" aria-label="Currency">
                  @for (c of currencies; track c) { <option [value]="c">{{ c }}</option> }
                </select>
              </div>
              @if (errors()['budgetMax']) { <span class="cc-error">{{ errors()['budgetMax'] }}</span> }
            }
          </fieldset>
        }

        <div class="cc-field">
          <label class="cc-label" for="r-message">Message</label>
          <textarea id="r-message" class="cc-textarea" name="message" [(ngModel)]="model.message"
            [attr.aria-invalid]="!!errors()['message']" required
            placeholder="Introduce yourself and what you have in mind."></textarea>
          @if (errors()['message']) { <span class="cc-error">{{ errors()['message'] }}</span> }
        </div>

        <div class="cc-row">
          <button class="cc-btn cc-btn--primary" type="submit" [disabled]="saving()">
            {{ saving() ? 'Sending…' : 'Send request' }}
          </button>
          <button class="cc-btn cc-btn--ghost" type="button" (click)="cancel.emit()">Cancel</button>
        </div>
      }
    </form>
  `,
  styles: [
    `
      .budget { border: 1px solid var(--cc-border); border-radius: var(--cc-radius-md); padding: var(--cc-space-3) var(--cc-space-4); margin-bottom: var(--cc-space-4); }
      .budget legend { padding: 0 0.3rem; }
      .neg { display: inline-flex; align-items: center; gap: 0.4rem; font-size: var(--cc-text-sm); margin-bottom: 0.5rem; }
      .budget-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
      .budget-row .cc-input { max-width: 120px; }
    `,
  ],
})
export class RequestFormComponent {
  private readonly requests = inject(RequestsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly creatorId = input.required<string>();
  readonly channelName = input.required<string>();
  readonly type = input.required<RequestType>();
  readonly cancel = output<void>();
  readonly sent = output<string>();

  readonly errors = signal<Record<string, string>>({});
  readonly formError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly success = signal<string | null>(null);

  readonly currencies = CURRENCIES;

  model = {
    senderName:
      (this.auth.user()?.user_metadata?.['display_name'] as string) ||
      this.auth.user()?.email?.split('@')[0] ||
      '',
    title: '',
    deliverables: '',
    timeline: '',
    message: '',
    budgetNegotiable: false,
    budgetMin: null as number | null,
    budgetMax: null as number | null,
    currency: 'USD',
  };

  typeLabel(): string {
    return REQUEST_TYPE_LABELS[this.type()];
  }

  async submit(): Promise<void> {
    const errs = validateRequest({
      requestType: this.type(),
      senderName: this.model.senderName,
      title: this.model.title,
      message: this.model.message,
      deliverables: this.model.deliverables,
      budgetMin: this.model.budgetMin,
      budgetMax: this.model.budgetMax,
      currency: this.model.currency,
      budgetNegotiable: this.model.budgetNegotiable,
    });
    this.errors.set(errs);
    this.formError.set(null);
    if (Object.keys(errs).length) return;

    this.saving.set(true);
    const res = await this.requests.createRequest({
      creatorId: this.creatorId(),
      requestType: this.type(),
      senderName: this.model.senderName.trim(),
      title: this.model.title.trim(),
      message: this.model.message.trim(),
      deliverables: this.model.deliverables.trim() || null,
      timeline: this.model.timeline.trim() || null,
      budgetMin: this.model.budgetNegotiable ? null : this.model.budgetMin,
      budgetMax: this.model.budgetNegotiable ? null : this.model.budgetMax,
      currency: this.model.budgetNegotiable ? null : this.model.currency,
      budgetNegotiable: this.model.budgetNegotiable,
    });
    this.saving.set(false);

    if (res.error) {
      this.formError.set(res.error);
      return;
    }
    this.success.set(res.id ?? null);
    if (res.id) this.sent.emit(res.id);
  }
}
