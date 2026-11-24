import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { PublicCreatorRow } from '@creatorconnect/shared';
import { avatarUrl } from '../core/env';
import {
  countryLabel,
  formatLabel,
  formatSubscribers,
  languageLabel,
  nicheLabel,
  subscriberRangeLabel,
} from './display';

@Component({
  selector: 'app-creator-card',
  imports: [RouterLink],
  template: `
    <a class="card cc-card" [routerLink]="['/creators', creator().slug]">
      <div class="top">
        <img
          class="avatar"
          [src]="avatar() ?? placeholder"
          [alt]="creator().channel_name + ' channel avatar'"
          width="56"
          height="56"
          loading="lazy"
        />
        <div class="id">
          <div class="name-row">
            <span class="name">{{ creator().channel_name }}</span>
            @if (creator().ownership_verified) {
              <span class="cc-badge cc-badge--verified" title="Channel ownership verified">✓ Verified</span>
            }
          </div>
          <div class="meta cc-subtle">
            @if (subs()) {
              <span>{{ subs() }} subscribers</span>
            } @else if (rangeLabel()) {
              <span>{{ rangeLabel() }}</span>
            }
            @if (country()) {
              <span aria-hidden="true">·</span>
              <span>{{ country() }}</span>
            }
          </div>
        </div>
      </div>

      @if (niches().length) {
        <div class="chips">
          @for (n of niches(); track n) {
            <span class="cc-chip cc-chip--accent">{{ n }}</span>
          }
          @if (languages()) {
            <span class="cc-chip">{{ languages() }}</span>
          }
        </div>
      }

      @if (formats().length) {
        <div class="formats cc-subtle">
          {{ formats().join(' · ') }}
        </div>
      }
    </a>
  `,
  styles: [
    `
      .card {
        display: flex;
        flex-direction: column;
        gap: var(--cc-space-3);
        padding: var(--cc-space-5);
        text-decoration: none;
        color: inherit;
        transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
        height: 100%;
      }
      .card:hover {
        box-shadow: var(--cc-shadow-md);
        transform: translateY(-2px);
        border-color: var(--cc-border-strong);
      }
      .top { display: flex; gap: var(--cc-space-3); align-items: center; }
      .avatar {
        width: 56px; height: 56px; border-radius: var(--cc-radius-pill);
        object-fit: cover; background: var(--cc-bg-subtle); flex: 0 0 auto;
      }
      .name-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
      .name { font-weight: 700; font-size: var(--cc-text-lg); }
      .meta { display: flex; gap: 0.4rem; font-size: var(--cc-text-sm); flex-wrap: wrap; }
      .chips { display: flex; gap: 0.4rem; flex-wrap: wrap; }
      .formats { font-size: var(--cc-text-sm); }
    `,
  ],
})
export class CreatorCardComponent {
  readonly creator = input.required<PublicCreatorRow>();
  readonly placeholder =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="56" height="56" fill="%23f3f1ec"/></svg>';

  readonly avatar = computed(() => avatarUrl(this.creator().avatar_path));
  readonly subs = computed(() => formatSubscribers(this.creator().subscriber_count));
  readonly rangeLabel = computed(() => subscriberRangeLabel(this.creator().subscriber_range));
  readonly country = computed(() => countryLabel(this.creator().country));
  readonly niches = computed(() => this.creator().niches.map(nicheLabel));
  readonly languages = computed(() =>
    this.creator().languages.map(languageLabel).join(', ')
  );
  readonly formats = computed(() => this.creator().formats.map(formatLabel));
}
