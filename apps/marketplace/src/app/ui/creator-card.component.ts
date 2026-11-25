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
    <a class="card" [routerLink]="['/creators', creator().slug]">
      <div class="media">
        @if (avatar()) {
          <img [src]="avatar()!" [alt]="creator().channel_name + ' channel image'" loading="lazy" (error)="onImgError($event)" />
        } @else {
          <div class="media-fallback"></div>
        }
        @if (!compact()) {
          <span class="play" aria-hidden="true">▶</span>
          @if (creator().ownership_verified) {
            <span class="verified cc-badge cc-badge--verified">✓ Verified</span>
          }
        }
      </div>
      <div class="body">
        <span class="name">{{ creator().channel_name }}</span>
        @if (compact()) {
          @if (niches().length) {
            <span class="cc-chip cc-chip--accent solo">{{ niches()[0] }}</span>
          }
          @if (subs() || rangeLabel()) {
            <div class="meta cc-subtle">{{ subs() || rangeLabel() }} subscribers</div>
          }
        } @else {
          <div class="meta cc-subtle">
            @if (subs()) { <span>{{ subs() }} subscribers</span> }
            @else if (rangeLabel()) { <span>{{ rangeLabel() }}</span> }
            @if (country()) { <span aria-hidden="true">·</span><span>{{ country() }}</span> }
          </div>
          @if (niches().length) {
            <div class="chips">
              @for (n of niches(); track n) { <span class="cc-chip cc-chip--accent">{{ n }}</span> }
              @if (languages()) { <span class="cc-chip">{{ languages() }}</span> }
            </div>
          }
        }
        <span class="view">View profile →</span>
      </div>
    </a>
  `,
  styles: [
    `
      .card {
        display: flex; flex-direction: column; height: 100%;
        background: var(--cc-surface); border: 1px solid var(--cc-border);
        border-radius: var(--cc-radius-lg); overflow: hidden; text-decoration: none; color: inherit;
        transition: border-color .15s, transform .15s, box-shadow .15s;
      }
      .card:hover { border-color: var(--cc-accent-border); transform: translateY(-3px); box-shadow: var(--cc-shadow-md); }
      .media { position: relative; aspect-ratio: 4 / 3; background: var(--cc-surface-subtle); }
      .media img { width: 100%; height: 100%; object-fit: cover; }
      .media-fallback { width: 100%; height: 100%; background: linear-gradient(145deg, #3a2770, #1a1030 70%); }
      .media .play {
        position: absolute; right: 12px; bottom: 12px; width: 40px; height: 40px;
        display: flex; align-items: center; justify-content: center; padding-left: 3px;
        background: rgba(167, 139, 250, 0.92); color: #1a1030; border-radius: 50%; font-size: 0.9rem;
        opacity: 0; transition: opacity .15s;
      }
      .card:hover .play { opacity: 1; }
      .verified { position: absolute; left: 12px; top: 12px; }
      .body { display: flex; flex-direction: column; gap: 0.5rem; padding: var(--cc-space-4); flex: 1; }
      .name { font-weight: 700; font-size: var(--cc-text-lg); }
      .solo { align-self: flex-start; }
      .meta { display: flex; gap: 0.4rem; font-size: var(--cc-text-sm); flex-wrap: wrap; }
      .chips { display: flex; gap: 0.4rem; flex-wrap: wrap; }
      .view {
        margin-top: auto; align-self: flex-start; font-weight: 600; font-size: var(--cc-text-sm);
        color: var(--cc-accent-ink); padding-top: 0.4rem;
      }
      /* List layout */
      :host(.as-list) .card { flex-direction: row; }
      :host(.as-list) .media { aspect-ratio: auto; width: 200px; flex: 0 0 200px; }
      :host(.as-list) .body { justify-content: center; }
      @media (max-width: 560px) {
        :host(.as-list) .card { flex-direction: column; }
        :host(.as-list) .media { width: 100%; aspect-ratio: 4 / 3; }
      }
    `,
  ],
})
export class CreatorCardComponent {
  readonly creator = input.required<PublicCreatorRow>();
  readonly layout = input<'grid' | 'list'>('grid');
  readonly compact = input(false);

  readonly avatar = computed(() => avatarUrl(this.creator().avatar_path));
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
