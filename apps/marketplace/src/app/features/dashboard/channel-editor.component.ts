import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  COLLAB_FORMATS,
  COLLAB_FORMAT_LABELS,
  COUNTRIES,
  CREATOR_STATUS_LABELS,
  type CreatorRow,
  LANGUAGES,
  LIMITS,
  NICHES,
  parseYouTubeVideoId,
  validateProfileDraft,
} from '@creatorconnect/shared';
import { AuthService } from '../../core/auth.service';
import { CreatorsService } from '../../core/creators.service';
import { avatarUrl } from '../../core/env';
import { StateViewComponent } from '../../ui/state-view.component';

interface VideoInput {
  url: string;
  title: string;
}

@Component({
  selector: 'app-channel-editor',
  imports: [FormsModule, RouterLink, StateViewComponent],
  template: `
    @if (loading()) {
      <app-state-view [spinner]="true" title="Loading your channel…" />
    } @else {
      <div class="cc-spread header-row">
        <h1>Your channel</h1>
        @if (creator()) {
          <span class="cc-badge" [class]="'cc-badge--' + creator()!.status">
            {{ statusLabel(creator()!.status) }}
          </span>
        }
      </div>

      @if (creator()?.status === 'changes_requested' && creator()?.review_note) {
        <div class="cc-form-error" role="alert">
          <strong>Changes requested:</strong> {{ creator()!.review_note }}
        </div>
      }
      @if (creator()?.status === 'published') {
        <div class="cc-form-success">
          Your profile is live at
          <a [routerLink]="['/creators', creator()!.slug]">/creators/{{ creator()!.slug }}</a>.
          Edits are reviewed before the changes go live.
        </div>
      }
      @if (saveError()) { <div class="cc-form-error" role="alert">{{ saveError() }}</div> }
      @if (saved()) { <div class="cc-form-success" role="status">Saved.</div> }

      <form class="cc-stack" (ngSubmit)="save()" novalidate>
        <section class="cc-panel">
          <h2>Basics</h2>
          <div class="cc-field">
            <label class="cc-label" for="cn">Channel name</label>
            <input id="cn" class="cc-input" name="cn" [(ngModel)]="model.channelName" maxlength="80"
              [attr.aria-invalid]="!!errors()['channelName']" required />
            @if (errors()['channelName']) { <span class="cc-error">{{ errors()['channelName'] }}</span> }
          </div>
          <div class="cc-field">
            <label class="cc-label" for="yt">YouTube channel URL</label>
            <input id="yt" class="cc-input" name="yt" [(ngModel)]="model.youtubeUrl"
              placeholder="https://www.youtube.com/@yourchannel"
              [attr.aria-invalid]="!!errors()['youtubeUrl']" required />
            @if (errors()['youtubeUrl']) { <span class="cc-error">{{ errors()['youtubeUrl'] }}</span> }
            <span class="cc-hint">Supported: /&#64;handle, /channel/UC…, /c/Name, /user/Name</span>
          </div>
          <div class="cc-field">
            <label class="cc-label" for="bio">Bio</label>
            <textarea id="bio" class="cc-textarea" name="bio" [(ngModel)]="model.bio" maxlength="2000"></textarea>
            @if (errors()['bio']) { <span class="cc-error">{{ errors()['bio'] }}</span> }
          </div>
          <div class="cc-field">
            <label class="cc-label" for="avatar">Profile image</label>
            <div class="avatar-row">
              <img class="avatar-preview" [src]="avatarPreview() ?? placeholder" alt="" width="64" height="64" />
              <input id="avatar" type="file" accept="image/jpeg,image/png,image/webp" (change)="onAvatar($event)" />
            </div>
            @if (avatarError()) { <span class="cc-error">{{ avatarError() }}</span> }
            <span class="cc-hint">JPEG, PNG or WebP, up to 5&nbsp;MB.</span>
          </div>
        </section>

        <section class="cc-panel">
          <h2>Audience</h2>
          <div class="grid2">
            <div class="cc-field">
              <label class="cc-label" for="country">Country</label>
              <select id="country" class="cc-select" name="country" [(ngModel)]="model.country">
                <option value="">Prefer not to say</option>
                @for (c of countries; track c.code) { <option [value]="c.code">{{ c.label }}</option> }
              </select>
            </div>
            <div class="cc-field">
              <label class="cc-label" for="subs">Subscriber count (optional)</label>
              <input id="subs" class="cc-input" type="number" min="0" name="subs" [(ngModel)]="model.subscriberCount" />
              <span class="cc-hint">Self-reported; shown as an approximate range.</span>
            </div>
          </div>

          <fieldset class="cc-field">
            <legend class="cc-label">Niches (up to {{ maxNiches }})</legend>
            <div class="chips-select">
              @for (n of niches; track n.id) {
                <label class="toggle" [class.on]="model.niches.includes(n.id)">
                  <input type="checkbox" [checked]="model.niches.includes(n.id)"
                    (change)="toggle('niches', n.id, maxNiches)" />
                  {{ n.label }}
                </label>
              }
            </div>
            @if (errors()['niches']) { <span class="cc-error">{{ errors()['niches'] }}</span> }
          </fieldset>

          <fieldset class="cc-field">
            <legend class="cc-label">Languages</legend>
            <div class="chips-select">
              @for (l of languages; track l.code) {
                <label class="toggle" [class.on]="model.languages.includes(l.code)">
                  <input type="checkbox" [checked]="model.languages.includes(l.code)"
                    (change)="toggle('languages', l.code)" />
                  {{ l.label }}
                </label>
              }
            </div>
          </fieldset>
        </section>

        <section class="cc-panel">
          <h2>Collaboration formats</h2>
          <div class="chips-select">
            @for (f of formats; track f.id) {
              <label class="toggle" [class.on]="model.formats.includes(f.id)">
                <input type="checkbox" [checked]="model.formats.includes(f.id)" (change)="toggle('formats', f.id)" />
                {{ f.label }}
              </label>
            }
          </div>
        </section>

        <section class="cc-panel">
          <h2>Selected videos</h2>
          <p class="cc-muted">Add up to {{ maxVideos }} YouTube video links to showcase.</p>
          @for (v of model.videos; track $index) {
            <div class="video-row">
              <input class="cc-input" [(ngModel)]="v.url" [name]="'vurl' + $index"
                placeholder="https://www.youtube.com/watch?v=…" aria-label="Video URL" />
              <input class="cc-input" [(ngModel)]="v.title" [name]="'vtitle' + $index"
                placeholder="Title (optional)" aria-label="Video title" />
              <button class="cc-btn cc-btn--ghost cc-btn--sm" type="button" (click)="removeVideo($index)">Remove</button>
            </div>
          }
          @if (errors()['videoUrls']) { <span class="cc-error">{{ errors()['videoUrls'] }}</span> }
          @if (model.videos.length < maxVideos) {
            <button class="cc-btn cc-btn--ghost cc-btn--sm" type="button" (click)="addVideo()">+ Add a video</button>
          }
        </section>

        <div class="actions cc-row">
          <button class="cc-btn cc-btn--secondary" type="submit" [disabled]="busy()">
            {{ busy() ? 'Saving…' : 'Save draft' }}
          </button>
          <button class="cc-btn cc-btn--primary" type="button" (click)="submit()" [disabled]="busy()">
            {{ submitLabel() }}
          </button>
          @if (creator()?.status === 'published') {
            <button class="cc-btn cc-btn--ghost" type="button" (click)="unpublish()" [disabled]="busy()">Unpublish</button>
          }
        </div>
      </form>
    }
  `,
  styles: [
    `
      .header-row { margin-bottom: var(--cc-space-4); }
      .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--cc-space-4); }
      @media (max-width: 640px) { .grid2 { grid-template-columns: 1fr; } }
      .chips-select { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .toggle {
        display: inline-flex; align-items: center; gap: 0.4rem; font-size: var(--cc-text-sm);
        padding: 0.4rem 0.7rem; border: 1px solid var(--cc-border-strong); border-radius: var(--cc-radius-pill);
        cursor: pointer; user-select: none;
      }
      .toggle.on { background: var(--cc-accent-soft); border-color: var(--cc-accent-border); color: var(--cc-accent-ink); }
      .toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
      .avatar-row { display: flex; align-items: center; gap: var(--cc-space-3); }
      .avatar-preview { width: 64px; height: 64px; border-radius: var(--cc-radius-pill); object-fit: cover; background: var(--cc-bg-subtle); }
      .video-row { display: grid; grid-template-columns: 2fr 1.5fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center; }
      @media (max-width: 640px) { .video-row { grid-template-columns: 1fr; } }
      .actions { margin-top: var(--cc-space-4); }
      fieldset { border: 0; padding: 0; margin: 0 0 var(--cc-space-4); }
    `,
  ],
})
export class ChannelEditorComponent {
  private readonly creators = inject(CreatorsService);
  private readonly auth = inject(AuthService);

