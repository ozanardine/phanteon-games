// src/pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { UserProfile } from '../types/auth';
import { supabase } from '../lib/supabase/client';

// Create authentication context
export const AuthContext = createContext<{
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
}>({
  user: null,
  loading: true,
  setUser: () => {},
});

export default function App({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on application load
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        if (data.session?.user) {
          // Fetch complete user profile
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

    // Set up listener for authentication changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Fetch complete user profile
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
              createdAt: new Date(profileData.created_at),
              subscription: profileData.subscriptions ? {
                status: profileData.subscriptions.status,
                currentPeriodEnd: new Date(profileData.subscriptions.current_period_end),
                cancelAtPeriodEnd: !!profileData.subscriptions.cancel_at,
              } : undefined,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}