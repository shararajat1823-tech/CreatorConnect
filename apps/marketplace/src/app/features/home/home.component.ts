import { Component, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { brand, NICHES, type PublicCreatorRow } from '@creatorconnect/shared';
import { CreatorsService } from '../../core/creators.service';
import { MetaService } from '../../core/meta.service';
import { avatarUrl } from '../../core/env';
import { CreatorCardComponent } from '../../ui/creator-card.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CreatorCardComponent],
  template: `
    <section class="hero">
      <div class="glow glow-a" aria-hidden="true"></div>
      <div class="glow glow-b" aria-hidden="true"></div>
      <div class="cc-container hero-inner">
        <div class="hero-copy">
          <p class="cc-eyebrow">YouTube creator marketplace</p>
          <h1>Find your next<br />creator collab.</h1>
          <p class="lead cc-muted">A marketplace for YouTube sponsorships and creator collaborations.</p>
          <div class="cta cc-row">
            <a class="cc-btn cc-btn--primary" routerLink="/directory">Find creators →</a>
            <a class="cc-btn cc-btn--secondary" routerLink="/list-your-channel">List your channel</a>
          </div>
          <ul class="niche-links" aria-label="Browse by niche">
            @for (n of topNiches; track n.id) {
              <li><a routerLink="/directory" [queryParams]="{ niche: n.id }">{{ n.label }}</a></li>
            }
          </ul>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="visual-card">
            @if (spotlight(); as s) {
              <img class="visual-img" [src]="spotlightImg() ?? ''" alt="" (error)="imgError($event)" />
            } @else {
              <div class="visual-img placeholder-grad"></div>
            }
            <span class="play">▶</span>
            @if (spotlight(); as s) {
              <div class="visual-meta">
                <strong>{{ s.channel_name }}</strong>
                <span class="cc-subtle">Featured creator</span>
              </div>
            }
          </div>
          <span class="float-chip chip-1">Sponsorships</span>
          <span class="float-chip chip-2">Collaborations</span>
          <span class="float-chip chip-3">Shorts</span>
        </div>
      </div>
    </section>

    <section class="features cc-container">
      <article class="feature">
        <span class="ficon" aria-hidden="true">⚡</span>
        <div>
          <h3>Discover talent</h3>
          <p class="cc-muted">Find YouTube creators for sponsorships and collabs, filtered by niche and audience.</p>
        </div>
      </article>
      <article class="feature">
        <span class="ficon" aria-hidden="true">⚓</span>
        <div>
          <h3>Build partnerships</h3>
          <p class="cc-muted">Send briefs, agree on deliverables, and keep every conversation in one private inbox.</p>
        </div>
      </article>
      <article class="feature">
        <span class="ficon" aria-hidden="true">▶</span>
        <div>
          <h3>Grow your channel</h3>
          <p class="cc-muted">List your channel and receive relevant brand opportunities and collaboration briefs.</p>
        </div>
      </article>
    </section>

    @if (featured().length) {
      <section class="cc-container cc-section">
        <div class="cc-spread section-head">
          <h2>Featured creators</h2>
          <a class="explore" routerLink="/directory">Explore all creators →</a>
        </div>
        <div class="cc-grid-cards">
          @for (c of featured(); track c.id) {
            <app-creator-card [creator]="c" />
          }
        </div>
      </section>
    }

    <section class="cc-container">
      <div class="band">
        <div class="glow glow-c" aria-hidden="true"></div>
        <p class="cc-eyebrow">For creators &amp; brands</p>
        <h2>Real creators.<br />Real collaborations.</h2>
        <p class="band-lead cc-muted">
          From product integrations to creative series, {{ brandName }} makes it easy to find the right
          YouTube partners and bring ideas to life.
        </p>
        <div class="cc-row">
          <a class="cc-btn cc-btn--primary" routerLink="/directory">Find creators →</a>
          <a class="cc-btn cc-btn--secondary" routerLink="/list-your-channel">List your channel</a>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .hero { position: relative; overflow: hidden; border-bottom: 1px solid var(--cc-border); }
      .glow { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.6; pointer-events: none; }
      .glow-a { width: 520px; height: 520px; background: radial-gradient(circle, #7c3aed, transparent 70%); top: -180px; right: -80px; }
      .glow-b { width: 420px; height: 420px; background: radial-gradient(circle, #4c2a86, transparent 70%); bottom: -220px; left: -120px; opacity: 0.5; }
      .hero-inner {
        position: relative; z-index: 1; display: grid; grid-template-columns: 1.1fr 0.9fr;
        gap: var(--cc-space-7); align-items: center; padding-block: var(--cc-space-8);
      }
      .hero-copy h1 { margin: 0.5rem 0 1rem; }
      .lead { font-size: var(--cc-text-lg); max-width: 42ch; }
      .cta { margin-top: var(--cc-space-5); }
      .niche-links { list-style: none; display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0; margin: var(--cc-space-6) 0 0; }
      .niche-links a {
        display: inline-block; text-decoration: none; font-size: var(--cc-text-sm);
        padding: 0.4rem 0.85rem; border-radius: var(--cc-radius-pill);
        background: var(--cc-surface); border: 1px solid var(--cc-border); color: var(--cc-text-muted);
      }
      .niche-links a:hover { border-color: var(--cc-accent-border); color: var(--cc-accent-ink); }

      .hero-visual { position: relative; min-height: 380px; display: flex; align-items: center; justify-content: center; }
      .visual-card {
        position: relative; width: 100%; max-width: 420px; aspect-ratio: 4 / 4.4;
        border-radius: var(--cc-radius-xl); overflow: hidden;
        border: 1px solid var(--cc-border-strong); box-shadow: var(--cc-shadow-lg);
      }
      .visual-img { width: 100%; height: 100%; object-fit: cover; }
      .placeholder-grad, .visual-img { background: linear-gradient(145deg, #3a2770, #1a1030 60%, #120a24); }
      .visual-card .play {
        position: absolute; inset: 0; margin: auto; width: 68px; height: 68px;
        display: flex; align-items: center; justify-content: center;
        background: rgba(167, 139, 250, 0.92); color: #1a1030; border-radius: 50%;
        font-size: 1.4rem; padding-left: 4px;
      }
      .visual-meta {
        position: absolute; left: 0; right: 0; bottom: 0; padding: 1.1rem 1.2rem;
        display: flex; flex-direction: column; gap: 0.1rem;
        background: linear-gradient(transparent, rgba(10, 8, 18, 0.92));
      }
      .visual-meta strong { font-size: var(--cc-text-lg); }
      .float-chip {
        position: absolute; font-size: var(--cc-text-sm); font-weight: 600;
        padding: 0.45rem 0.9rem; border-radius: var(--cc-radius-pill);
        background: var(--cc-surface); border: 1px solid var(--cc-border-strong); box-shadow: var(--cc-shadow-md);
      }
      .chip-1 { top: 8%; left: -4%; color: var(--cc-accent-ink); }
      .chip-2 { bottom: 14%; right: -6%; }
      .chip-3 { top: 42%; right: -2%; color: var(--cc-accent-ink); }

      .features {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--cc-space-5);
        padding-block: var(--cc-space-7);
      }
      .feature { display: flex; gap: var(--cc-space-3); align-items: flex-start; }
      .feature h3 { margin: 0 0 0.3rem; font-size: var(--cc-text-lg); }
      .feature p { margin: 0; font-size: var(--cc-text-sm); }
      .ficon {
        flex: 0 0 auto; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
        border-radius: var(--cc-radius-md); background: var(--cc-accent-soft); border: 1px solid var(--cc-accent-border);
        color: var(--cc-accent-ink); font-size: 1.1rem;
      }

      .section-head { margin-bottom: var(--cc-space-5); }
      .explore { font-weight: 600; text-decoration: none; white-space: nowrap; }

      .band {
        position: relative; overflow: hidden; margin-top: var(--cc-space-6);
        padding: var(--cc-space-8) var(--cc-space-7);
        border-radius: var(--cc-radius-xl); border: 1px solid var(--cc-border-strong);
        background: linear-gradient(135deg, #241640, #15101f 70%);
      }
      .glow-c { width: 480px; height: 480px; background: radial-gradient(circle, #7c3aed, transparent 70%); top: -200px; right: -100px; opacity: 0.4; }
      .band h2 { position: relative; margin: 0.4rem 0 1rem; }
      .band-lead { position: relative; max-width: 52ch; font-size: var(--cc-text-lg); }
      .band .cc-row { position: relative; }

      @media (max-width: 900px) {
        .hero-inner { grid-template-columns: 1fr; }
        .hero-visual { min-height: 320px; margin-top: var(--cc-space-4); }
        .features { grid-template-columns: 1fr; gap: var(--cc-space-4); }
      }
    `,
  ],
})
export class HomeComponent {
  private readonly creators = inject(CreatorsService);
  private readonly meta = inject(MetaService);

  readonly brandName = brand.name;
  readonly topNiches = NICHES.slice(0, 6);
  readonly featured = signal<PublicCreatorRow[]>([]);
  readonly spotlight = signal<PublicCreatorRow | null>(null);

  spotlightImg = () => avatarUrl(this.spotlight()?.avatar_path);

  constructor() {
    this.meta.setPage({
      title: 'Find YouTube creators for your next campaign',
      description: brand.intro,
      path: '/',
    });
    afterNextRender(async () => {
      const res = await this.creators.searchDirectory({ page: 1 });
      this.featured.set(res.rows.slice(0, 4));
      this.spotlight.set(res.rows[0] ?? null);
    });
  }

  imgError(event: Event): void {
    (event.target as HTMLImageElement).style.visibility = 'hidden';
  }
}