  readonly niches = NICHES;
  readonly languages = LANGUAGES;
  readonly countries = COUNTRIES;
  readonly formats = COLLAB_FORMATS.map((id) => ({ id, label: COLLAB_FORMAT_LABELS[id] }));
  readonly maxNiches = LIMITS.maxNiches;
  readonly maxVideos = LIMITS.maxSelectedVideos;
  readonly placeholder =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23f3f1ec"/></svg>';

  readonly loading = signal(true);
  readonly creator = signal<CreatorRow | null>(null);
  readonly busy = signal(false);
  readonly saved = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly avatarError = signal<string | null>(null);
  readonly errors = signal<Record<string, string>>({});
  readonly localAvatarPreview = signal<string | null>(null);
  private pendingAvatar: File | null = null;

  model = {
    channelName: '',
    youtubeUrl: '',
    bio: '',
    country: '',
    subscriberCount: null as number | null,
    avatarPath: null as string | null,
    niches: [] as string[],
    languages: [] as string[],
    formats: [] as string[],
    videos: [] as VideoInput[],
  };

  readonly avatarPreview = computed(
    () => this.localAvatarPreview() ?? avatarUrl(this.model.avatarPath)
  );
  readonly submitLabel = computed(() => {
    const s = this.creator()?.status;
    if (s === 'published') return 'Submit changes for review';
    if (s === 'under_review') return 'Resubmit for review';
    return 'Submit for review';
  });

