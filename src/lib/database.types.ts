// Generated from the Supabase schema (project "ganor"). Regenerate after migrations.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" }
  public: {
    Tables: {
      events: {
        Row: {
          category: string
          city: string
          cover_url: string | null
          created_at: string
          description: string
          ends_at: string | null
          fee_mode: string
          halal_friendly: boolean
          host_id: string
          id: string
          published_at: string | null
          event_kind: string
          rsvp_plan: string
          plan_paid_at: string | null
          rsvp_fields: Json
          slug: string
          starts_at: string
          status: string
          title: string
          updated_at: string
          venue_address: string
          venue_name: string
        }
        Insert: {
          category: string
          city: string
          cover_url?: string | null
          created_at?: string
          description?: string
          ends_at?: string | null
          fee_mode?: string
          halal_friendly?: boolean
          host_id: string
          id?: string
          published_at?: string | null
          event_kind?: string
          rsvp_plan?: string
          plan_paid_at?: string | null
          rsvp_fields?: Json
          slug: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
          venue_address?: string
          venue_name: string
        }
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      host_contacts: {
        Row: { host_id: string; phone: string | null; updated_at: string }
        Insert: { host_id: string; phone?: string | null; updated_at?: string }
        Update: { host_id?: string; phone?: string | null; updated_at?: string }
        Relationships: [
          {
            foreignKeyName: "host_contacts_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string
          contact_email: string | null
          contact_whatsapp: string | null
          created_at: string
          display_name: string
          id: string
          instagram: string | null
          logo_url: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          bio?: string
          contact_email?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          display_name?: string
          id: string
          instagram?: string | null
          logo_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      payout_accounts: {
        Row: { host_id: string; account_type: string; business_name: string; bank_code: string; bank_name: string; account_number: string; account_name: string; settlement_email: string | null; settlement_phone: string | null; status: string; status_note: string | null; paystack_subaccount_code: string | null; verified_at: string | null; created_at: string; updated_at: string }
        Insert: { host_id: string; account_type?: string; business_name: string; bank_code: string; bank_name: string; account_number: string; account_name: string; settlement_email?: string | null; settlement_phone?: string | null }
        Update: { account_type?: string; business_name?: string; bank_code?: string; bank_name?: string; account_number?: string; account_name?: string; settlement_email?: string | null; settlement_phone?: string | null }
        Relationships: []
      }
      orders: {
        Row: {
          answers: Json
          buyer_email: string | null
          buyer_name: string
          buyer_phone: string
          consent_version: string | null
          created_at: string
          event_id: string
          id: string
          paid_at: string | null
          paystack_reference: string | null
          rating_consent: boolean
          refunded_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_kobo: number
          user_id: string | null
        }
        Insert: {
          answers?: Json
          buyer_email?: string | null
          buyer_name: string
          buyer_phone: string
          consent_version?: string | null
          event_id: string
          paid_at?: string | null
          paystack_reference?: string | null
          rating_consent?: boolean
          status?: Database["public"]["Enums"]["order_status"]
          total_kobo?: number
          user_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>
        Relationships: [
          { foreignKeyName: "orders_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] },
        ]
      }
      tickets: {
        Row: { checked_in_at: string | null; checked_in_by: string | null; code: string; created_at: string; event_id: string; id: string; order_id: string; price_kobo: number; ticket_type_id: string }
        Insert: { checked_in_at?: string | null; event_id: string; order_id: string; price_kobo?: number; ticket_type_id: string }
        Update: Partial<Database["public"]["Tables"]["tickets"]["Insert"]>
        Relationships: [
          { foreignKeyName: "tickets_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] },
          { foreignKeyName: "tickets_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "tickets_ticket_type_id_fkey"; columns: ["ticket_type_id"]; isOneToOne: false; referencedRelation: "ticket_types"; referencedColumns: ["id"] },
        ]
      }
      review_invites: {
        Row: { attended: boolean; buyer_key: string; created_at: string; event_id: string; expires_at: string; host_id: string; id: string; order_id: string; revoked_at: string | null; sent_at: string | null; token_hash: string }
        Insert: { attended: boolean; buyer_key: string; event_id: string; expires_at: string; host_id: string; order_id: string; token_hash: string }
        Update: Partial<Database["public"]["Tables"]["review_invites"]["Insert"]>
        Relationships: [
          { foreignKeyName: "review_invites_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] },
          { foreignKeyName: "review_invites_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
        ]
      }
      event_reviews: {
        Row: {
          attendance: "scanned" | "self_declared"
          comment: string
          counts_in_score: boolean
          created_at: string
          display_name: string
          event_id: string
          host_id: string
          id: string
          publish_at: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
        }
        Insert: never
        Update: never
        Relationships: [
          { foreignKeyName: "event_reviews_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] },
        ]
      }
      review_reports: {
        Row: { created_at: string; id: string; reason: string; resolved_at: string | null; review_id: string }
        Insert: { reason: string; review_id: string }
        Update: { resolved_at?: string | null }
        Relationships: [
          { foreignKeyName: "review_reports_review_id_fkey"; columns: ["review_id"]; isOneToOne: false; referencedRelation: "event_reviews"; referencedColumns: ["id"] },
        ]
      }
      host_staff: {
        Row: { active: boolean; created_at: string; display_name: string; host_id: string; id: string; last_login_at: string | null; locked_until: string | null; updated_at: string; username: string }
        Insert: never
        Update: never
        Relationships: []
      }
      host_staff_events: {
        Row: { event_id: string; staff_id: string }
        Insert: never
        Update: never
        Relationships: [
          { foreignKeyName: "host_staff_events_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] },
          { foreignKeyName: "host_staff_events_staff_id_fkey"; columns: ["staff_id"]; isOneToOne: false; referencedRelation: "host_staff"; referencedColumns: ["id"] },
        ]
      }
      ticket_types: {
        Row: {
          created_at: string
          description: string
          event_id: string
          id: string
          max_per_order: number
          name: string
          on_sale: boolean
          price_kobo: number
          quantity: number
          sold: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          event_id: string
          id?: string
          max_per_order?: number
          name: string
          on_sale?: boolean
          price_kobo?: number
          quantity: number
          sold?: number
          sort_order?: number
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["ticket_types"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      host_review_summary: {
        Row: { host_id: string; counted: number; average: number; r1: number; r2: number; r3: number; r4: number; r5: number; shown: number }
        Relationships: []
      }
    }
    Functions: {
      admin_create_rating_invites: {
        Args: { p_event: string }
        Returns: { attended: boolean; buyer_name: string; buyer_phone: string; expires_at: string; invite_id: string; order_id: string; token: string }[]
      }
      admin_reissue_rating_invite: {
        Args: { p_invite: string }
        Returns: { buyer_name: string; buyer_phone: string; expires_at: string; invite_id: string; token: string }[]
      }
      admin_set_review_status: {
        Args: { p_note?: string; p_review: string; p_status: Database["public"]["Enums"]["review_status"] }
        Returns: undefined
      }
      admin_suppress_phone: { Args: { p_phone: string; p_scope?: string }; Returns: number }
      is_staff: { Args: Record<string, never>; Returns: boolean }
      host_create_staff: { Args: { p_username: string; p_display_name: string; p_password: string; p_event_ids?: string[] }; Returns: string }
      host_update_staff: { Args: { p_staff: string; p_display_name: string; p_active: boolean; p_event_ids: string[] }; Returns: undefined }
      host_set_staff_password: { Args: { p_staff: string; p_password: string }; Returns: undefined }
      host_delete_staff: { Args: { p_staff: string }; Returns: undefined }
      staff_login: { Args: { p_username: string; p_password: string }; Returns: Json }
      staff_logout: { Args: { p_token: string }; Returns: undefined }
      staff_session: { Args: { p_token: string }; Returns: Json }
      check_in_ticket: { Args: { p_event: string; p_code: string; p_staff_token?: string }; Returns: Json }
      admin_overview: { Args: Record<string, never>; Returns: Json }
      host_stats: { Args: { p_days?: number }; Returns: Json }
      admin_daily: { Args: { p_days?: number }; Returns: { day: string; hosts: number; events: number; tickets: number; checkins: number }[] }
      admin_hosts: {
        Args: Record<string, never>
        Returns: { id: string; display_name: string; email: string | null; joined_at: string; last_sign_in_at: string | null; events: number; published: number; tickets_sold: number; gate_accounts: number; suspended: boolean; suspend_reason: string | null; is_staff: boolean }[]
      }
      admin_set_suspension: { Args: { p_host: string; p_suspend: boolean; p_reason?: string }; Returns: undefined }
      admin_set_event_status: { Args: { p_event: string; p_status: string; p_note?: string }; Returns: undefined }
      admin_set_staff_role: { Args: { p_email: string; p_grant: boolean; p_role?: string }; Returns: undefined }
      hq_me: { Args: Record<string, never>; Returns: Json }
      hq_members: { Args: Record<string, never>; Returns: { user_id: string; display_name: string | null; username: string | null; email: string | null; role: string; active: boolean; created_at: string; last_sign_in_at: string | null; is_self: boolean; login_kind: string }[] }
      hq_create_member: { Args: { p_username: string; p_display_name: string; p_role: string; p_password: string }; Returns: string }
      hq_update_member: { Args: { p_user: string; p_role: string; p_active: boolean }; Returns: undefined }
      hq_set_member_password: { Args: { p_user: string; p_password: string }; Returns: undefined }
      hq_remove_member: { Args: { p_user: string }; Returns: undefined }
      admin_payouts: { Args: Record<string, never>; Returns: { host_id: string; host_name: string; account_type: string | null; business_name: string | null; bank_name: string | null; account_number: string | null; account_name: string | null; settlement_email: string | null; settlement_phone: string | null; status: string; status_note: string | null; updated_at: string | null; paid_events: number; gross_kobo: number; tickets_sold: number }[] }
      admin_set_payout_status: { Args: { p_host: string; p_status: string; p_note?: string }; Returns: undefined }
      admin_rsvp_plans: { Args: Record<string, never>; Returns: { event_id: string; title: string; host_name: string; plan: string; paid_at: string | null; starts_at: string; status: string; created_at: string }[] }
      admin_set_plan_paid: { Args: { p_event: string; p_paid: boolean }; Returns: undefined }
      admin_delete_host: { Args: { p_host: string }; Returns: undefined }
      admin_watchlist: { Args: Record<string, never>; Returns: { kind: string; severity: string; title: string; detail: string; event_id: string | null; host_id: string | null; at: string }[] }
      rsvp_submit: { Args: { p_event: string; p_ticket_type: string; p_name: string; p_phone: string; p_email: string; p_answers: Json; p_consent?: boolean }; Returns: Json }
      admin_recent_actions: {
        Args: { p_limit?: number }
        Returns: { created_at: string; actor_name: string; action: string; target_type: string; target_id: string | null; note: string | null }[]
      }
      my_suspension: { Args: Record<string, never>; Returns: Json }
      rating_invite: { Args: { p_token: string }; Returns: Json }
      submit_event_review: {
        Args: { p_attended: boolean; p_comment: string; p_display: string; p_rating: number; p_token: string }
        Returns: Json
      }
    }
    Enums: {
      order_status: "pending" | "paid" | "refunded" | "cancelled"
      review_status: "published" | "hidden" | "disputed" | "removed"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicTables = Database["public"]["Tables"]
export type EventRow = PublicTables["events"]["Row"]
export type TicketTypeRow = PublicTables["ticket_types"]["Row"]
export type ProfileRow = PublicTables["profiles"]["Row"]
export type ReviewRow = PublicTables["event_reviews"]["Row"]
export type ReviewSummary = Database["public"]["Views"]["host_review_summary"]["Row"]
