import { Component, input } from '@angular/core';

/** A centered empty / error / loading panel with an icon, message and optional actions (projected). */
@Component({
  selector: 'app-state-view',
  template: `
    <div class="state" [class.subtle]="tone() === 'subtle'" role="status">
      @if (spinner()) {
        <span class="spinner" aria-hidden="true"></span>
      } @else {
        <span class="icon" aria-hidden="true">{{ icon() }}</span>
      }
      <p class="title">{{ title() }}</p>
      @if (message()) {
        <p class="cc-subtle msg">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: [
    `
      .state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.5rem;
        padding: var(--cc-space-7) var(--cc-space-4);
      }
      .icon { font-size: 2rem; }
      .title { font-weight: 700; font-size: var(--cc-text-lg); margin: 0; }
      .msg { margin: 0; max-width: 42ch; }
      .spinner {
        width: 28px; height: 28px; border-radius: 50%;
        border: 3px solid var(--cc-border-strong);
        border-top-color: var(--cc-accent);
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `,
  ],
})
export class StateViewComponent {
  readonly icon = input('✦');
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly spinner = input(false);
  readonly tone = input<'default' | 'subtle'>('default');
}
