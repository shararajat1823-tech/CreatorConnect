import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { PublicCreatorRow } from '@creatorconnect/shared';
import { avatarUrl } from '../core/env';
import {
  countryLabel,
  formatSubscribers,
  languageLabel,
  nicheLabel,
  subscriberRangeLabel,
} from './display';

@Component({
  selector: 'app-creator-card',
  imports: [RouterLink],
  host: { '[class.as-list]': "layout() === 'list'" },
  template: `
    <a class="card" [class.is-compact]="compact()" [routerLink]="['/creators', creator().slug]">
      @if (compact()) {
        <div class="media">
          @if (avatar(); as image) {
            <img [src]="image" [alt]="creator().channel_name + ' channel image'" loading="lazy" (error)="onImgError($event)" />
          } @else {
            <div class="media-fallback"></div>
          }
        </div>
        <div class="body">
          <span class="name">{{ creator().channel_name }}</span>
          @if (niches().length) {
            <span class="cc-chip cc-chip--accent solo">{{ niches()[0] }}</span>
          }
          @if (subs() || rangeLabel()) {
            <div class="meta cc-subtle">{{ subs() || rangeLabel() }} subscribers</div>
          }
          <span class="view">View profile →</span>
        </div>
      } @else {
        <div class="media cover">
          <div class="cover-fallback" aria-hidden="true">{{ initials() }}</div>
          @if (avatar(); as image) {
            <img [src]="image" alt="" loading="lazy" (error)="onImgError($event)" />
          }
          @if (creator().ownership_verified) {
            <span class="verified cc-badge cc-badge--verified"><span aria-hidden="true">✓</span> Verified</span>
          }
        </div>
        <div class="body">
          <div class="identity">
            <div class="avatar" aria-hidden="true">
              {{ initials() }}
              @if (avatar(); as image) {
                <img [src]="image" alt="" loading="lazy" (error)="onImgError($event)" />
              }
            </div>
            <div class="details">
              <h2 class="name">
                <span>{{ creator().channel_name }}</span>
                @if (creator().ownership_verified) {
                  <span class="verified-mark" aria-hidden="true">✓</span>
                }
              </h2>
              @if (subs() || rangeLabel() || country()) {
                <div class="meta cc-subtle">
                  @if (subs() || rangeLabel()) {
                    <span class="audience">
                      <span class="youtube" aria-hidden="true"></span>
                      @if (subs()) { {{ subs() }} subscribers } @else { {{ rangeLabel() }} }
                    </span>
                  }
                  @if ((subs() || rangeLabel()) && country()) { <span aria-hidden="true">·</span> }
                  @if (country()) { <span>{{ country() }}</span> }
                </div>
              }
            </div>
          </div>
          @if (niches().length || languages()) {
            <div class="chips">
              @for (n of niches(); track n) { <span class="cc-chip cc-chip--accent">{{ n }}</span> }
              @if (languages()) { <span class="cc-chip">{{ languages() }}</span> }
            </div>
          }
          <span class="view">View Profile <span aria-hidden="true">→</span></span>
        </div>
      }
    </a>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .card {
      display: flex; flex-direction: column; height: 100%; overflow: hidden;
      background: var(--cc-surface); border: 1px solid var(--cc-border);
      border-radius: var(--cc-radius-lg); text-decoration: none; color: inherit;
      transition: border-color .15s, transform .15s, box-shadow .15s;
    }
    .card:hover { border-color: var(--cc-accent-border); transform: translateY(-3px); box-shadow: var(--cc-shadow-md); }
    .media { position: relative; aspect-ratio: 4 / 3; background: var(--cc-surface-subtle); }
    .media img { width: 100%; height: 100%; object-fit: cover; }
    .media-fallback { width: 100%; height: 100%; background: linear-gradient(145deg, #3a2770, #1a1030 70%); }
    .body { display: flex; flex-direction: column; gap: .75rem; padding: var(--cc-space-4); flex: 1; min-width: 0; }
    .name { font-weight: 700; font-size: var(--cc-text-lg); }
    .solo { align-self: flex-start; }
    .meta { display: flex; gap: .35rem; font-size: var(--cc-text-sm); flex-wrap: wrap; }
    .view { margin-top: auto; font-weight: 600; font-size: var(--cc-text-sm); color: var(--cc-accent-ink); }

    .cover { aspect-ratio: 1.62; isolation: isolate; }
    .cover img, .avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .cover img { object-position: center 40%; }
    .cover-fallback {
      display: grid; place-items: center; width: 100%; height: 100%;
      background: radial-gradient(ellipse at 24% 0%, #422675, transparent 72%),
        linear-gradient(135deg, #21143f, #17122e 70%);
      color: #c8afff; font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800;
    }
    .verified {
      position: absolute; inset: .75rem auto auto .75rem; border-radius: var(--cc-radius-pill);
      background: #311b68; color: #f4ebff; box-shadow: var(--cc-shadow-sm);
    }
    .card:not(.is-compact) { background: linear-gradient(145deg, #1a1730, #131122 78%); }
    .identity { display: flex; align-items: center; gap: .7rem; }
    .avatar {
      position: relative; display: grid; place-items: center; flex: 0 0 2.65rem; aspect-ratio: 1;
      overflow: hidden; border-radius: 50%; border: 1px solid var(--cc-border-strong);
      background: #322052; color: #dfd0ff; font-size: .8rem; font-weight: 700;
    }
    .details { min-width: 0; }
    .details .name {
      display: flex; align-items: center; gap: .4rem; margin: 0 0 .3rem;
      font-family: inherit; font-size: 1rem; letter-spacing: normal; overflow-wrap: anywhere;
    }
    .verified-mark {
      display: grid; place-items: center; flex: 0 0 .95rem; aspect-ratio: 1;
      border-radius: 50%; background: #8551f1; color: white; font-size: .65rem;
    }
    .details .meta { align-items: center; color: #c3b9dd; font-size: .76rem; }
    .audience { display: inline-flex; align-items: center; gap: .3rem; }
    .youtube { display: grid; place-items: center; width: .8rem; height: .55rem; border-radius: .15rem; background: #ed233d; }
    .youtube::after { content: ''; border: .14rem solid transparent; border-left-color: white; border-right: 0; }
    .chips { display: flex; justify-content: center; flex-wrap: wrap; gap: .4rem; }
    .chips .cc-chip { font-weight: 500; background: #24203a; color: #e1d7f5; }
    .chips .cc-chip--accent { background: #2d1b57; color: #efe6ff; }
    .card:not(.is-compact) .view {
      display: flex; align-items: center; justify-content: center; gap: .35rem; min-height: 2.35rem;
      padding: .35rem .75rem; border: 1px solid #8053d7; border-radius: var(--cc-radius-pill); color: #e1d1ff;
      transition: background-color .15s, border-color .15s;
    }
    .card:not(.is-compact):is(:hover, :focus-visible) .view { background: #2d1b57; border-color: #af82ff; }

    .is-compact { border-radius: .75rem; }
    .is-compact .media { overflow: hidden; }
    .is-compact .media img { display: block; object-position: center 32%; }
    .is-compact .body { gap: .375rem; padding: .75rem; }
    .is-compact .name { font-size: 1rem; line-height: 1.3; }
    .is-compact .meta { gap: .4rem; color: var(--cc-text-muted); }
    .is-compact .view { align-self: flex-start; padding-top: .25rem; }

    @media (min-width: 561px) {
      :host(.as-list) .card:not(.is-compact) { flex-direction: row; }
      :host(.as-list) .cover { aspect-ratio: auto; flex: 0 0 clamp(11rem, 26%, 16rem); min-height: 10rem; }
      :host(.as-list) .chips { justify-content: flex-start; }
      :host(.as-list) .view { align-self: flex-start; min-width: 9rem; }
    }
  `],
})
export class CreatorCardComponent {
  readonly creator = input.required<PublicCreatorRow>();
  readonly layout = input<'grid' | 'list'>('grid');
  readonly compact = input(false);

  readonly avatar = computed(() => avatarUrl(this.creator().avatar_path));
  readonly initials = computed(() => this.creator().channel_name.trim().split(/\s+/).slice(0, 2)
    .map((word) => Array.from(word)[0]).join('').toUpperCase());
  readonly subs = computed(() => formatSubscribers(this.creator().subscriber_count));
  readonly rangeLabel = computed(() => subscriberRangeLabel(this.creator().subscriber_range));
  readonly country = computed(() => countryLabel(this.creator().country));
  readonly niches = computed(() => this.creator().niches.map(nicheLabel).slice(0, 2));
  readonly languages = computed(() => this.creator().languages.map(languageLabel).join(', '));

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
