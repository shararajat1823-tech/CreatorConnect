import {
  Component,
  Input,
  OnInit,
  PendingTasks,
  TransferState,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  type PricingItem,
  type PublicCreatorRow,
  type RequestType,
  youTubeThumbnailUrl,
  youTubeWatchUrl,
} from '@creatorconnect/shared';
import { AuthService } from '../../core/auth.service';
import { CreatorsService } from '../../core/creators.service';
import { MetaService } from '../../core/meta.service';
import { avatarUrl } from '../../core/env';
import { RESPONSE } from '../../core/tokens';
import { SupabaseService } from '../../core/supabase.service';
import {
  countryLabel,
  formatLabel,
  formatSubscribers,
  languageLabel,
  nicheLabel,
  subscriberRangeLabel,
} from '../../ui/display';
import { StateViewComponent } from '../../ui/state-view.component';
import { RequestFormComponent } from './request-form.component';
import { ReportFormComponent } from './report-form.component';

interface VideoView {
  id: string;
  title: string;
  thumb: string;
  watch: string;
}

@Component({
  selector: 'app-creator-profile',
  imports: [RouterLink, StateViewComponent, RequestFormComponent, ReportFormComponent],
  template: `
    @if (loading()) {
      <div class="cc-container"><app-state-view [spinner]="true" title="Loading profile…" /></div>
    } @else if (notFound()) {
      <div class="cc-container cc-section">
        <app-state-view icon="🔎" title="Profile not found"
          message="This creator profile doesn't exist, or it isn't published.">
          <a class="cc-btn cc-btn--primary" routerLink="/directory">Browse creators</a>
        </app-state-view>
      </div>
    } @else if (creator()) {
      @let c = creator()!;
      <article class="cc-container page">
        <header class="profile-head">
          <img class="avatar" [src]="avatar() ?? placeholder" [alt]="c.channel_name + ' avatar'" width="96" height="96" (error)="onImgError($event)" />
          <div class="id">
            <div class="name-row">
              <h1>{{ c.channel_name }}</h1>
              @if (c.ownership_verified) {
                <span class="cc-badge cc-badge--verified" title="Channel ownership verified">✓ Verified</span>
              }
            </div>
            <div class="meta cc-muted">
              @if (subs()) {
                <span>{{ subs() }} subscribers <span class="self">Self-reported</span></span>
              } @else if (rangeLabel()) {
                <span>{{ rangeLabel() }} subscribers <span class="self">Self-reported</span></span>
              }
              @if (country()) { <span aria-hidden="true">·</span><span>{{ country() }}</span> }
            </div>
            <div class="chips">
              @for (n of niches(); track n) { <span class="cc-chip cc-chip--accent">{{ n }}</span> }
              @if (languages()) { <span class="cc-chip">{{ languages() }}</span> }
            </div>
          </div>
        </header>

        <div class="grid">
          <div class="main cc-stack">
            @if (c.bio) {
              <section class="cc-panel">
                <h2>About</h2>
                <p class="bio">{{ c.bio }}</p>
                <a class="yt-link" [href]="c.youtube_url" target="_blank" rel="noopener noreferrer nofollow">
                  Visit YouTube channel ↗
                </a>
              </section>
            }

            @if (videos().length) {
              <section class="cc-panel">
                <h2>Selected videos</h2>
                <div class="videos">
                  @for (v of videos(); track v.id) {
                    <a class="video" [href]="v.watch" target="_blank" rel="noopener noreferrer nofollow">
                      <img [src]="v.thumb" [alt]="v.title" width="320" height="180" loading="lazy" />
                      <span class="vtitle">{{ v.title }}</span>
                    </a>
                  }
                </div>
              </section>
            }

            @if (formats().length) {
              <section class="cc-panel">
                <h2>Collaboration formats</h2>
                <div class="chips">
                  @for (f of formats(); track f) { <span class="cc-chip">{{ f }}</span> }
                </div>
              </section>
            }

            <section class="cc-panel">
              <h2>Indicative pricing</h2>
              @if (pricing() && pricing()!.length) {
                <ul class="pricing">
                  @for (p of pricing()!; track p.format) {
                    <li>
                      <span class="pf">{{ formatLabel(p.format) }}</span>
                      <span class="pv">{{ priceText(p) }}</span>
                    </li>
                  }
                </ul>
                <p class="cc-subtle note">Pricing is indicative and set by the creator. Confirm details in your conversation.</p>
              } @else {
                <p class="cc-muted">Contact for pricing.</p>
              }
            </section>
          </div>

          <aside class="side">
            <div class="cc-panel cta-panel">
              <h2>Work with {{ c.channel_name }}</h2>
              @if (activeType()) {
                <app-request-form
                  [creatorId]="c.creator_id"
                  [channelName]="c.channel_name"
                  [type]="activeType()!"
                  (cancel)="activeType.set(null)"
                />
              } @else if (showReport()) {
                <app-report-form [creatorId]="c.creator_id" (cancel)="showReport.set(false)" />
              } @else {
                <div class="cc-stack">
                  <button class="cc-btn cc-btn--primary cc-btn--block" type="button" (click)="startRequest('paid_sponsorship')">
                    Request Sponsorship
                  </button>
                  <button class="cc-btn cc-btn--secondary cc-btn--block" type="button" (click)="startRequest('creator_collaboration')">
                    Propose a Collaboration
                  </button>
                  <p class="cc-subtle">Personal contact details stay private until you both choose to share them.</p>
                  <button class="report-link" type="button" (click)="startReport()">Report this profile</button>
                </div>
              }
            </div>
          </aside>
        </div>
      </article>
    }
  `,
  styles: [
    `
      .page { padding-block: var(--cc-space-6) var(--cc-space-8); }
      .profile-head { display: flex; gap: var(--cc-space-5); align-items: center; margin-bottom: var(--cc-space-6); flex-wrap: wrap; }
      .avatar { width: 96px; height: 96px; border-radius: var(--cc-radius-pill); object-fit: cover; background: var(--cc-bg-subtle); }
      .name-row { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
      .name-row h1 { margin: 0; }
      .meta { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; margin: 0.4rem 0; }
      .self { font-size: var(--cc-text-xs); background: var(--cc-bg-subtle); color: var(--cc-text-muted); padding: 0.05rem 0.4rem; border-radius: var(--cc-radius-sm); }
      .chips { display: flex; gap: 0.4rem; flex-wrap: wrap; }
      .grid { display: grid; grid-template-columns: 1fr 360px; gap: var(--cc-space-6); align-items: start; }
      @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
      .bio { white-space: pre-line; }
      .yt-link { font-weight: 600; }
      .videos { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--cc-space-4); }
      .video { text-decoration: none; color: inherit; }
      .video img { border-radius: var(--cc-radius-md); aspect-ratio: 16/9; object-fit: cover; width: 100%; height: auto; }
      .vtitle { display: block; margin-top: 0.4rem; font-size: var(--cc-text-sm); font-weight: 600; }
      .pricing { list-style: none; padding: 0; margin: 0; }
      .pricing li { display: flex; justify-content: space-between; gap: 1rem; padding: 0.5rem 0; border-bottom: 1px solid var(--cc-border); }
      .pricing li:last-child { border-bottom: 0; }
      .pf { font-weight: 600; }
      .note { margin-top: 0.75rem; }
      .side { position: sticky; top: 80px; }
      .report-link { background: none; border: none; color: var(--cc-text-subtle); text-decoration: underline; cursor: pointer; font: inherit; font-size: var(--cc-text-sm); padding: 0; align-self: flex-start; }
    `,
  ],
})
export class CreatorProfileComponent implements OnInit {
  private readonly creators = inject(CreatorsService);
  private readonly auth = inject(AuthService);
  private readonly meta = inject(MetaService);
  private readonly router = inject(Router);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly supa = inject(SupabaseService);
  private readonly transferState = inject(TransferState);
  private readonly response = inject(RESPONSE, { optional: true });

