import {
  Component,
  DestroyRef,
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
  host: { class: 'creator-directory' },
  imports: [RouterLink, CreatorCardComponent, StateViewComponent],
  templateUrl: './directory.component.html',
  styleUrl: './directory.component.scss',
})
export class DirectoryComponent {
  private readonly creators = inject(CreatorsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly meta = inject(MetaService);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly supa = inject(SupabaseService);
  private readonly transferState = inject(TransferState);

  readonly filterChoices = [
    { key: 'niche', label: 'Niche', empty: 'All niches', options: NICHES },
    {
      key: 'language',
      label: 'Language',
      empty: 'All languages',
      options: LANGUAGES.map(({ code, label }) => ({ id: code, label })),
    },
    {
      key: 'country',
      label: 'Country',
      empty: 'All countries',
      options: COUNTRIES.map(({ code, label }) => ({ id: code, label })),
    },
    { key: 'range', label: 'Subscribers', empty: 'Any size', options: SUBSCRIBER_RANGES },
    {
      key: 'format',
      label: 'Collaboration format',
      empty: 'Any format',
      options: COLLAB_FORMATS.map((id) => ({ id, label: COLLAB_FORMAT_LABELS[id] })),
    },
  ] as const;

  readonly filters = signal<DirectoryFilters>({});
  readonly result = signal<DirectoryResult | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly view = signal<'grid' | 'list'>('grid');

  readonly page = computed(() => this.result()?.page ?? 1);
  readonly totalPages = computed(() => {
    const result = this.result();
    return result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  });
  readonly hasFilters = computed(() => {
    const filters = this.filters();
    return !!filters.q || this.filterChoices.some(({ key }) => !!filters[key]);
  });

  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private loadVersion = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
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
      void this.load(filters);
    });
  }

  private async load(filters: DirectoryFilters): Promise<void> {
    const version = ++this.loadVersion;
    const key = makeStateKey<DirectoryResult>('directory:' + JSON.stringify(filters));
    if (this.supa.isBrowser && this.transferState.hasKey(key)) {
      const cached = this.transferState.get<DirectoryResult | null>(key, null);
      this.transferState.remove(key);
      if (cached) {
        this.setResult(cached);
        this.loading.set(false);
        return;
      }
    }

    this.loading.set(true);
    this.error.set(null);
    const done = this.pendingTasks.add();
    try {
      const result = await this.creators.searchDirectory(filters);
      if (!this.supa.isBrowser) this.transferState.set(key, result);
      if (version === this.loadVersion) this.setResult(result);
    } catch (error) {
      if (version === this.loadVersion) this.error.set((error as Error).message);
    } finally {
      if (version === this.loadVersion) this.loading.set(false);
      done();
    }
  }

  private setResult(result: DirectoryResult): void {
    this.result.set(result);
    this.error.set(result.error && result.error !== 'not_configured' ? result.error : null);
  }

  reload(): void {
    void this.load(this.filters());
  }

  onSearch(value: string): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.search(value), 300);
  }

  submitSearch(event: SubmitEvent, value: string): void {
    event.preventDefault();
    clearTimeout(this.searchTimer);
    this.search(value);
  }

  set(key: keyof DirectoryFilters, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.navigate({ [key]: value || null, page: null });
  }

  clear(): void {
    clearTimeout(this.searchTimer);
    void this.router.navigate(['/directory']);
  }

  private search(value: string): void {
    this.navigate({ q: value.trim() || null, page: null });
  }

  private navigate(params: Params): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
