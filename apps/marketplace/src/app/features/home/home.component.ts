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
      <div class="cc-container hero-inner">
        <div class="hero-copy">
          <h1>Find your next creator collab.</h1>
          <p class="lead cc-muted">Find YouTube creators for sponsorships and collaborations.</p>

          <form class="hero-search" role="search" (ngSubmit)="search()">
            <div class="search-field">
              <span class="icon" aria-hidden="true">⌕</span>
              <input
                type="search"
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
          <img src="hero.svg" width="443" height="373" alt="" />
        </div>
      </div>
    </section>

    @if (featured().length) {
      <section class="cc-container home-section">
        <div class="cc-spread section-head">
          <h2>Featured creators</h2>
          <a class="explore" routerLink="/directory">Browse all creators →</a>
        </div>
        <div class="featured-grid">
          @for (c of featured(); track c.id) {
            <app-creator-card [creator]="c" [compact]="true" />
          }
        </div>
      </section>
    }

    <section class="cc-container home-section">
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

    <section class="cc-container creator-section">
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
      .hero-inner, .home-section, .creator-section {
        width: min(100% - 2.5rem, 68rem);
        margin-inline: auto;
        padding-inline: 0;
      }
      .hero-inner {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: clamp(1.5rem, 3vw, 2.5rem);
        align-items: center;
        padding-block: clamp(1.75rem, 4vw, 2.75rem);
      }
      .hero-copy h1 {
        max-width: 14ch;
        margin: 0 0 0.75rem;
        font-size: clamp(2.25rem, 4.2vw, 3.5rem);
        line-height: 1.05;
      }
      .lead { max-width: 44ch; margin: 0 0 1.25rem; }
      .hero-search { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.5rem; }
      .search-field { position: relative; min-width: 0; }
      .search-field .icon {
        position: absolute; inset-inline-start: 0.75rem; top: 50%; transform: translateY(-50%);
        color: var(--cc-text-muted); pointer-events: none;
      }
      .search-field input {
        box-sizing: border-box; width: 100%; min-height: 44px; height: 100%; padding: 0.625rem 0.75rem 0.625rem 2rem;
        font: inherit; font-size: 0.875rem; color: var(--cc-text); background: var(--cc-surface);
        border: 1px solid var(--cc-border-strong); border-radius: 0.625rem;
      }
      .search-field input::placeholder { color: var(--cc-text-muted); }
      .search-field input:focus { border-color: var(--cc-accent); }
      .hero-search button, .creator-bar .cc-btn { min-height: 44px; border-radius: 0.625rem; }
      .list-link, .explore { font-size: 0.875rem; font-weight: 600; text-decoration: none; }
      .list-link { display: inline-block; margin-top: 0.875rem; }
      .list-link:hover, .explore:hover { text-decoration: underline; }
      .hero-visual { overflow: hidden; border-radius: 0.875rem; }
      .hero-visual img { display: block; width: 100%; height: auto; aspect-ratio: 16 / 10; object-fit: cover; }
      .home-section { padding-block: 1.75rem; border-top: 1px solid var(--cc-border); }
      .home-section h2 { margin: 0; font-size: clamp(1.5rem, 3vw, 2rem); }
      .section-head { align-items: baseline; gap: 0.5rem 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
      .featured-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
      .steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; margin-top: 1rem; }
      .step { display: flex; gap: 0.625rem; align-items: flex-start; }
      .step h3 { margin: 0 0 0.25rem; font-size: 1rem; }
      .step p { margin: 0; font-size: var(--cc-text-sm); }
      .sicon {
        flex: 0 0 36px; height: 36px; display: grid; place-items: center; border-radius: 0.625rem;
        background: var(--cc-accent-soft); color: var(--cc-accent-ink);
      }
      .sicon svg { width: 18px; height: 18px; }
      .creator-section { padding-bottom: 2rem; }
      .creator-bar {
        display: flex; align-items: center; gap: 0.625rem 1rem; flex-wrap: wrap;
        padding: 0.875rem 1rem; border: 1px solid var(--cc-border-strong);
        border-radius: 0.75rem; background: var(--cc-surface);
      }
      .creator-bar h2 { margin: 0; font-size: 1.375rem; }
      .creator-bar .divider { display: none; }
      .creator-bar p { margin: 0; flex: 1 1 16rem; font-size: var(--cc-text-sm); }
      @media (max-width: 760px) {
        .hero-inner { grid-template-columns: 1fr; }
        .hero-visual img { aspect-ratio: 2 / 1; }
        .featured-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .steps { grid-template-columns: 1fr; gap: 0.875rem; }
      }
      @media (max-width: 400px) {
        .hero-search { grid-template-columns: 1fr; }
        .featured-grid { gap: 0.625rem; }
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
