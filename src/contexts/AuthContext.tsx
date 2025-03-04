import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/lib/supabase';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Carregar perfil do usuário quando a sessão mudar
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile(session.user.id);
      
      // Verificar se o usuário está autenticado no Supabase
      const checkSupabaseAuth = async () => {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          console.log("Usuário não autenticado no Supabase, aplicando fallback");
          // Implementar lógica de fallback se necessário
        }
      };
      
      checkSupabaseAuth();
    } else if (status !== 'loading') {
      setIsLoading(false);
      setProfile(null);
    }
  }, [session, status]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
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
  };

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  };

  const refreshSession = async () => {
    // Com NextAuth esta função não é mais necessária, mas mantemos
    // para compatibilidade com o código existente
    console.log("Session refresh requested");
    return Promise.resolve();
  };

  // Adaptar métodos antigos para usar o NextAuth
  const signInAdapter = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

  const signUpAdapter = async (email: string, password: string, username: string) => {
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
      
      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error };
    }
  };

  const signOutAdapter = async () => {
    await signOut({ callbackUrl: '/' });
    await supabase.auth.signOut();
  };
  
  const resetPasswordAdapter = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error as Error };
    }
  };
  
  const updatePasswordAdapter = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      return { error };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: error as Error };
    }
  };

  const value = {
    user: session?.user || null,
    profile,
    isLoading: status === 'loading' || isLoading,
    isAdmin: profile?.is_admin || false,
    signIn: signInAdapter,
    signUp: signUpAdapter,
    signOut: signOutAdapter,
    refreshProfile,
    resetPassword: resetPasswordAdapter,
    updatePassword: updatePasswordAdapter,
    refreshSession,
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