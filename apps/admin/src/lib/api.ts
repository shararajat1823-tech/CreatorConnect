import type {
  CreatorRow,
  CreatorStatus,
  ModerationActionRow,
  ReportRow,
  ReportStatus,
} from '@creatorconnect/shared';
import { supabase } from './supabase';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  return supabase;
}

export async function checkIsAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return Boolean(data);
}

export async function listCreatorsByStatus(statuses: CreatorStatus[]): Promise<CreatorRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('creators')
    .select('*')
    .in('status', statuses)
    .order('submitted_at', { ascending: true, nullsFirst: false })
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CreatorRow[];
}

export async function getCreator(id: string): Promise<CreatorRow | null> {
  const client = requireClient();
  const { data, error } = await client.from('creators').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as CreatorRow) ?? null;
}

export async function getModerationHistory(creatorId: string): Promise<ModerationActionRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('moderation_actions')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ModerationActionRow[];
}

export async function approveCreator(id: string): Promise<void> {
  const { error } = await requireClient().rpc('approve_creator', { p_creator_id: id });
  if (error) throw new Error(error.message);
}

export async function requestChanges(id: string, reason: string): Promise<void> {
  const { error } = await requireClient().rpc('request_creator_changes', {
    p_creator_id: id,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
}

export async function suspendCreator(id: string, reason: string): Promise<void> {
  const { error } = await requireClient().rpc('suspend_creator', {
    p_creator_id: id,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
}

export async function reinstateCreator(id: string): Promise<void> {
  const { error } = await requireClient().rpc('reinstate_creator', { p_creator_id: id });
  if (error) throw new Error(error.message);
}

export interface ReportWithCreator extends ReportRow {
  channelName?: string;
  creatorStatus?: string;
}

export async function listReports(statuses: ReportStatus[]): Promise<ReportWithCreator[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('reports')
    .select('*')
    .in('status', statuses)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  const reports = (data ?? []) as ReportRow[];
  if (reports.length === 0) return [];

  const ids = [...new Set(reports.map((r) => r.creator_id))];
  const { data: creators } = await client
    .from('creators')
    .select('id, channel_name, status')
    .in('id', ids);
  const map = new Map((creators ?? []).map((c) => [c.id, c]));
  return reports.map((r) => ({
    ...r,
    channelName: map.get(r.creator_id)?.channel_name,
    creatorStatus: map.get(r.creator_id)?.status,
  }));
}

export async function resolveReport(id: string, status: ReportStatus): Promise<void> {
  const { error } = await requireClient().rpc('resolve_report', {
    p_report_id: id,
    p_status: status,
  });
  if (error) throw new Error(error.message);
}
