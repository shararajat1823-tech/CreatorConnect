import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { REPORT_REASONS, REPORT_REASON_LABELS } from '@creatorconnect/shared';
import { RequestsService } from '../../core/requests.service';

@Component({
  selector: 'app-report-form',
  imports: [FormsModule],
  template: `
    <form class="cc-panel" (ngSubmit)="submit()" novalidate>
      <h2>Report this profile</h2>
      <p class="cc-muted">Tell us what's wrong. Our moderators review every report.</p>

      @if (done()) {
        <div class="cc-form-success" role="status">Thanks — your report has been submitted.</div>
      } @else {
        @if (error()) { <div class="cc-form-error" role="alert">{{ error() }}</div> }
        <div class="cc-field">
          <label class="cc-label" for="rep-reason">Reason</label>
          <select id="rep-reason" class="cc-select" name="reason" [(ngModel)]="reason">
            @for (r of reasons; track r.id) { <option [value]="r.id">{{ r.label }}</option> }
          </select>
        </div>
        <div class="cc-field">
          <label class="cc-label" for="rep-details">Details (optional)</label>
          <textarea id="rep-details" class="cc-textarea" name="details" [(ngModel)]="details"></textarea>
        </div>
        <div class="cc-row">
          <button class="cc-btn cc-btn--danger" type="submit" [disabled]="saving()">
            {{ saving() ? 'Submitting…' : 'Submit report' }}
          </button>
          <button class="cc-btn cc-btn--ghost" type="button" (click)="cancel.emit()">Cancel</button>
        </div>
      }
    </form>
  `,
})
export class ReportFormComponent {
  private readonly requests = inject(RequestsService);
  readonly creatorId = input.required<string>();
  readonly cancel = output<void>();

  readonly reasons = REPORT_REASONS.map((id) => ({ id, label: REPORT_REASON_LABELS[id] }));
  reason = REPORT_REASONS[0];
  details = '';
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly done = signal(false);

  async submit(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    const res = await this.requests.reportCreator(this.creatorId(), this.reason, this.details.trim());
    this.saving.set(false);
    if (res.error) this.error.set(res.error);
    else this.done.set(true);
  }
}
