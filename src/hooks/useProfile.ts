import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

export function useProfile() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Verificar sessão no Supabase
        const { data: supabaseSession } = await supabase.auth.getSession();
        
        if (!supabaseSession.session) {
          console.log("Usando resiliência para carregar perfil sem sessão Supabase");
        }
        
        // Buscar perfil diretamente, sem depender da sessão do Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (error) throw error;
        
        setProfile(data);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (status !== 'loading') {
      fetchProfile();
    }
  }, [session, status]);
  
  return { profile, loading, error };
}