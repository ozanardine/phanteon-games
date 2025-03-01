// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase/client';
import { UserProfile } from '../types/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Inicializar o estado de autenticação no carregamento
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        if (data.session?.user) {
          // Buscar perfil completo
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*, subscriptions(*)')
            .eq('id', data.session.user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
          }
          
          if (profileData) {
            setUser({
              id: data.session.user.id,
              email: data.session.user.email || '',
              firstName: profileData.first_name,
              lastName: profileData.last_name,
              avatarUrl: profileData.avatar_url,
              discordId: profileData.discord_id,
              discordUsername: profileData.discord_username,
              steamId: profileData.steam_id,
              createdAt: new Date(profileData.created_at),
              subscription: profileData.subscriptions ? {
                id: profileData.subscriptions.id,
                tier: 'vip', // Simplificado para apenas "vip"
                status: profileData.subscriptions.status,
                currentPeriodEnd: new Date(profileData.subscriptions.current_period_end),
                cancelAtPeriodEnd: !!profileData.subscriptions.cancel_at,
              } : undefined,
            });
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Monitora mudanças no estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Buscar perfil completo
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*, subscriptions(*)')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching user profile on auth change:', profileError);
          }
          
          if (profileData) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              firstName: profileData.first_name,
              lastName: profileData.last_name,
              avatarUrl: profileData.avatar_url,
              discordId: profileData.discord_id,
              discordUsername: profileData.discord_username,
              steamId: profileData.steam_id,
              steamUsername: profileData.steam_username,
              createdAt: new Date(profileData.created_at),
              subscription: profileData.subscriptions ? {
                id: profileData.subscriptions.id,
                tier: 'vip',
                status: profileData.subscriptions.status,
                currentPeriodEnd: new Date(profileData.subscriptions.current_period_end),
                cancelAtPeriodEnd: !!profileData.subscriptions.cancel_at,
              } : undefined,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'USER_UPDATED' && session?.user) {
          // Atualizar o perfil do usuário quando for alterado
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*, subscriptions(*)')
            .eq('id', session.user.id)
            .single();
            
          if (!profileError && profileData) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              firstName: profileData.first_name,
              lastName: profileData.last_name,
              avatarUrl: profileData.avatar_url,
              discordId: profileData.discord_id,
              discordUsername: profileData.discord_username,
              steamId: profileData.steam_id,
              steamUsername: profileData.steam_username,
              createdAt: new Date(profileData.created_at),
              subscription: profileData.subscriptions ? {
                id: profileData.subscriptions.id,
                tier: 'vip',
                status: profileData.subscriptions.status,
                currentPeriodEnd: new Date(profileData.subscriptions.current_period_end),
                cancelAtPeriodEnd: !!profileData.subscriptions.cancel_at,
              } : undefined,
            });
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};