  constructor() {
    afterNextRender(async () => {
      await this.auth.whenReady;
      const c = await this.creators.getMyCreator();
      if (c) this.hydrate(c);
      this.loading.set(false);
    });
  }

  private hydrate(c: CreatorRow): void {
    this.creator.set(c);
    this.model = {
      channelName: c.channel_name,
      youtubeUrl: c.youtube_url,
      bio: c.bio ?? '',
      country: c.country ?? '',
      subscriberCount: c.subscriber_count,
      avatarPath: c.avatar_path,
      niches: [...c.niches],
      languages: [...c.languages],
      formats: [...c.formats],
      videos: (c.videos ?? []).map((v) => ({
        url: `https://www.youtube.com/watch?v=${v.video_id}`,
        title: v.title ?? '',
      })),
    };
  }

  toggle(key: 'niches' | 'languages' | 'formats', value: string, max?: number): void {
    const list = this.model[key];
    const i = list.indexOf(value);
    if (i >= 0) list.splice(i, 1);
    else {
      if (max && list.length >= max) return;
      list.push(value);
    }
  }

  addVideo(): void {
    if (this.model.videos.length < this.maxVideos) this.model.videos.push({ url: '', title: '' });
  }
  removeVideo(i: number): void {
    this.model.videos.splice(i, 1);
  }

