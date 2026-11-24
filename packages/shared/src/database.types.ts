/**
 * Database types for the CreatorConnect Supabase schema.
 *
 * Hand-maintained to match supabase/migrations. After changing the schema you
 * can regenerate a stricter version with:
 *   supabase gen types typescript --local > packages/shared/src/database.types.ts
 * (keep the hand-written convenience aliases at the bottom of this file).
 */
import type {
  CollabFormat,
  CreatorStatus,
  ModerationAction,
  RequestStatus,
  RequestType,
  ReportReason,
  ReportStatus,
} from './domain.js';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** A selected video shown on a creator profile. */
export interface CreatorVideo {
  video_id: string;
  title?: string;
}

/** Optional indicative pricing entry. */
export interface PricingItem {
  format: CollabFormat;
  price_min?: number | null;
  price_max?: number | null;
  currency?: string;
  note?: string;
}

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          deletion_requested_at: string | null;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          deletion_requested_at?: string | null;
        };
        Update: {
          display_name?: string | null;
          deletion_requested_at?: string | null;
        };
        Relationships: [];
      };
      admins: {
        Row: { user_id: string; created_at: string; created_by: string | null };
        Insert: { user_id: string; created_at?: string; created_by?: string | null };
        Update: { created_by?: string | null };
        Relationships: [];
      };
      creators: {
        Row: {
          id: string;
          owner_id: string;
          slug: string;
          status: CreatorStatus;
          channel_name: string;
          youtube_url: string;
          youtube_ref: string | null;
          avatar_path: string | null;
          bio: string | null;
          niches: string[];
          languages: string[];
          country: string | null;
          subscriber_count: number | null;
          subscriber_range: string | null;
          subscribers_self_reported: boolean;
          formats: CollabFormat[];
          videos: CreatorVideo[];
          pricing: PricingItem[] | null;
          ownership_verified: boolean;
          review_note: string | null;
          created_at: string;
          updated_at: string;
          submitted_at: string | null;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          slug?: string;
          status?: CreatorStatus;
          channel_name: string;
          youtube_url: string;
          youtube_ref?: string | null;
          avatar_path?: string | null;
          bio?: string | null;
          niches?: string[];
          languages?: string[];
          country?: string | null;
          subscriber_count?: number | null;
          subscriber_range?: string | null;
          subscribers_self_reported?: boolean;
          formats?: CollabFormat[];
          videos?: CreatorVideo[];
          pricing?: PricingItem[] | null;
        };
        Update: Partial<Database['public']['Tables']['creators']['Insert']>;
        Relationships: [];
      };
      public_creators: {
        Row: {
          id: string;
          creator_id: string;
          slug: string;
          channel_name: string;
          youtube_url: string;
          avatar_path: string | null;
          bio: string | null;
          niches: string[];
          languages: string[];
          country: string | null;
          subscriber_count: number | null;
          subscriber_range: string | null;
          subscribers_self_reported: boolean;
          formats: CollabFormat[];
          videos: CreatorVideo[];
          pricing: PricingItem[] | null;
          ownership_verified: boolean;
          published_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      requests: {
        Row: {
          id: string;
          creator_id: string;
          sender_id: string;
          recipient_id: string;
          request_type: RequestType;
          status: RequestStatus;
          sender_name: string;
          title: string;
          deliverables: string | null;
          timeline: string | null;
          budget_min: number | null;
          budget_max: number | null;
          currency: string | null;
          budget_negotiable: boolean;
          client_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          sender_id?: string;
          request_type: RequestType;
          sender_name: string;
          title: string;
          deliverables?: string | null;
          timeline?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          currency?: string | null;
          budget_negotiable?: boolean;
          message: string;
        };
        Update: { status?: RequestStatus };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          request_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: { id?: string; request_id: string; sender_id?: string; body: string };
        Update: never;
        Relationships: [];
      };
      moderation_actions: {
        Row: {
          id: string;
          creator_id: string;
          actor_id: string;
          action: ModerationAction;
          reason: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          creator_id: string;
          reporter_id: string | null;
          reason: ReportReason;
          details: string | null;
          status: ReportStatus;
          created_at: string;
          resolved_by: string | null;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          reason: ReportReason;
          details?: string | null;
        };
        Update: { status?: ReportStatus };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      submit_creator_for_review: { Args: { p_creator_id: string }; Returns: string };
      unpublish_creator: { Args: { p_creator_id: string }; Returns: string };
      approve_creator: { Args: { p_creator_id: string }; Returns: string };
      request_creator_changes: {
        Args: { p_creator_id: string; p_reason: string };
        Returns: string;
      };
      suspend_creator: { Args: { p_creator_id: string; p_reason: string }; Returns: string };
      reinstate_creator: { Args: { p_creator_id: string }; Returns: string };
      create_request: {
        Args: {
          p_creator_id: string;
          p_request_type: string;
          p_sender_name: string;
          p_title: string;
          p_message: string;
          p_deliverables: string | null;
          p_timeline: string | null;
          p_budget_min: number | null;
          p_budget_max: number | null;
          p_currency: string | null;
          p_budget_negotiable: boolean;
          p_client_token: string;
        };
        Returns: string;
      };
      set_request_status: {
        Args: { p_request_id: string; p_status: string };
        Returns: string;
      };
      post_message: {
        Args: { p_request_id: string; p_body: string };
        Returns: string;
      };
      report_creator: {
        Args: { p_creator_id: string; p_reason: string; p_details: string | null };
        Returns: string;
      };
      resolve_report: {
        Args: { p_report_id: string; p_status: string };
        Returns: string;
      };
      request_account_deletion: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

/* ----------------------------- Convenience aliases ------------------------ */
export type MemberRow = Database['public']['Tables']['members']['Row'];
export type CreatorRow = Database['public']['Tables']['creators']['Row'];
export type PublicCreatorRow = Database['public']['Tables']['public_creators']['Row'];
export type RequestRow = Database['public']['Tables']['requests']['Row'];
export type MessageRow = Database['public']['Tables']['messages']['Row'];
export type ModerationActionRow = Database['public']['Tables']['moderation_actions']['Row'];
export type ReportRow = Database['public']['Tables']['reports']['Row'];
