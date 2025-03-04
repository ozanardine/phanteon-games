import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Spinner } from '@/components/ui/Spinner';
import { AuthProvider } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Componente para garantir persistência de sessão
function SessionPersistence() {
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // Verificar sessão ao montar o componente
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error checking session:', error);
        }
        
        // Marcar como inicializado depois de verificar
        setInitialized(true);
      } catch (err) {
        console.error('Session check error:', err);
        setInitialized(true);
      }
    };
    
    checkSession();
    
    // Configurar listener para eventos de navegação
    const handleRouteChange = () => {
      // Verificar sessão a cada mudança de rota
      supabase.auth.getSession().catch(err => {
        console.error('Route change session error:', err);
      });
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);
  
  // Não renderizar nada, só gerenciar a sessão
  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <SessionPersistence />
      <Component {...pageProps} />
    </AuthProvider>
  );
}