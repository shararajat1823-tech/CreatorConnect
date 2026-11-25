import { Component, afterNextRender, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { brand, type PublicCreatorRow } from '@creatorconnect/shared';
import { CreatorsService } from '../../core/creators.service';
import { MetaService } from '../../core/meta.service';
import { CreatorCardComponent } from '../../ui/creator-card.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule, CreatorCardComponent],
  template: `
    <section class="hero">
      <div class="glow" aria-hidden="true"></div>
      <div class="cc-container hero-inner">
        <div class="hero-copy">
          <h1>Find your next<br />creator collab.</h1>
          <p class="lead cc-muted">Find YouTube creators for sponsorships and collaborations.</p>

          <form class="hero-search" (ngSubmit)="search()">
            <div class="search-field">
              <span class="icon" aria-hidden="true">⌕</span>
              <input
                name="q"
                [(ngModel)]="q"
                aria-label="Search creators"
                placeholder="Search by name, channel or niche"
              />
            </div>
            <button class="cc-btn cc-btn--primary" type="submit">Find creators</button>
          </form>

          <a class="list-link" routerLink="/list-your-channel">List your channel →</a>
        </div>

        <div class="hero-visual">
          <img src="hero.svg" alt="A creator studio with a camera, microphone and warm lighting" />
        </div>
      </div>
    </section>

    @if (featured().length) {
      <section class="cc-container cc-section">
        <div class="cc-spread section-head">
          <h2>Featured creators</h2>
          <a class="explore" routerLink="/directory">Browse all creators →</a>
        </div>
        <div class="cc-grid-cards">
          @for (c of featured(); track c.id) {
            <app-creator-card [creator]="c" [compact]="true" />
          }
        </div>
      </section>
    }

    <section class="cc-container cc-section">
      <h2>How it works</h2>
      <div class="steps">
        <article class="step">
          <span class="sicon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
          </span>
          <div>
            <h3>Browse creators</h3>
            <p class="cc-muted">Discover YouTube creators by niche, audience and more.</p>
          </div>
        </article>
        <article class="step">
          <span class="sicon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="8.5" y1="8" x2="15.5" y2="8"/><line x1="8.5" y1="12" x2="15.5" y2="12"/><line x1="8.5" y1="16" x2="13" y2="16"/></svg>
          </span>
          <div>
            <h3>Send a brief</h3>
            <p class="cc-muted">Share your campaign details, goals and deliverables.</p>
          </div>
        </article>
        <article class="step">
          <span class="sicon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-5A8 8 0 1 1 21 12z"/></svg>
          </span>
          <div>
            <h3>Chat privately</h3>
            <p class="cc-muted">Align, ask questions and collaborate in one place.</p>
          </div>
        </article>
      </div>
    </section>

    <section class="cc-container">
      <div class="creator-bar">
        <h2>Are you a creator?</h2>
        <span class="divider" aria-hidden="true"></span>
        <p class="cc-muted">Get discovered by brands and find new collaboration opportunities on YouTube.</p>
        <a class="cc-btn cc-btn--primary" routerLink="/list-your-channel">List your channel</a>
      </div>
    </section>
  `,
  styles: [
    `
      .hero { position: relative; overflow: hidden; border-bottom: 1px solid var(--cc-border); }
      .glow { position: absolute; width: 640px; height: 640px; border-radius: 50%; top: -200px; right: -120px;
        background: radial-gradient(circle, #7c3aed, transparent 70%); filter: blur(90px); opacity: 0.5; pointer-events: none; }
      .hero-inner {
        position: relative; z-index: 1; display: grid; grid-template-columns: 1.05fr 0.95fr;
        gap: var(--cc-space-7); align-items: center; padding-block: var(--cc-space-8);
      }
      .hero-copy h1 { margin: 0 0 1rem; }
      .lead { font-size: var(--cc-text-lg); max-width: 40ch; margin-bottom: var(--cc-space-5); }
      .hero-search { display: flex; gap: var(--cc-space-3); flex-wrap: wrap; }
      .search-field { position: relative; flex: 1; min-width: 240px; }
      .search-field .icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 1.25rem; color: var(--cc-text-subtle); }
      .search-field input {
        width: 100%; font: inherit; padding: 0.85rem 1rem 0.85rem 2.8rem; color: var(--cc-text);
        background: var(--cc-surface); border: 1px solid var(--cc-border-strong); border-radius: var(--cc-radius-md);
      }
      .search-field input::placeholder { color: var(--cc-text-subtle); }
      .search-field input:focus { border-color: var(--cc-accent); }
      .list-link { display: inline-block; margin-top: var(--cc-space-4); font-weight: 600; text-decoration: none; }

      .hero-visual {
        border-radius: var(--cc-radius-xl); overflow: hidden; border: 1px solid var(--cc-border-strong);
        box-shadow: var(--cc-shadow-lg); line-height: 0;
      }
      .hero-visual img { width: 100%; height: 100%; object-fit: cover; aspect-ratio: 5 / 4; }

      .section-head { margin-bottom: var(--cc-space-5); }
      .explore { font-weight: 600; text-decoration: none; white-space: nowrap; }

      .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--cc-space-6); margin-top: var(--cc-space-5); }
      .step { display: flex; gap: var(--cc-space-3); align-items: flex-start; }
      .step h3 { margin: 0 0 0.3rem; font-size: var(--cc-text-lg); }
      .step p { margin: 0; font-size: var(--cc-text-sm); }
      .sicon {
        flex: 0 0 auto; width: 46px; height: 46px; display: inline-flex; align-items: center; justify-content: center;
        border-radius: var(--cc-radius-md); background: var(--cc-accent-soft); border: 1px solid var(--cc-accent-border);
        color: var(--cc-accent-ink);
      }
      .sicon svg { width: 22px; height: 22px; }

      .creator-bar {
        display: flex; align-items: center; gap: var(--cc-space-5); flex-wrap: wrap;
        margin-top: var(--cc-space-6); padding: var(--cc-space-5) var(--cc-space-6);
        border: 1px solid var(--cc-border-strong); border-radius: var(--cc-radius-xl); background: var(--cc-surface);
      }
      .creator-bar h2 { margin: 0; white-space: nowrap; }
      .creator-bar .divider { width: 1px; align-self: stretch; background: var(--cc-border); }
      .creator-bar p { margin: 0; flex: 1; min-width: 220px; }

      @media (max-width: 900px) {
        .hero-inner { grid-template-columns: 1fr; }
        .hero-visual { margin-top: var(--cc-space-4); }
        .steps { grid-template-columns: 1fr; gap: var(--cc-space-4); }
        .creator-bar .divider { display: none; }
      }
    `,
  ],
})
export class HomeComponent {
  private readonly creators = inject(CreatorsService);
  private readonly meta = inject(MetaService);
  private readonly router = inject(Router);

  readonly featured = signal<PublicCreatorRow[]>([]);
  q = '';

  constructor() {
    this.meta.setPage({
      title: 'Find YouTube creators for your next campaign',
      description: brand.intro,
      path: '/',
    });
    afterNextRender(async () => {
      const res = await this.creators.searchDirectory({ page: 1 });
      this.featured.set(res.rows.slice(0, 4));
    });
  }

  search(): void {
    const q = this.q.trim();
    this.router.navigate(['/directory'], { queryParams: q ? { q } : {} });
  }
}
