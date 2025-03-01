// src/pages/auth/discord-callback.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import { FaDiscord, FaCheck, FaTimes } from 'react-icons/fa';
import { handleDiscordAuth } from '../../lib/discord/discordAuth';
import { supabase } from '../../lib/supabase/client';

const DiscordCallbackPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autenticação do Discord...');

  useEffect(() => {
    const { code, error } = router.query;
    
    // Se há um erro no retorno do Discord
    if (error) {
      setStatus('error');
      setMessage(`Erro na autenticação do Discord: ${error}`);
      return;
    }
    
    // Se ainda não temos o código (esperando query params)
    if (!code) return;

    const processAuth = async () => {
      try {
        // Processar o código de autenticação
        if (typeof code === 'string') {
          // Na implementação real, chamaríamos handleDiscordAuth, 
          // mas aqui vamos fazer uma lógica simplificada

          // Simulação: trocar o código por tokens via API
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
              redirectTo: `${window.location.origin}/perfil`
            }
          });

          if (error) throw error;
          
          // Em caso de sucesso
          setStatus('success');
          setMessage('Autenticação realizada com sucesso!');
          
          // Redirecionar após um breve período
          setTimeout(() => {
            router.push('/perfil');
          }, 2000);
        }
      } catch (err) {
        console.error('Erro ao processar autenticação do Discord:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Falha na autenticação do Discord');
      }
    };

    processAuth();
  }, [router]);

  return (
    <Layout
      title="Autenticação com Discord - Phanteon Games"
      description="Processando autenticação com Discord"
    >
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="max-w-md w-full text-center">
          <div className="py-8 px-6">
            <div className="flex justify-center mb-6">
              {status === 'loading' && (
                <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center">
                  <FaDiscord className="text-white text-3xl" />
                </div>
              )}
              
              {status === 'success' && (
                <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center">
                  <FaCheck className="text-white text-3xl" />
                </div>
              )}
              
              {status === 'error' && (
                <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center">
                  <FaTimes className="text-white text-3xl" />
                </div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold mb-4">
              {status === 'loading' && 'Conectando com Discord'}
              {status === 'success' && 'Autenticação Concluída'}
              {status === 'error' && 'Erro na Autenticação'}
            </h1>
            
            <p className="text-zinc-300 mb-6">{message}</p>
            
            {status === 'loading' && <LoadingSpinner color="amber" />}
            
            {status === 'error' && (
              <button
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-md transition-colors"
              >
                Voltar para Login
              </button>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default DiscordCallbackPage;