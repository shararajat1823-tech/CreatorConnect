import {
  Component,
  Input,
  OnInit,
  PendingTasks,
  TransferState,
  computed,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  type PricingItem,
  type PublicCreatorRow,
  type RequestType,
  parseYouTubeChannelUrl,
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
  host: { class: 'creator-profile-page' },
  templateUrl: './creator-profile.component.html',
  styleUrls: ['./creator-profile.component.scss', './creator-profile-panels.scss'],
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

  readonly avatarFailed = signal(false);
  readonly formatLabel = formatLabel;

  avatar = () => avatarUrl(this.creator()?.avatar_path);
  subs = () => formatSubscribers(this.creator()?.subscriber_count);
  rangeLabel = () => subscriberRangeLabel(this.creator()?.subscriber_range);
  country = () => countryLabel(this.creator()?.country);
  niches = () => (this.creator()?.niches ?? []).map(nicheLabel);
  languages = () => (this.creator()?.languages ?? []).map(languageLabel).join(', ');
  formats = () => (this.creator()?.formats ?? []).map(formatLabel);
  pricing = () => (this.creator()?.pricing as PricingItem[] | null) ?? null;
  readonly initials = computed(() => {
    const name = this.creator()?.channel_name.trim() ?? '';
    return name.split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0]).join('').toUpperCase();
  });
  readonly channelVideos = computed(() => {
    const channel = parseYouTubeChannelUrl(this.creator()?.youtube_url ?? '');
    return channel ? channel.normalized + '/videos' : null;
  });
  readonly videos = computed<VideoView[]>(() =>
    (this.creator()?.videos ?? []).map((video) => ({
      id: video.video_id,
      title: video.title ?? 'Watch on YouTube',
      thumb: youTubeThumbnailUrl(video.video_id),
      watch: youTubeWatchUrl(video.video_id),
    }))
  );

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

  priceText(p: PricingItem): string {
    if (p.note && p.price_min == null && p.price_max == null) return p.note;
    const cur = p.currency ?? 'USD';
    if (p.price_min != null && p.price_max != null) return `${cur} ${p.price_min}–${p.price_max}`;
    if (p.price_min != null) return `From ${cur} ${p.price_min}`;
    if (p.price_max != null) return `Up to ${cur} ${p.price_max}`;
    return p.note ?? 'Contact for pricing';
  }
}
