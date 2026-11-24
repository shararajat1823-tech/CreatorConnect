import { Component, PendingTasks, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import {
  COLLAB_FORMATS,
  COLLAB_FORMAT_LABELS,
  COUNTRIES,
  LANGUAGES,
  NICHES,
  SUBSCRIBER_RANGES,
} from '@creatorconnect/shared';
import { CreatorsService, DirectoryFilters, DirectoryResult } from '../../core/creators.service';
import { MetaService } from '../../core/meta.service';
import { CreatorCardComponent } from '../../ui/creator-card.component';
import { StateViewComponent } from '../../ui/state-view.component';

@Component({
  selector: 'app-directory',
  imports: [RouterLink, CreatorCardComponent, StateViewComponent],
  template: `
    <div class="cc-container page">
      <header class="head">
        <h1>Find creators</h1>
        <p class="cc-muted">
          Browse approved YouTube creators and reach out with a sponsorship brief or a
          collaboration proposal.
        </p>
      </header>

      <div class="layout">
        <!-- Mobile filter toggle -->
        <button
          class="cc-btn cc-btn--secondary filter-toggle"
          type="button"
          [attr.aria-expanded]="drawerOpen()"
          aria-controls="filters"
          (click)="drawerOpen.set(!drawerOpen())"
        >
          Filters @if (activeCount()) { <span class="count">{{ activeCount() }}</span> }
        </button>

        <aside
          id="filters"
          class="filters"
          [class.open]="drawerOpen()"
          aria-label="Filter creators"
        >
          <div class="filters-inner">
            <div class="filters-head">
              <h2>Filters</h2>
              @if (activeCount()) {
                <button class="cc-btn cc-btn--ghost cc-btn--sm" type="button" (click)="clear()">
                  Clear all
                </button>
              }
            </div>

            <div class="cc-field">
              <label class="cc-label" for="f-search">Search</label>
              <input
                id="f-search"
                class="cc-input"
                type="search"
                placeholder="Name or channel handle"
                [value]="filters().q ?? ''"
                (input)="onSearch($event)"
              />
            </div>

            <div class="cc-field">
              <label class="cc-label" for="f-niche">Niche</label>
              <select id="f-niche" class="cc-select" [value]="filters().niche ?? ''" (change)="set('niche', $event)">
                <option value="">All niches</option>
                @for (n of niches; track n.id) { <option [value]="n.id">{{ n.label }}</option> }
              </select>
            </div>

            <div class="cc-field">
              <label class="cc-label" for="f-lang">Language</label>
              <select id="f-lang" class="cc-select" [value]="filters().language ?? ''" (change)="set('language', $event)">
                <option value="">Any language</option>
                @for (l of languages; track l.code) { <option [value]="l.code">{{ l.label }}</option> }
              </select>
            </div>

            <div class="cc-field">
              <label class="cc-label" for="f-country">Country</label>
              <select id="f-country" class="cc-select" [value]="filters().country ?? ''" (change)="set('country', $event)">
                <option value="">Any country</option>
                @for (c of countries; track c.code) { <option [value]="c.code">{{ c.label }}</option> }
              </select>
            </div>

            <div class="cc-field">
              <label class="cc-label" for="f-range">Subscribers</label>
              <select id="f-range" class="cc-select" [value]="filters().range ?? ''" (change)="set('range', $event)">
                <option value="">Any size</option>
                @for (r of ranges; track r.id) { <option [value]="r.id">{{ r.label }}</option> }
              </select>
            </div>

            <div class="cc-field">
              <label class="cc-label" for="f-format">Collaboration type</label>
              <select id="f-format" class="cc-select" [value]="filters().format ?? ''" (change)="set('format', $event)">
                <option value="">Any format</option>
                @for (f of formats; track f.id) { <option [value]="f.id">{{ f.label }}</option> }
              </select>
            </div>
          </div>
        </aside>

        <section class="results" aria-live="polite">
          @if (loading()) {
            <app-state-view [spinner]="true" title="Loading creators…" />
          } @else if (error()) {
            <app-state-view icon="⚠" title="Something went wrong" [message]="error()!">
              <button class="cc-btn cc-btn--secondary" type="button" (click)="reload()">Try again</button>
            </app-state-view>
          } @else if (!result() || result()!.rows.length === 0) {
            <app-state-view
              icon="🔍"
              title="No creators match your filters"
              message="Try widening your search or clearing some filters."
            >
              @if (activeCount()) {
                <button class="cc-btn cc-btn--secondary" type="button" (click)="clear()">Clear filters</button>
              }
            </app-state-view>
          } @else {
            <p class="count-line cc-subtle">
              {{ result()!.total }} creator{{ result()!.total === 1 ? '' : 's' }}
            </p>
            <div class="cc-grid-cards">
              @for (c of result()!.rows; track c.id) {
                <app-creator-card [creator]="c" />
              }
            </div>

            @if (totalPages() > 1) {
              <nav class="pager" aria-label="Pagination">
                <a
                  class="cc-btn cc-btn--secondary cc-btn--sm"
                  [class.disabled]="page() <= 1"
                  [attr.aria-disabled]="page() <= 1"
                  [routerLink]="[]"
                  [queryParams]="pageParams(page() - 1)"
                  queryParamsHandling="merge"
                >‹ Prev</a>
                <span class="cc-subtle">Page {{ page() }} of {{ totalPages() }}</span>
                <a
                  class="cc-btn cc-btn--secondary cc-btn--sm"
                  [class.disabled]="page() >= totalPages()"
                  [attr.aria-disabled]="page() >= totalPages()"
                  [routerLink]="[]"
                  [queryParams]="pageParams(page() + 1)"
                  queryParamsHandling="merge"
                >Next ›</a>
              </nav>
            }
          }
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .page { padding-block: var(--cc-space-6) var(--cc-space-8); }
      .head { margin-bottom: var(--cc-space-5); }
      .layout { display: grid; grid-template-columns: 260px 1fr; gap: var(--cc-space-6); align-items: start; }
      .filters { position: sticky; top: 80px; }
      .filters-inner { background: var(--cc-surface); border: 1px solid var(--cc-border); border-radius: var(--cc-radius-lg); padding: var(--cc-space-4); }
      .filters-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--cc-space-3); }
      .filters-head h2 { font-size: var(--cc-text-lg); margin: 0; }
      .filter-toggle { display: none; }
      .count { background: var(--cc-accent); color: #fff; border-radius: var(--cc-radius-pill); padding: 0 0.45rem; font-size: var(--cc-text-xs); }
      .count-line { margin-bottom: var(--cc-space-4); }
      .pager { display: flex; align-items: center; justify-content: center; gap: var(--cc-space-4); margin-top: var(--cc-space-6); }
      .pager .disabled { opacity: 0.5; pointer-events: none; }
      @media (max-width: 820px) {
        .layout { grid-template-columns: 1fr; }
        .filter-toggle { display: inline-flex; width: fit-content; }
        .filters { position: static; display: none; }
        .filters.open { display: block; }
      }
    `,
  ],
})
export class DirectoryComponent {
  private readonly creators = inject(CreatorsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly meta = inject(MetaService);
  private readonly pendingTasks = inject(PendingTasks);

  readonly niches = NICHES;
  readonly languages = LANGUAGES;
  readonly countries = COUNTRIES;
  readonly ranges = SUBSCRIBER_RANGES;
  readonly formats = COLLAB_FORMATS.map((id) => ({ id, label: COLLAB_FORMAT_LABELS[id] }));

  readonly filters = signal<DirectoryFilters>({});
  readonly result = signal<DirectoryResult | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly drawerOpen = signal(false);

  readonly page = computed(() => this.result()?.page ?? 1);
  readonly totalPages = computed(() => {
    const r = this.result();
    return r ? Math.max(1, Math.ceil(r.total / r.pageSize)) : 1;
  });
  readonly activeCount = computed(() => {
    const f = this.filters();
    return [f.q, f.niche, f.language, f.country, f.range, f.format].filter(Boolean).length;
  });

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.meta.setPage({
      title: 'Find creators — directory',
      description:
        'Search approved YouTube creators by niche, language, country, audience size and collaboration format.',
      path: '/directory',
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((pm) => {
      const filters: DirectoryFilters = {
        q: pm.get('q') ?? undefined,
        niche: pm.get('niche') ?? undefined,
        language: pm.get('language') ?? undefined,
        country: pm.get('country') ?? undefined,
        range: pm.get('range') ?? undefined,
        format: pm.get('format') ?? undefined,
        page: pm.get('page') ? Number(pm.get('page')) : 1,
      };
      this.filters.set(filters);
      this.drawerOpen.set(false);
      this.load(filters);
    });
  }

  private async load(filters: DirectoryFilters): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    const done = this.pendingTasks.add();
    try {
      const res = await this.creators.searchDirectory(filters);
      this.result.set(res);
      this.error.set(res.error && res.error !== 'not_configured' ? res.error : null);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
      done();
    }
  }

  reload(): void {
    this.load(this.filters());
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.navigate({ q: value || null, page: null }), 300);
  }

  set(key: keyof DirectoryFilters, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.navigate({ [key]: value || null, page: null });
  }

  clear(): void {
    this.router.navigate(['/directory']);
  }

  pageParams(page: number): Params {
    return { page: page < 1 ? 1 : page };
  }

  private navigate(params: Params): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
