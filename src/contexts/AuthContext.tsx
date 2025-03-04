import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/lib/supabase';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string, redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
  connectDiscord: (redirectUrl?: string) => Promise<void>;
  checkDiscordConnection: () => Promise<{ connected: boolean; username?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar perfil do usuário quando a sessão mudar
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    } else if (status !== 'loading') {
      setIsLoading(false);
      setProfile(null);
    }
  }, [session, status]);

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const refreshSession = async () => {
    // Esta função agora usa Next-Auth para atualizar a sessão
    // No futuro, podemos implementar uma renovação JWT se necessário
    console.log("Session refresh requested");
    return Promise.resolve();
  };

  // Login usando NextAuth (que por sua vez usa Supabase)
  const handleSignIn = async (email: string, password: string, redirectTo?: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        return { 
          success: false, 
          error: result.error === 'CredentialsSignin' 
            ? 'Email ou senha incorretos' 
            : result.error
        };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao fazer login' 
      };
    }
  };

  // Registrar usando Supabase e depois fazer login
  const handleSignUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          }
        }
      });
      
      if (error) {
        return { 
          success: false, 
          error: error.message 
        };
      }
      
      if (data.user) {
        // No caso de sign-up, vamos direcionar para login após confirmação
        // em vez de login automático para respeitar o fluxo de email verification
        return { success: true };
      }
      
      return { 
        success: false, 
        error: 'Falha no registro. Tente novamente.' 
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { 
        success: false, 
        error: error.message || 'Erro no registro' 
      };
    }
  };

  // Logout via NextAuth (que por sua vez faz Supabase logout)
  const handleSignOut = async () => {
    try {
      // Também fazer logout do Supabase para garantir que todas as sessões são encerradas
      await supabase.auth.signOut();
      
      // Fazer logout do NextAuth, com redirecionamento para home
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  
  // Solicitar reset de senha
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        return { 
          success: false, 
          error: error.message 
        };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao solicitar redefinição de senha' 
      };
    }
  };
  
  // Atualizar senha
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) {
        return { 
          success: false, 
          error: error.message 
        };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Update password error:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao atualizar senha' 
      };
    }
  };
  
  // Iniciar fluxo de autenticação com Discord
  const connectDiscord = async (redirectUrl?: string) => {
    try {
      // Usar o NextAuth para iniciar a autenticação Discord
      await signIn('discord', {
        callbackUrl: redirectUrl || window.location.href
      });
    } catch (error) {
      console.error('Discord connection error:', error);
    }
  };
  
  // Verificar conexão com Discord
  const checkDiscordConnection = async () => {
    try {
      if (!session?.user?.id) {
        return { connected: false };
      }
      
      const { data, error } = await supabase
        .from('discord_connections')
        .select('discord_username, discord_avatar')
        .eq('user_id', session.user.id)
        .single();
      
      if (error || !data) {
        return { connected: false };
      }
      
      return { 
        connected: true, 
        username: data.discord_username
      };
    } catch (error) {
      console.error('Error checking Discord connection:', error);
      return { connected: false };
    }
  };

  const value = {
    user: session?.user || null,
    profile,
    isLoading: status === 'loading' || isLoading,
    isAdmin: profile?.is_admin || false,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    refreshProfile,
    resetPassword,
    updatePassword,
    refreshSession,
    connectDiscord,
    checkDiscordConnection
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};