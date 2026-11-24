import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { brand, COLLAB_FORMAT_LABELS, COLLAB_FORMATS } from '@creatorconnect/shared';
import { AuthService } from '../../core/auth.service';
import { MetaService } from '../../core/meta.service';

@Component({
  selector: 'app-list-channel',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div class="cc-container inner">
        <p class="cc-eyebrow">For creators</p>
        <h1>List your channel on {{ brandName }}</h1>
        <p class="lead cc-muted">
          Get discovered by brands and fellow creators. Set the collaboration formats you offer and
          receive sponsorship briefs and collaboration proposals in a private inbox.
        </p>
        <div class="cc-row">
          <a class="cc-btn cc-btn--primary" [routerLink]="ctaLink">{{ ctaLabel }}</a>
          <a class="cc-btn cc-btn--secondary" routerLink="/directory">See the directory</a>
        </div>
      </div>
    </section>

    <section class="cc-container cc-section">
      <div class="steps">
        <div class="cc-panel"><h3>1. Create your listing</h3><p class="cc-muted">Add your channel, bio, niches, languages, audience size and selected videos.</p></div>
        <div class="cc-panel"><h3>2. Get reviewed</h3><p class="cc-muted">Submit for review. An admin checks it before it goes live — no YouTube API key needed.</p></div>
        <div class="cc-panel"><h3>3. Receive briefs</h3><p class="cc-muted">Approved profiles get a shareable link and start receiving requests you can accept or decline.</p></div>
      </div>

      <h2 style="margin-top: var(--cc-space-7)">Formats you can offer</h2>
      <div class="chips">
        @for (f of formats; track f.id) { <span class="cc-chip cc-chip--accent">{{ f.label }}</span> }
      </div>
    </section>
  `,
  styles: [
    `
      .hero { background: linear-gradient(180deg, var(--cc-accent-soft), var(--cc-bg) 70%); border-bottom: 1px solid var(--cc-border); }
      .inner { padding-block: var(--cc-space-8); max-width: 760px; }
      .lead { font-size: var(--cc-text-lg); }
      .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--cc-space-5); }
      @media (max-width: 820px) { .steps { grid-template-columns: 1fr; } }
      .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: var(--cc-space-3); }
    `,
  ],
})
export class ListChannelComponent {
  private readonly auth = inject(AuthService);
  private readonly meta = inject(MetaService);
  readonly brandName = brand.name;
  readonly formats = COLLAB_FORMATS.map((id) => ({ id, label: COLLAB_FORMAT_LABELS[id] }));

  get ctaLink(): string {
    return this.auth.isSignedIn() ? '/dashboard/channel' : '/auth/sign-up';
  }
  get ctaLabel(): string {
    return this.auth.isSignedIn() ? 'Edit your channel' : 'Create your free account';
  }

  constructor() {
    this.meta.setPage({
      title: 'List your channel',
      description: `List your YouTube channel on ${brand.name} and receive sponsorship briefs and collaboration proposals.`,
      path: '/list-your-channel',
    });
  }
}
