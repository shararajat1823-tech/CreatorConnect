import { Injectable, inject } from '@angular/core';
import type { MessageRow, RequestRow, RequestStatus } from '@creatorconnect/shared';
import { SupabaseService } from './supabase.service';

export interface CreateRequestInput {
  creatorId: string;
  requestType: 'paid_sponsorship' | 'creator_collaboration';
  senderName: string;
  title: string;
  message: string;
  deliverables?: string | null;
  timeline?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency?: string | null;
  budgetNegotiable?: boolean;
}

export interface RequestWithCreator extends RequestRow {
  creatorChannel?: string;
  creatorSlug?: string;
}

export interface Thread {
  request: RequestWithCreator | null;
  messages: MessageRow[];
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class RequestsService {
  private readonly supa = inject(SupabaseService);

  async createRequest(input: CreateRequestInput): Promise<{ id?: string; error?: string }> {
    const client = this.supa.client;
    if (!client) return { error: 'Backend not configured.' };
    const token =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const { data, error } = await client.rpc('create_request', {
      p_creator_id: input.creatorId,
      p_request_type: input.requestType,
      p_sender_name: input.senderName,
      p_title: input.title,
      p_message: input.message,
      p_deliverables: input.deliverables ?? null,
      p_timeline: input.timeline ?? null,
      p_budget_min: input.budgetMin ?? null,
      p_budget_max: input.budgetMax ?? null,
      p_currency: input.currency ?? null,
      p_budget_negotiable: input.budgetNegotiable ?? false,
      p_client_token: token,
    });
    if (error) return { error: error.message };
    return { id: data as string };
  }

  private async attachCreatorNames(rows: RequestRow[]): Promise<RequestWithCreator[]> {
    const client = this.supa.client;
    if (!client || rows.length === 0) return rows as RequestWithCreator[];
    const ids = [...new Set(rows.map((r) => r.creator_id))];
    const { data } = await client
      .from('public_creators')
      .select('creator_id, channel_name, slug')
      .in('creator_id', ids);
    const map = new Map((data ?? []).map((d) => [d.creator_id, d]));
    return rows.map((r) => ({
      ...r,
      creatorChannel: map.get(r.creator_id)?.channel_name,
      creatorSlug: map.get(r.creator_id)?.slug,
    }));
  }

  async listSent(userId: string): Promise<RequestWithCreator[]> {
    const client = this.supa.client;
    if (!client) return [];
    const { data } = await client
      .from('requests')
      .select('*')
      .eq('sender_id', userId)
      .order('updated_at', { ascending: false });
    return this.attachCreatorNames((data ?? []) as RequestRow[]);
  }

  async listReceived(userId: string): Promise<RequestWithCreator[]> {
    const client = this.supa.client;
    if (!client) return [];
    const { data } = await client
      .from('requests')
      .select('*')
      .eq('recipient_id', userId)
      .order('updated_at', { ascending: false });
    return this.attachCreatorNames((data ?? []) as RequestRow[]);
  }

  async getThread(requestId: string): Promise<Thread> {
    const client = this.supa.client;
    if (!client) return { request: null, messages: [], error: 'Backend not configured.' };
    const { data: reqData, error: reqErr } = await client
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();
    if (reqErr) return { request: null, messages: [], error: reqErr.message };
    if (!reqData) return { request: null, messages: [], error: 'not_found' };
    const [withNames] = await this.attachCreatorNames([reqData as RequestRow]);
    const { data: msgs } = await client
      .from('messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
    return { request: withNames, messages: (msgs ?? []) as MessageRow[] };
  }

  async postMessage(requestId: string, body: string): Promise<{ id?: string; error?: string }> {
    const client = this.supa.client;
    if (!client) return { error: 'Backend not configured.' };
    const { data, error } = await client.rpc('post_message', { p_request_id: requestId, p_body: body });
    if (error) return { error: error.message };
    return { id: data as string };
  }

  async setStatus(requestId: string, status: RequestStatus): Promise<{ error?: string }> {
    const client = this.supa.client;
    if (!client) return { error: 'Backend not configured.' };
    const { error } = await client.rpc('set_request_status', {
      p_request_id: requestId,
      p_status: status,
    });
    return { error: error?.message };
  }

  async reportCreator(
    creatorId: string,
    reason: string,
    details: string
  ): Promise<{ id?: string; error?: string }> {
    const client = this.supa.client;
    if (!client) return { error: 'Backend not configured.' };
    const { data, error } = await client.rpc('report_creator', {
      p_creator_id: creatorId,
      p_reason: reason,
      p_details: details,
    });
    if (error) return { error: error.message };
    return { id: data as string };
  }
}
