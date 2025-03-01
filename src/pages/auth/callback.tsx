import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Loading } from '@/components/ui/Loading';

export default function AuthCallback() {
  const router = useRouter();
  
  useEffect(() => {
    const { code } = router.query;
    
    if (code) {
      const handleCode = async () => {
        try {
          await supabase.auth.exchangeCodeForSession(String(code));
          router.push('/dashboard');
        } catch (error) {
          console.error('Error exchanging code for session:', error);
          router.push('/login?error=callback_error');
        }
      };
      
      handleCode();
    } else {
      router.push('/login?error=no_code');
    }
  }, [router.query, router]);
  
  return (
    <div className="min-h-screen bg-phanteon-dark flex flex-col items-center justify-center p-4">
      <Loading size="lg" />
      <h2 className="mt-4 text-xl text-white font-medium">Autenticando...</h2>
      <p className="mt-2 text-gray-400">Por favor, aguarde enquanto finalizamos o processo de login.</p>
    </div>
  );
}