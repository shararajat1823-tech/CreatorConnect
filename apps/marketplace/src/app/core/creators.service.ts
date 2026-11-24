import { Injectable, inject } from '@angular/core';
import type {
  CreatorRow,
  ModerationActionRow,
  ProfileDraftInput,
  PublicCreatorRow,
} from '@creatorconnect/shared';
import { SupabaseService } from './supabase.service';

export interface DirectoryFilters {
  q?: string;
  niche?: string;
  language?: string;
  country?: string;
  range?: string; // subscriber_range id
  format?: string;
  page?: number;
}

export interface DirectoryResult {
  rows: PublicCreatorRow[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
}

export const DIRECTORY_PAGE_SIZE = 12;

@Injectable({ providedIn: 'root' })
export class CreatorsService {
  private readonly supa = inject(SupabaseService);

  async searchDirectory(filters: DirectoryFilters): Promise<DirectoryResult> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = DIRECTORY_PAGE_SIZE;
    const empty: DirectoryResult = { rows: [], total: 0, page, pageSize };
    const client = this.supa.client;
    if (!client) return { ...empty, error: 'not_configured' };

    try {
      let query = client
        .from('public_creators')
        .select('*', { count: 'exact' })
        .order('subscriber_count', { ascending: false, nullsFirst: false })
        .order('published_at', { ascending: false });

      const q = filters.q?.trim();
      if (q) {
        const safe = q.replace(/[%,()]/g, ' ');
        query = query.or(`channel_name.ilike.%${safe}%,youtube_url.ilike.%${safe}%`);
      }
      if (filters.niche) query = query.contains('niches', [filters.niche]);
      if (filters.language) query = query.contains('languages', [filters.language]);
      if (filters.country) query = query.eq('country', filters.country);
      if (filters.range) query = query.eq('subscriber_range', filters.range);
      if (filters.format) query = query.contains('formats', [filters.format]);

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, count, error } = await query;
      if (error) return { ...empty, error: error.message };
      return { rows: (data ?? []) as PublicCreatorRow[], total: count ?? 0, page, pageSize };
    } catch (e) {
      return { ...empty, error: (e as Error).message };
    }
  }

  async getPublicBySlug(slug: string): Promise<PublicCreatorRow | null> {
    const client = this.supa.client;
    if (!client) return null;
    try {
      const { data } = await client
        .from('public_creators')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      return (data as PublicCreatorRow) ?? null;
    } catch {
      return null;
    }
  }

  /** The signed-in user's own creator record (owner view; may be any status). */
  async getMyCreator(): Promise<CreatorRow | null> {
    const client = this.supa.client;
    if (!client) return null;
    const { data } = await client.from('creators').select('*').maybeSingle();
    return (data as CreatorRow) ?? null;
  }

  async getMyModerationHistory(creatorId: string): Promise<ModerationActionRow[]> {
    const client = this.supa.client;
    if (!client) return [];
    const { data } = await client
      .from('moderation_actions')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });
    return (data ?? []) as ModerationActionRow[];
  }

  /** Create or update the owner's draft. Returns the saved row or an error. */
  async saveDraft(
    ownerId: string,
    existingId: string | null,
    input: ProfileDraftInput & {
      channelName: string;
      youtubeUrl: string;
      bio?: string;
      country?: string;
      subscriberCount?: number | null;
      avatarPath?: string | null;
      videos?: { video_id: string; title?: string }[];
      pricing?: unknown[] | null;
    }
  ): Promise<{ data?: CreatorRow; error?: string }> {
    const client = this.supa.client;
    if (!client) return { error: 'Backend not configured.' };

    const payload = {
      owner_id: ownerId,
      channel_name: input.channelName,
      youtube_url: input.youtubeUrl,
      bio: input.bio ?? null,
      niches: input.niches ?? [],
      languages: input.languages ?? [],
      country: input.country ?? null,
      subscriber_count: input.subscriberCount ?? null,
      avatar_path: input.avatarPath ?? null,
      formats: (input.formats ?? []) as CreatorRow['formats'],
      videos: input.videos ?? [],
      pricing: (input.pricing ?? null) as CreatorRow['pricing'],
    };

    const builder = existingId
      ? client.from('creators').update(payload).eq('id', existingId)
      : client.from('creators').insert(payload);

    const { data, error } = await builder.select('*').single();
    if (error) return { error: error.message };
    return { data: data as CreatorRow };
  }

  async uploadAvatar(userId: string, file: File): Promise<{ path?: string; error?: string }> {
    const client = this.supa.client;
    if (!client) return { error: 'Backend not configured.' };
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await client.storage
      .from('creator-avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) return { error: error.message };
    return { path };
  }

  async submitForReview(creatorId: string): Promise<{ status?: string; error?: string }> {
    const client = this.supa.client;
    if (!client) return { error: 'Backend not configured.' };
    const { data, error } = await client.rpc('submit_creator_for_review', { p_creator_id: creatorId });
    if (error) return { error: error.message };
    return { status: data as string };
  }

  async unpublish(creatorId: string): Promise<{ status?: string; error?: string }> {
    const client = this.supa.client;
    if (!client) return { error: 'Backend not configured.' };
    const { data, error } = await client.rpc('unpublish_creator', { p_creator_id: creatorId });
    if (error) return { error: error.message };
    return { status: data as string };
  }
}
