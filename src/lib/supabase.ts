// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Criar o cliente do Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Tipos para usuários e perfis
export type UserProfile = {
  id: string;
  email?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  is_admin: boolean;
  steam_id?: string;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: number;
  user_id: string;
  plan_id: number;
  status: 'active' | 'canceled' | 'pending' | 'expired';
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  mercadopago_customer_id?: string;
  mercadopago_subscription_id?: string;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPlan = {
  id: number;
  name: string;
  description?: string;
  price: number;
  interval: string;
  discord_role_id?: string;
  features: string[];
  created_at: string;
  updated_at: string;
};

export type DiscordConnection = {
  id: number;
  user_id: string;
  discord_user_id: string;
  discord_username?: string;
  discord_avatar?: string;
  discord_access_token?: string;
  discord_refresh_token?: string;
  discord_token_expires_at?: string;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: number;
  user_id: string;
  subscription_id?: number;
  amount: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_id?: string;
  payment_data?: any;
  created_at: string;
  updated_at: string;
};

// Funções auxiliares para autenticação
export async function signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        preferred_username: username
      }
    }
  });
  
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  return { data, error };
}

export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });
  
  return { data, error };
}

// Função para obter o perfil do usuário atual
export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { profile: null, error: new Error('Usuário não autenticado') };
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return { profile, error };
}

// Função para atualizar o perfil do usuário
export async function updateProfile(profile: Partial<UserProfile>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { data: null, error: new Error('Usuário não autenticado') };
  
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', user.id)
    .select()
    .single();
  
  return { data, error };
}

// Funções para integrações com Discord
export async function linkDiscordAccount(
  userId: string, 
  discordUserId: string, 
  discordUsername: string, 
  discordAvatar: string, 
  accessToken: string, 
  refreshToken: string, 
  expiresIn: number
) {
  const expiryDate = new Date();
  expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
  
  const { data, error } = await supabase
    .from('discord_connections')
    .upsert({
      user_id: userId,
      discord_user_id: discordUserId,
      discord_username: discordUsername,
      discord_avatar: discordAvatar,
      discord_access_token: accessToken,
      discord_refresh_token: refreshToken,
      discord_token_expires_at: expiryDate.toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, discord_user_id' })
    .select()
    .single();
  
  return { data, error };
}

export async function getDiscordConnection(userId: string) {
  const { data, error } = await supabase
    .from('discord_connections')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return { data, error };
}

// Funções para gerenciar assinaturas
export async function getSubscriptionPlans() {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true });
  
  return { data, error };
}

export async function getCurrentSubscription() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { subscription: null, error: new Error('Usuário não autenticado') };
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  return { subscription: data, error };
}

export async function createSubscription(planId: number) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { data: null, error: new Error('Usuário não autenticado') };
  
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan_id: planId,
      status: 'pending',
      auto_renew: true
    })
    .select()
    .single();
  
  return { data, error };
}

export async function updateSubscription(subscriptionId: number, updates: Partial<Subscription>) {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select()
    .single();
  
  return { data, error };
}

// Funções para gerenciar pagamentos
export async function createPayment(
  amount: number, 
  paymentMethod: string, 
  subscriptionId?: number, 
  paymentData?: any
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { data: null, error: new Error('Usuário não autenticado') };
  
  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      subscription_id: subscriptionId,
      amount,
      payment_method: paymentMethod,
      status: 'pending',
      payment_data: paymentData
    })
    .select()
    .single();
  
  return { data, error };
}

export async function updatePayment(paymentId: number, updates: Partial<Payment>) {
  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', paymentId)
    .select()
    .single();
  
  return { data, error };
}