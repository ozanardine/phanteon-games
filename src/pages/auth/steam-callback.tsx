// src/pages/auth/steam-callback.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import { FaSteam, FaCheck, FaTimes } from 'react-icons/fa';
import { handleSteamAuth } from '../../lib/steam/steamAuth';
import toast from 'react-hot-toast';

const SteamCallbackPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autenticação do Steam...');

  useEffect(() => {
    // Aguardar os parâmetros da URL estarem disponíveis
    if (!router.isReady || Object.keys(router.query).length === 0) return;

    const processAuth = async () => {
      try {
        // Converter query params para o formato correto
        const queryParams: Record<string, string> = {};
        Object.keys(router.query).forEach(key => {
          if (typeof router.query[key] === 'string') {
            queryParams[key] = router.query[key] as string;
          }
        });

        // Processar a autenticação Steam
        const result = await handleSteamAuth(queryParams);
        
        if (result.success) {
          setStatus('success');
          setMessage(`Autenticação realizada com sucesso! Bem-vindo, ${result.steamUsername}.`);
          
          // Verificar se há um redirecionamento específico
          const { redirect } = router.query;
          
          // Redirecionar após um breve período
          setTimeout(() => {
            if (typeof redirect === 'string' && redirect.startsWith('/')) {
              router.push(redirect);
            } else {
              router.push('/perfil');
            }
          }, 2000);
        } else {
          throw new Error('Falha na autenticação do Steam');
        }
      } catch (err) {
        console.error('Erro ao processar autenticação do Steam:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Falha na autenticação do Steam');
        
        // Exibir erro como toast
        toast.error('Falha na autenticação do Steam. Por favor, tente novamente.');
      }
    };

    processAuth();
  }, [router.isReady, router.query, router]);

  return (
    <Layout
      title="Autenticação com Steam - Phanteon Games"
      description="Processando autenticação com Steam"
    >
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="max-w-md w-full text-center">
          <div className="py-8 px-6">
            <div className="flex justify-center mb-6">
              {status === 'loading' && (
                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center">
                  <FaSteam className="text-white text-3xl" />
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
              {status === 'loading' && 'Conectando com Steam'}
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

export default SteamCallbackPage;