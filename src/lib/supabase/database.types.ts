export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          email: string
          created_at: string
          updated_at: string
          discord_id: string | null
          discord_username: string | null
          discord_avatar: string | null
          discord_connected_at: string | null
          steam_id: string | null
          steam_username: string | null
          steam_avatar: string | null
          steam_connected_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          email: string
          created_at?: string
          updated_at?: string
          discord_id?: string | null
          discord_username?: string | null
          discord_avatar?: string | null
          discord_connected_at?: string | null
          steam_id?: string | null
          steam_username?: string | null
          steam_avatar?: string | null
          steam_connected_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          email?: string
          created_at?: string
          updated_at?: string
          discord_id?: string | null
          discord_username?: string | null
          discord_avatar?: string | null
          discord_connected_at?: string | null
          steam_id?: string | null
          steam_username?: string | null
          steam_avatar?: string | null
          steam_connected_at?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          plan_name: string
          transaction_id: string | null
          amount: number
          status: "active" | "canceled" | "expired"
          created_at: string
          expires_at: string
          canceled_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          plan_name: string
          transaction_id?: string | null
          amount: number
          status: "active" | "canceled" | "expired"
          created_at?: string
          expires_at: string
          canceled_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          plan_name?: string
          transaction_id?: string | null
          amount?: number
          status?: "active" | "canceled" | "expired"
          created_at?: string
          expires_at?: string
          canceled_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 