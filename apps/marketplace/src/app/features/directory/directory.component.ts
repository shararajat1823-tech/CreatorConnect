import {
  Component,
  PendingTasks,
  TransferState,
  computed,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';
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
import { SupabaseService } from '../../core/supabase.service';
import { CreatorCardComponent } from '../../ui/creator-card.component';
import { StateViewComponent } from '../../ui/state-view.component';

@Component({
  selector: 'app-directory',
  imports: [RouterLink, CreatorCardComponent, StateViewComponent],
  template: `
    <div class="cc-container page">
      <header class="head">
        <h1>Find Creators</h1>
        <p class="cc-muted">Search and filter YouTube creators for sponsorships and collaborations.</p>
      </header>

      <div class="search-wrap">
        <span class="search-icon" aria-hidden="true">⌕</span>
        <input
          class="search"
          type="search"
          aria-label="Search creators"
          placeholder="Search creators by name, niche, or keywords…"
          [value]="filters().q ?? ''"
          (input)="onSearch($event)"
        />
      </div>

      <div class="filters">
        <label class="f">
          <span>Niche</span>
          <select id="f-niche" class="cc-select" [value]="filters().niche ?? ''" (change)="set('niche', $event)">
            <option value="">All niches</option>
            @for (n of niches; track n.id) { <option [value]="n.id">{{ n.label }}</option> }
          </select>
        </label>
        <label class="f">
          <span>Language</span>
          <select class="cc-select" [value]="filters().language ?? ''" (change)="set('language', $event)">
            <option value="">All languages</option>
            @for (l of languages; track l.code) { <option [value]="l.code">{{ l.label }}</option> }
          </select>
        </label>
        <label class="f">
          <span>Country</span>
          <select class="cc-select" [value]="filters().country ?? ''" (change)="set('country', $event)">
            <option value="">All countries</option>
            @for (c of countries; track c.code) { <option [value]="c.code">{{ c.label }}</option> }
          </select>
        </label>
        <label class="f">
          <span>Subscribers</span>
          <select class="cc-select" [value]="filters().range ?? ''" (change)="set('range', $event)">
            <option value="">Any size</option>
            @for (r of ranges; track r.id) { <option [value]="r.id">{{ r.label }}</option> }
          </select>
        </label>
        <label class="f">
          <span>Collaboration format</span>
          <select class="cc-select" [value]="filters().format ?? ''" (change)="set('format', $event)">
            <option value="">Any format</option>
            @for (f of formats; track f.id) { <option [value]="f.id">{{ f.label }}</option> }
          </select>
        </label>
        @if (activeCount()) {
          <button class="cc-btn cc-btn--ghost cc-btn--sm clear" type="button" (click)="clear()">Clear</button>
        }
      </div>

      <section class="results" aria-live="polite">
        @if (loading() && !result()) {
          <app-state-view [spinner]="true" title="Loading creators…" />
        } @else if (error()) {
          <app-state-view icon="⚠" title="Something went wrong" [message]="error()!">
            <button class="cc-btn cc-btn--secondary" type="button" (click)="reload()">Try again</button>
          </app-state-view>
        } @else if (!result() || result()!.rows.length === 0) {
          <app-state-view icon="🔍" title="No creators match your filters"
            message="Try widening your search or clearing some filters.">
            @if (activeCount()) {
              <button class="cc-btn cc-btn--secondary" type="button" (click)="clear()">Clear filters</button>
            }
          </app-state-view>
        } @else {
          <div class="results-head cc-spread">
            <p class="count-line cc-subtle">{{ result()!.total }} creator{{ result()!.total === 1 ? '' : 's' }}</p>
            <div class="controls">
              <label class="sort">
                <span class="cc-subtle">Sort by</span>
                <select class="cc-select cc-select--sm" [value]="filters().sort ?? 'relevance'" (change)="set('sort', $event)">
                  <option value="relevance">Relevance</option>
                  <option value="subscribers">Subscribers</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
              <div class="view-toggle" role="group" aria-label="View">
                <button type="button" [class.on]="view() === 'grid'" (click)="view.set('grid')" aria-label="Grid view">▦</button>
                <button type="button" [class.on]="view() === 'list'" (click)="view.set('list')" aria-label="List view">☰</button>
              </div>
            </div>
          </div>

          <div [class]="view() === 'grid' ? 'cc-grid-cards' : 'list-view'">
            @for (c of result()!.rows; track c.id) {
              <app-creator-card [creator]="c" [layout]="view()" />
            }
          </div>

          @if (totalPages() > 1) {
            <nav class="pager" aria-label="Pagination">
              <a class="cc-btn cc-btn--secondary cc-btn--sm" [class.disabled]="page() <= 1"
                [attr.aria-disabled]="page() <= 1" [routerLink]="[]" [queryParams]="pageParams(page() - 1)"
                queryParamsHandling="merge">‹ Prev</a>
              <span class="cc-subtle">Page {{ page() }} of {{ totalPages() }}</span>
              <a class="cc-btn cc-btn--secondary cc-btn--sm" [class.disabled]="page() >= totalPages()"
                [attr.aria-disabled]="page() >= totalPages()" [routerLink]="[]" [queryParams]="pageParams(page() + 1)"
                queryParamsHandling="merge">Next ›</a>
            </nav>
          }
        }
      </section>
    </div>
  `,
  styles: [
    `
      .page { padding-block: var(--cc-space-7) var(--cc-space-8); }
      .head { margin-bottom: var(--cc-space-5); }
      .search-wrap { position: relative; margin-bottom: var(--cc-space-4); }
      .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); font-size: 1.3rem; color: var(--cc-text-subtle); }
      .search {
        width: 100%; font: inherit; font-size: var(--cc-text-lg); padding: 1rem 1.2rem 1rem 3rem;
        color: var(--cc-text); background: var(--cc-surface); border: 1px solid var(--cc-border-strong);
        border-radius: var(--cc-radius-pill);
      }
      .search::placeholder { color: var(--cc-text-subtle); }
      .search:focus { border-color: var(--cc-accent); }
      .filters { display: flex; flex-wrap: wrap; gap: var(--cc-space-3); align-items: end; margin-bottom: var(--cc-space-6); }
      .f { display: flex; flex-direction: column; gap: 0.35rem; font-size: var(--cc-text-sm); font-weight: 600; min-width: 150px; flex: 1; }
      .f span { color: var(--cc-text-muted); }
      .clear { align-self: center; margin-top: 1.2rem; }
      .results-head { margin-bottom: var(--cc-space-5); }
      .controls { display: flex; align-items: center; gap: var(--cc-space-4); }
      .sort { display: inline-flex; align-items: center; gap: 0.5rem; font-size: var(--cc-text-sm); }
      .cc-select--sm { min-height: 38px; padding-block: 0.3rem; }
      .view-toggle { display: inline-flex; border: 1px solid var(--cc-border-strong); border-radius: var(--cc-radius-md); overflow: hidden; }
      .view-toggle button { border: 0; background: transparent; color: var(--cc-text-subtle); font-size: 1.1rem; padding: 0.4rem 0.7rem; cursor: pointer; }
      .view-toggle button.on { background: var(--cc-accent-soft); color: var(--cc-accent-ink); }
      .list-view { display: flex; flex-direction: column; gap: var(--cc-space-4); }
      .pager { display: flex; align-items: center; justify-content: center; gap: var(--cc-space-4); margin-top: var(--cc-space-7); }
      .pager .disabled { opacity: 0.5; pointer-events: none; }
      @media (max-width: 640px) {
        .f { min-width: 100%; }
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
  private readonly supa = inject(SupabaseService);
  private readonly transferState = inject(TransferState);

  readonly niches = NICHES;
  readonly languages = LANGUAGES;
  readonly countries = COUNTRIES;
  readonly ranges = SUBSCRIBER_RANGES;
  readonly formats = COLLAB_FORMATS.map((id) => ({ id, label: COLLAB_FORMAT_LABELS[id] }));

  readonly filters = signal<DirectoryFilters>({});
  readonly result = signal<DirectoryResult | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly view = signal<'grid' | 'list'>('grid');

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
        sort: pm.get('sort') ?? undefined,
        page: pm.get('page') ? Number(pm.get('page')) : 1,
      };
      this.filters.set(filters);
      this.load(filters);
    });
  }

  private async load(filters: DirectoryFilters): Promise<void> {
    const key = makeStateKey<DirectoryResult>('directory:' + JSON.stringify(filters));
    if (this.supa.isBrowser && this.transferState.hasKey(key)) {
      const cached = this.transferState.get<DirectoryResult | null>(key, null);
      this.transferState.remove(key);
      if (cached) {
        this.result.set(cached);
        this.error.set(cached.error && cached.error !== 'not_configured' ? cached.error : null);
        this.loading.set(false);
        return;
      }
    }

    this.loading.set(true);
    this.error.set(null);
    const done = this.pendingTasks.add();
    try {
      const res = await this.creators.searchDirectory(filters);
      if (!this.supa.isBrowser) this.transferState.set(key, res);
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
