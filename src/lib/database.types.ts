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
        Row: { created_at: string; display_name: string; id: string; updated_at: string }
        Insert: { created_at?: string; display_name?: string; id: string; updated_at?: string }
        Update: { created_at?: string; display_name?: string; id?: string; updated_at?: string }
        Relationships: []
      }
      ticket_types: {
        Row: {
          created_at: string
          description: string
          event_id: string
          id: string
          max_per_order: number
          name: string
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
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicTables = Database["public"]["Tables"]
export type EventRow = PublicTables["events"]["Row"]
export type TicketTypeRow = PublicTables["ticket_types"]["Row"]
export type ProfileRow = PublicTables["profiles"]["Row"]
