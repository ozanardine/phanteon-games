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
          email: string
          first_name: string | null
          last_name: string | null
          discord_id: string | null
          discord_username: string | null
          steam_id: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          discord_id?: string | null
          discord_username?: string | null
          steam_id?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          discord_id?: string | null
          discord_username?: string | null
          steam_id?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid'
          current_period_start: string
          current_period_end: string
          cancel_at: string | null
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
          payment_provider: 'stripe' | 'mercadopago' | 'paypal'
          payment_provider_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid'
          current_period_start: string
          current_period_end: string
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          payment_provider: 'stripe' | 'mercadopago' | 'paypal'
          payment_provider_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid'
          current_period_start?: string
          current_period_end?: string
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          payment_provider?: 'stripe' | 'mercadopago' | 'paypal'
          payment_provider_id?: string
          created_at?: string
        }
      }
      discord_auth: {
        Row: {
          user_id: string
          discord_id: string
          discord_username: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          user_id: string
          discord_id: string
          discord_username: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          user_id?: string
          discord_id?: string
          discord_username?: string
          access_token?: string
          refresh_token?: string
          expires_at?: string
          created_at?: string
        }
      }
      steam_auth: {
        Row: {
          user_id: string
          steam_id: string
          steam_username: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          steam_id: string
          steam_username: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          steam_id?: string
          steam_username?: string
          avatar_url?: string | null
          created_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}