import { Component, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { brand, NICHES, type PublicCreatorRow } from '@creatorconnect/shared';
import { CreatorsService } from '../../core/creators.service';
import { MetaService } from '../../core/meta.service';
import { CreatorCardComponent } from '../../ui/creator-card.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CreatorCardComponent],
  template: `
    <section class="hero">
      <div class="cc-container hero-inner">
        <p class="cc-eyebrow">Sponsorships &amp; collaborations</p>
        <h1>Find YouTube creators for your next campaign.</h1>
        <p class="lead cc-muted">{{ intro }}</p>
        <div class="cta cc-row">
          <a class="cc-btn cc-btn--primary" routerLink="/directory">Find Creators</a>
          <a class="cc-btn cc-btn--secondary" routerLink="/list-your-channel">List Your Channel</a>
        </div>
        <ul class="niche-links" aria-label="Browse by niche">
          @for (n of topNiches; track n.id) {
            <li>
              <a routerLink="/directory" [queryParams]="{ niche: n.id }">{{ n.label }}</a>
            </li>
          }
        </ul>
      </div>
    </section>

    <section class="cc-container cc-section">
      <h2 class="center">How it works</h2>
      <div class="steps">
        <article class="step cc-panel">
          <span class="num" aria-hidden="true">1</span>
          <h3>Browse approved creators</h3>
          <p class="cc-muted">
            Search a directory of real YouTube creators by niche, language, country, audience
            size and the collaboration formats they offer. Every listing is reviewed before it
            goes live.
          </p>
        </article>
        <article class="step cc-panel">
          <span class="num" aria-hidden="true">2</span>
          <h3>Send a brief</h3>
          <p class="cc-muted">
            Found a fit? Send a <strong>Paid Sponsorship</strong> brief with your budget and
            deliverables, or <strong>Propose a Collaboration</strong> — a joint video, a guest
            appearance, and more.
          </p>
        </article>
        <article class="step cc-panel">
          <span class="num" aria-hidden="true">3</span>
          <h3>Talk in a private inbox</h3>
          <p class="cc-muted">
            Keep the whole conversation in one place. Creators accept or decline; you can withdraw
            anytime. Personal contact details stay private until you both choose to share them.
          </p>
        </article>
      </div>
    </section>

    @if (featured().length) {
      <section class="cc-container cc-section">
        <div class="cc-spread">
          <h2>Featured creators</h2>
          <a class="cc-btn cc-btn--ghost cc-btn--sm" routerLink="/directory">Browse all →</a>
        </div>
        <div class="cc-grid-cards">
          @for (c of featured(); track c.id) {
            <app-creator-card [creator]="c" />
          }
        </div>
      </section>
    }

    <section class="list-cta">
      <div class="cc-container cc-panel split">
        <div>
          <h2>Are you a creator?</h2>
          <p class="cc-muted">
            List your channel, set the formats you offer, and receive sponsorship briefs and
            collaboration proposals from brands and fellow creators.
          </p>
        </div>
        <a class="cc-btn cc-btn--primary" routerLink="/list-your-channel">List Your Channel</a>
      </div>
    </section>
  `,
  styles: [
    `
      .hero {
        background: linear-gradient(180deg, var(--cc-accent-soft), var(--cc-bg) 70%);
        border-bottom: 1px solid var(--cc-border);
      }
      .hero-inner { padding-block: var(--cc-space-8); max-width: 820px; }
      .lead { font-size: var(--cc-text-lg); max-width: 60ch; }
      .cta { margin-top: var(--cc-space-5); }
      .niche-links {
        list-style: none; display: flex; flex-wrap: wrap; gap: 0.5rem;
        padding: 0; margin: var(--cc-space-6) 0 0;
      }
      .niche-links a {
        display: inline-block; text-decoration: none; font-size: var(--cc-text-sm);
        padding: 0.35rem 0.7rem; border-radius: var(--cc-radius-pill);
        background: var(--cc-surface); border: 1px solid var(--cc-border); color: var(--cc-text);
      }
      .niche-links a:hover { border-color: var(--cc-accent-border); color: var(--cc-accent-ink); }
      .center { text-align: center; }
      .steps {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--cc-space-5);
        margin-top: var(--cc-space-5);
      }
      @media (max-width: 820px) { .steps { grid-template-columns: 1fr; } }
      .step .num {
        display: inline-flex; align-items: center; justify-content: center;
        width: 2rem; height: 2rem; border-radius: var(--cc-radius-pill);
        background: var(--cc-accent); color: #fff; font-weight: 700; margin-bottom: 0.5rem;
      }
      .list-cta { margin-top: var(--cc-space-7); }
      .split { display: flex; gap: var(--cc-space-5); align-items: center; justify-content: space-between; flex-wrap: wrap; }
    `,
  ],
})
export class HomeComponent {
  private readonly creators = inject(CreatorsService);
  private readonly meta = inject(MetaService);

  readonly intro = brand.intro;
  readonly topNiches = NICHES.slice(0, 6);
  readonly featured = signal<PublicCreatorRow[]>([]);

  constructor() {
    this.meta.setPage({
      title: 'Find YouTube creators for your next campaign',
      description: brand.intro,
      path: '/',
    });
    // Load featured client-side so the marketing page stays prerenderable.
    afterNextRender(async () => {
      const res = await this.creators.searchDirectory({ page: 1 });
      this.featured.set(res.rows.slice(0, 6));
    });
  }
}
