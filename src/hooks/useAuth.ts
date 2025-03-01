// src/hooks/useAuth.ts
import { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../pages/_app';
import { supabase } from '../lib/supabase/client';
import { UseAuthReturn, UserProfile } from '../types/auth';

export const useAuth = (): UseAuthReturn => {
  const { user, loading, setUser } = useContext(AuthContext);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Verificar se o usuário tem assinatura ativa
  const hasActiveSubscription = !!user?.subscription && 
    user.subscription.status === 'active' && 
    new Date(user.subscription.currentPeriodEnd) > new Date();

  // Verificar se o usuário é admin (exemplo simples)
  // Fix: Garantindo que isAdmin sempre retorne um booleano
  const isAdmin = !!(user?.email && (
    user.email.endsWith('@phanteongames.com') || 
    (process.env.NEXT_PUBLIC_ADMIN_EMAILS && process.env.NEXT_PUBLIC_ADMIN_EMAILS.includes(user.email))
  ));
  
  // Login com Discord
  const signInWithDiscord = useCallback(async () => {
    try {
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/discord-callback`,
          scopes: 'identify email guilds.join'
        }
      });
      
      if (error) throw error;
      
      // Redirecionar para URL de autorização do Discord
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Erro no login com Discord:', err);
      setError(err instanceof Error ? err.message : 'Erro ao realizar login com Discord');
    }
  }, []);

  // Login com email e senha
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Buscar perfil completo
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, subscriptions(*)')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
        }
        
        if (profileData) {
          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || '',
            firstName: profileData.first_name,
            lastName: profileData.last_name,
            avatarUrl: profileData.avatar_url,
            discordId: profileData.discord_id,
            discordUsername: profileData.discord_username,
            steamId: profileData.steam_id,
            createdAt: new Date(profileData.created_at),
            subscription: profileData.subscriptions ? {
              tier: 'vip', // Simplificado para apenas "vip"
              status: profileData.subscriptions.status,
              currentPeriodEnd: new Date(profileData.subscriptions.current_period_end),
              cancelAtPeriodEnd: !!profileData.subscriptions.cancel_at,
            } : undefined,
          };
          
          setUser(userProfile);
        }
      }
      
      router.push('/perfil');
    } catch (err) {
      console.error('Erro no login com email:', err);
      setError(err instanceof Error ? err.message : 'Credenciais inválidas');
    }
  }, [router, setUser]);

  // Registro com email e senha
  const signUpWithEmail = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Criar perfil
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          created_at: new Date().toISOString()
        });
        
        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
        }
        
        const userProfile: UserProfile = {
          id: data.user.id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          createdAt: new Date()
        };
        
        setUser(userProfile);
      }
      
      router.push('/perfil');
    } catch (err) {
      console.error('Erro no registro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    }
  }, [router, setUser]);

  // Logout
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      router.push('/');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer logout');
    }
  }, [router, setUser]);

  // Atualizar sessão
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      return !!data.session;
    } catch (err) {
      console.error('Erro ao atualizar sessão:', err);
      return false;
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin,
    hasActiveSubscription,
    signIn: signInWithDiscord, // Alias para o método principal de login
    signInWithDiscord,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshSession
  };
};

export default useAuth;