import { supabase } from '@/lib/supabase';
import { User } from '@/types/database.types';
import { Provider } from '@supabase/supabase-js';

export async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
    
  return user;
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUpWithEmail(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });
  
  if (data.user && !error) {
    // Create a record in the users table
    await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email,
      username,
      is_vip: false,
      created_at: new Date().toISOString(),
    });
  }
  
  return { data, error };
}

export async function signInWithDiscord() {
  return supabase.auth.signInWithOAuth({
    provider: 'discord' as Provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'identify email',
    },
  });
}

export async function signInWithSteam() {
  return supabase.auth.signInWithOAuth({
    // Using type assertion to bypass the Provider type check
    provider: 'steam' as Provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}