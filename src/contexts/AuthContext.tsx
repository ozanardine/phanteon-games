// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export type UserProfile = {
  id: string;
  email?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  is_admin: boolean;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Função para buscar perfil do usuário
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Verificar sessão primeiro
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('No active session, cannot fetch profile');
        return null;
      }
  
      // Usar a sessão para buscar o perfil
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
  
      if (error) {
        console.error('Error fetching profile:', error);
        
        // Se for erro de permissão, tente reautenticar
        if (error.code === '42501' || error.code === 'PGRST301') {
          console.log('Permission error, refreshing session...');
          await supabase.auth.refreshSession();
          return null;
        }
        
        return null;
      }
  
      return data;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  }, []);

  // Função para atualizar o estado com os dados do usuário
  const refreshUserState = useCallback(async (session: Session | null) => {
    setIsLoading(true);
    
    try {
      if (!session) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        return;
      }

      setUser(session.user);
      
      const profile = await fetchProfile(session.user.id);
      if (profile) {
        setProfile(profile);
        setIsAdmin(!!profile.is_admin);
      }
    } catch (error) {
      console.error('Error refreshing user state:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  // Inicializar o estado da autenticação
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Obter sessão atual
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setSession(data.session);
        await refreshUserState(data.session);
        
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setProfile(null);
        setSession(null);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        await refreshUserState(session);
        
        // Redirecionar com base no evento
        if (event === 'SIGNED_IN') {
          // Se estiver em uma página de autenticação, redirecionar para a home
          if (router.pathname.startsWith('/auth')) {
            router.push('/home');
          }
        } else if (event === 'SIGNED_OUT') {
          router.push('/auth/login');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refreshUserState, router]);

  // Login com email/senha
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  // Registro de novo usuário
  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });
      
      return { error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  // Logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Atualizar o perfil do usuário
  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await fetchProfile(user.id);
      if (profile) {
        setProfile(profile);
        setIsAdmin(!!profile.is_admin);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAdmin,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};