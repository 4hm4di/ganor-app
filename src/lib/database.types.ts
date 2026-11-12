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
      orders: {
        Row: {
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
        Row: { checked_in_at: string | null; created_at: string; event_id: string; id: string; order_id: string; price_kobo: number; ticket_type_id: string }
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