  onAvatar(event: Event): void {
    this.avatarError.set(null);
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!LIMITS.imageAllowedTypes.includes(file.type as (typeof LIMITS.imageAllowedTypes)[number])) {
      this.avatarError.set('Image must be JPEG, PNG or WebP.');
      return;
    }
    if (file.size > LIMITS.imageMaxBytes) {
      this.avatarError.set('Image must be 5 MB or smaller.');
      return;
    }
    this.pendingAvatar = file;
    this.localAvatarPreview.set(URL.createObjectURL(file));
  }

  private videosForSave(): { video_id: string; title?: string }[] {
    const out: { video_id: string; title?: string }[] = [];
    for (const v of this.model.videos) {
      const id = parseYouTubeVideoId(v.url);
      if (!id) continue;
      const title = v.title.trim();
      out.push(title ? { video_id: id, title } : { video_id: id });
    }
    return out;
  }

  async save(): Promise<boolean> {
    this.saved.set(false);
    this.saveError.set(null);
    const errs = validateProfileDraft({
      channelName: this.model.channelName,
      youtubeUrl: this.model.youtubeUrl,
      bio: this.model.bio,
      niches: this.model.niches,
      languages: this.model.languages,
      country: this.model.country,
      formats: this.model.formats,
      videoUrls: this.model.videos.map((v) => v.url).filter(Boolean),
    });
    this.errors.set(errs);
    if (Object.keys(errs).length) return false;

    const uid = this.auth.user()?.id;
    if (!uid) {
      this.saveError.set('You are signed out.');
      return false;
    }

    this.busy.set(true);
    try {
      if (this.pendingAvatar) {
        const up = await this.creators.uploadAvatar(uid, this.pendingAvatar);
        if (up.error) {
          this.saveError.set(`Avatar upload failed: ${up.error}`);
          return false;
        }
        this.model.avatarPath = up.path ?? this.model.avatarPath;
        this.pendingAvatar = null;
        this.localAvatarPreview.set(null);
      }

      const res = await this.creators.saveDraft(uid, this.creator()?.id ?? null, {
        channelName: this.model.channelName.trim(),
        youtubeUrl: this.model.youtubeUrl.trim(),
        bio: this.model.bio.trim(),
        country: this.model.country || undefined,
        subscriberCount: this.model.subscriberCount,
        avatarPath: this.model.avatarPath,
        niches: this.model.niches,
        languages: this.model.languages,
        formats: this.model.formats,
        videos: this.videosForSave(),
      });
      if (res.error) {
        this.saveError.set(res.error);
        return false;
      }
      if (res.data) this.creator.set(res.data);
      this.saved.set(true);
      return true;
    } finally {
      this.busy.set(false);
    }
  }

  async submit(): Promise<void> {
    const ok = await this.save();
    if (!ok) return;
    const id = this.creator()?.id;
    if (!id) return;
    this.busy.set(true);
    const res = await this.creators.submitForReview(id);
    this.busy.set(false);
    if (res.error) {
      this.saveError.set(res.error);
      return;
    }
    const refreshed = await this.creators.getMyCreator();
    if (refreshed) this.hydrate(refreshed);
  }

  async unpublish(): Promise<void> {
    const id = this.creator()?.id;
    if (!id) return;
    this.busy.set(true);
    const res = await this.creators.unpublish(id);
    this.busy.set(false);
    if (res.error) {
      this.saveError.set(res.error);
      return;
    }
    const refreshed = await this.creators.getMyCreator();
    if (refreshed) this.hydrate(refreshed);
  }

  statusLabel(s: string): string {
    return CREATOR_STATUS_LABELS[s as keyof typeof CREATOR_STATUS_LABELS] ?? s;
  }
}
