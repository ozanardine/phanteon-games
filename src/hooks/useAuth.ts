// src/hooks/useAuth.ts
import { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/client';
import { getDiscordAuthUrl } from '../lib/discord/discordAuth';
import { getSteamAuthUrl } from '../lib/steam/steamAuth';
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
  const isAdmin = !!(user?.email && (
    user.email.endsWith('@phanteongames.com') || 
    (process.env.NEXT_PUBLIC_ADMIN_EMAILS && process.env.NEXT_PUBLIC_ADMIN_EMAILS.includes(user.email))
  ));
  
  // Login com Discord
  const signInWithDiscord = useCallback(async () => {
    try {
      setError(null);
      
      // Redirecionar para URL de autorização do Discord
      window.location.href = getDiscordAuthUrl();
    } catch (err) {
      console.error('Error in Discord login:', err);
      setError(err instanceof Error ? err.message : 'Error during Discord login');
    }
  }, []);

  // Login com Steam
  const signInWithSteam = useCallback(async () => {
    try {
      setError(null);
      
      // Redirecionar para URL de autorização do Steam
      window.location.href = getSteamAuthUrl();
    } catch (err) {
      console.error('Error in Steam login:', err);
      setError(err instanceof Error ? err.message : 'Error during Steam login');
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
          console.error('Error fetching profile:', profileError);
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
              id: profileData.subscriptions.id,
              tier: 'vip',
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
      console.error('Error in email login:', err);
      setError(err instanceof Error ? err.message : 'Invalid credentials');
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
          console.error('Error creating profile:', profileError);
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
      console.error('Error in registration:', err);
      setError(err instanceof Error ? err.message : 'Error creating account');
    }
  }, [router, setUser]);

  // Enviar email de redefinição de senha
  const sendPasswordResetEmail = useCallback(async (email: string) => {
    try {
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error('Error sending password reset email:', err);
      setError(err instanceof Error ? err.message : 'Error sending password reset email');
      return false;
    }
  }, []);

  // Redefinir senha
  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      setError(null);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err instanceof Error ? err.message : 'Error resetting password');
      return false;
    }
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      router.push('/');
    } catch (err) {
      console.error('Error during logout:', err);
      setError(err instanceof Error ? err.message : 'Error during logout');
    }
  }, [router, setUser]);

  // Atualizar sessão
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      return !!data.session;
    } catch (err) {
      console.error('Error refreshing session:', err);
      return false;
    }
  }, []);

  // Limpar mensagem de erro após algum tempo
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [error]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin,
    hasActiveSubscription,
    signIn: signInWithDiscord, // Alias para o método principal de login
    signInWithDiscord,
    signInWithSteam,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordResetEmail,
    resetPassword,
    signOut,
    refreshSession
  };
};

export default useAuth;