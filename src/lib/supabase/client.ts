import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and/or anonymous key not defined in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for Supabase tables
export type ProfilesRow = {
  id: string;
  created_at: string;
  email: string;
  discord_id?: string;
  discord_username?: string;
  steam_id?: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
};

export type SubscriptionsRow = {
  id: string;
  user_id: string;
  created_at: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at?: string;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  payment_provider: 'stripe' | 'mercadopago' | 'paypal';
  payment_provider_id: string;
};

export type VipPlansRow = {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_quarterly: number;
  price_semiannual: number;
  price_annual: number;
  features: Record<string, unknown>;
  is_active: boolean;
};

export type PaymentHistoryRow = {
  id: string;
  user_id: string;
  subscription_id: string;
  created_at: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  payment_provider: 'stripe' | 'mercadopago' | 'paypal';
  payment_method: string;
  invoice_url?: string;
  receipt_url?: string;
};

export type DiscordAuthRow = {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
};