  @Input() slug = '';
  @Input() request?: string;

  readonly creator = signal<PublicCreatorRow | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly activeType = signal<RequestType | null>(null);
  readonly showReport = signal(false);

  readonly placeholder =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="%23f3f1ec"/></svg>';
  readonly formatLabel = formatLabel;

  avatar = () => avatarUrl(this.creator()?.avatar_path);
  subs = () => formatSubscribers(this.creator()?.subscriber_count);
  rangeLabel = () => subscriberRangeLabel(this.creator()?.subscriber_range);
  country = () => countryLabel(this.creator()?.country);
  niches = () => (this.creator()?.niches ?? []).map(nicheLabel);
  languages = () => (this.creator()?.languages ?? []).map(languageLabel).join(', ');
  formats = () => (this.creator()?.formats ?? []).map(formatLabel);
  pricing = () => (this.creator()?.pricing as PricingItem[] | null) ?? null;
  videos = (): VideoView[] =>
    (this.creator()?.videos ?? []).map((v) => ({
      id: v.video_id,
      title: v.title ?? 'Watch on YouTube',
      thumb: youTubeThumbnailUrl(v.video_id),
      watch: youTubeWatchUrl(v.video_id),
    }));

  async ngOnInit(): Promise<void> {
    const key = makeStateKey<PublicCreatorRow | null>('creator:' + this.slug);

    // Browser's first render: reuse what the server already fetched.
    if (this.supa.isBrowser && this.transferState.hasKey(key)) {
      const cached = this.transferState.get<PublicCreatorRow | null>(key, null);
      this.transferState.remove(key);
      this.applyCreator(cached);
      this.loading.set(false);
      return;
    }

    const done = this.pendingTasks.add();
    try {
      const c = await this.creators.getPublicBySlug(this.slug);
      if (!this.supa.isBrowser) this.transferState.set(key, c);
      this.applyCreator(c);
    } finally {
      this.loading.set(false);
      done();
    }
  }

