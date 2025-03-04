// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'supabase.auth.token';
const LOCAL_STORAGE_KEY = 'phanteon.user.profile';

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
        // Tentar recuperar sessão do localStorage primeiro (mais rápido)
        const localProfile = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localProfile) {
          const parsedProfile = JSON.parse(localProfile);
          setProfile(parsedProfile);
          setIsAdmin(!!parsedProfile.is_admin);
        }
        
        // Obter sessão atual do Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          await handleSessionError();
          return;
        }
        
        if (data?.session) {
          console.log('Session found, user authenticated');
          setSession(data.session);
          setUser(data.session.user);
          
          // Buscar perfil atualizado
          const profile = await fetchProfile(data.session.user.id);
          if (profile) {
            setProfile(profile);
            setIsAdmin(!!profile.is_admin);
            
            // Armazenar no localStorage para recuperação rápida
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
          }
        } else {
          console.log('No session found, user not authenticated');
          clearUserData();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearUserData();
      } finally {
        setIsLoading(false);
      }
    };
  
    // Limpar dados do usuário
    const clearUserData = () => {
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsAdmin(false);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    };
    
    // Lidar com erros de sessão
    const handleSessionError = async () => {
      try {
        // Tentar renovar a sessão
        await supabase.auth.refreshSession();
        // Se chegou aqui sem erro, a sessão foi renovada
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          await refreshProfile();
        } else {
          clearUserData();
        }
      } catch (refreshError) {
        console.error('Error refreshing session:', refreshError);
        clearUserData();
      }
    };
  
    initializeAuth();
  
    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN') {
          setSession(newSession);
          setUser(newSession?.user || null);
          
          if (newSession?.user) {
            const profile = await fetchProfile(newSession.user.id);
            if (profile) {
              setProfile(profile);
              setIsAdmin(!!profile.is_admin);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
            }
          }
          
          // Se estiver em uma página de autenticação, redirecionar para a home
          if (router.pathname.startsWith('/auth')) {
            router.push('/home');
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          clearUserData();
          router.push('/auth/login');
        } else if (event === 'TOKEN_REFRESHED') {
          // Atualizar a sessão
          setSession(newSession);
        }
      }
    );
  
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile, router, refreshProfile]);

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