import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { supabase, UserProfile, getCurrentProfile } from '@/lib/supabase';

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkSessionValidity: () => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  refreshProfile: async () => {},
  refreshSession: async () => {},
  checkSessionValidity: async () => false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionTimeoutId, setSessionTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Configurar timer para expiração da sessão
  const setupSessionExpiryTimer = useCallback((expiresAt: number) => {
    if (sessionTimeoutId) {
      clearTimeout(sessionTimeoutId);
    }

    const now = Date.now();
    const timeUntilExpiry = expiresAt - now - 60000; // 1 minuto antes para alertar usuário
    
    if (timeUntilExpiry > 0) {
      const newTimeoutId = setTimeout(() => {
        alert('Sua sessão está prestes a expirar. Clique OK para renovar.');
        refreshSession();
      }, timeUntilExpiry);
      
      setSessionTimeoutId(newTimeoutId);
    } else {
      // Se já expirou, forçar logout
      logout();
    }
  }, []);

  const checkSessionValidity = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session validity check error:', error);
        return false;
      }
      
      if (!session) {
        return false;
      }
      
      // Verificar expiração
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      
      if (expiresAt && expiresAt < now) {
        console.log('Session expired, logging out');
        logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  };

  const loadUserProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      const { profile, error } = await getCurrentProfile();
      
      if (error) {
        console.error('Error loading user profile:', error);
        setProfile(null);
        setIsAdmin(false);
      } else {
        setProfile(profile);
        setIsAdmin(profile?.is_admin || false);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  const refreshSession = async () => {
    try {
      setIsLoading(true);
      
      // Verificar se token de refresh existe
      if (!session?.refresh_token) {
        console.log('No refresh token available, redirecting to login');
        await logout();
        return;
      }
      
      // Atualizar sessão com Supabase
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        await logout();
        return;
      }
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        await loadUserProfile(newSession.user.id);
        
        // Configurar novo timer se a sessão tiver data de expiração
        if (newSession.expires_at) {
          setupSessionExpiryTimer(newSession.expires_at * 1000);
        }
      }
    } catch (error) {
      console.error('Error in refreshSession:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      
      if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
        setSessionTimeoutId(null);
      }
      
      // Redirecionar para a página de login
      const currentPath = router.asPath;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Carregar sessão inicial
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting initial session:', error);
        return;
      }
      
      console.log('Initial session loaded:', session?.user?.id || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserProfile(session.user.id);
        
        // Configurar timer se a sessão tiver data de expiração
        if (session.expires_at) {
          setupSessionExpiryTimer(session.expires_at * 1000);
        }
      } else {
        setIsLoading(false);
      }
    });

    // Listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          if (sessionTimeoutId) {
            clearTimeout(sessionTimeoutId);
            setSessionTimeoutId(null);
          }
          
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setIsLoading(false);
          
          // Verificar se estamos em uma rota protegida e redirecionar se necessário
          const path = router.pathname;
          const protectedRoutes = ['/profile', '/vip', '/subscriptions', '/admin', '/dashboard', '/payment'];
          
          if (protectedRoutes.some(route => path.startsWith(route))) {
            router.push('/auth/login');
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserProfile(session.user.id);
            
            // Configurar timer para expiração
            if (session.expires_at) {
              setupSessionExpiryTimer(session.expires_at * 1000);
            }
          }
        }
      }
    );

    // Verificar validade da sessão periodicamente (a cada 5 minutos)
    const intervalId = setInterval(() => {
      checkSessionValidity();
    }, 300000);

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
      if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
      }
    };
  }, [router, setupSessionExpiryTimer]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        isAdmin,
        refreshProfile,
        refreshSession,
        checkSessionValidity,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};