  private applyCreator(c: PublicCreatorRow | null): void {
    if (!c) {
      this.notFound.set(true);
      this.response?.status(404);
      this.meta.setPage({ title: 'Profile not found', noindex: true, path: `/creators/${this.slug}` });
      return;
    }
    this.creator.set(c);
    this.meta.setPage({
      title: `${c.channel_name} — creator`,
      description: c.bio?.slice(0, 160) || `${c.channel_name} — sponsorships and collaborations.`,
      path: `/creators/${c.slug}`,
      image: avatarUrl(c.avatar_path),
      type: 'profile',
    });
    // Returning from sign-in with a pre-selected request type.
    if (
      this.supa.isBrowser &&
      this.auth.isSignedIn() &&
      (this.request === 'paid_sponsorship' || this.request === 'creator_collaboration')
    ) {
      this.activeType.set(this.request);
    }
  }

  startRequest(type: RequestType): void {
    if (!this.auth.isSignedIn()) {
      this.router.navigate(['/auth/sign-in'], {
        queryParams: { redirect: `/creators/${this.slug}?request=${type}` },
      });
      return;
    }
    this.showReport.set(false);
    this.activeType.set(type);
  }

  startReport(): void {
    if (!this.auth.isSignedIn()) {
      this.router.navigate(['/auth/sign-in'], {
        queryParams: { redirect: `/creators/${this.slug}` },
      });
      return;
    }
    this.activeType.set(null);
    this.showReport.set(true);
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== this.placeholder) img.src = this.placeholder;
  }

  priceText(p: PricingItem): string {
    if (p.note && p.price_min == null && p.price_max == null) return p.note;
    const cur = p.currency ?? 'USD';
    if (p.price_min != null && p.price_max != null) return `${cur} ${p.price_min}–${p.price_max}`;
    if (p.price_min != null) return `From ${cur} ${p.price_min}`;
    if (p.price_max != null) return `Up to ${cur} ${p.price_max}`;
    return p.note ?? 'Contact for pricing';
  }
}
