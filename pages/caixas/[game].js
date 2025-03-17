import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaInfoCircle, FaGamepad, FaGift, FaChevronLeft, FaClock, FaSadTear, FaCheck } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Componentes da página
const GameCases = () => {
  const router = useRouter();
  const { game } = router.query;
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [error, setError] = useState(null);
  const [gameTitle, setGameTitle] = useState('');

  // Usar useEffect para sair do estado de carregamento se ficar preso
  useEffect(() => {
    // Timeout de segurança para evitar carregamento infinito
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        if (cases.length === 0 && !error) {
          setError('Tempo limite de carregamento excedido. Por favor, recarregue a página.');
        }
      }
    }, 10000); // 10 segundos máximo de carregamento

    return () => clearTimeout(timeoutId);
  }, [loading, cases, error]);

  useEffect(() => {
    if (!game) return;

    // Definir o título do jogo baseado no parametro
    const titles = {
      'rust': 'Rust',
      'cs2': 'Counter-Strike 2'
    };
    setGameTitle(titles[game] || game);

    // Carregar as caixas para este jogo
    const fetchCases = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/cases/${game}`);
        
        // Verificar o código de status HTTP
        if (!response.ok) {
          const errorText = await response.text();
          
          let errorMessage = 'Erro ao carregar caixas';
          let errorDetails = '';
          
          try {
            // Tenta fazer o parse do JSON se possível
            const errorData = JSON.parse(errorText);
            
            errorMessage = errorData.message || errorMessage;
            errorDetails = errorData.errorDetail || '';
            
            if (errorData.errorCode === 'API_CONNECTION_ERROR') {
              toast.error('Problema ao conectar com o servidor de jogo. Por favor, tente novamente mais tarde.');
              setError(`Serviço temporariamente indisponível. Nossa equipe já foi notificada. ${errorDetails ? `(Detalhes: ${errorDetails})` : ''}`);
            } else if (errorData.errorCode === 'ENDPOINT_NOT_FOUND') {
              toast.error('Este tipo de caixa ainda não está disponível. Tente outro jogo.');
              setError('Estamos trabalhando para disponibilizar caixas para este jogo em breve!');
            } else if (errorData.errorCode === 'API_CONFIG_ERROR') {
              toast.error('Erro de configuração no servidor.');
              setError('Problema de configuração detectado. Por favor, informe a equipe técnica.');
            } else {
              toast.error(errorMessage);
              setError(`${errorMessage} ${errorDetails ? `(${errorDetails})` : ''}`);
            }
          } catch (e) {
            // Se não for JSON, use o texto bruto
            console.error('Erro não-JSON recebido:', errorText);
            setError(`Erro inesperado ao carregar caixas. Status: ${response.status}`);
            toast.error('Erro inesperado ao carregar caixas');
          }
          
          setLoading(false);
          return;
        }
        
        const data = await response.json();

        if (data.success) {
          setCases(data.cases || []);
        } else {
          setError(data.message || 'Erro ao carregar caixas');
          toast.error('Não foi possível carregar as caixas');
        }
      } catch (err) {
        console.error('Erro ao buscar caixas:', err);
        setError(`Erro ao conectar ao servidor: ${err.message}`);
        toast.error('Erro de conexão ao servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [game]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-300">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Verifica se o usuário está autenticado
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-300 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">Login Necessário</h1>
          <p className="text-gray-300 mb-8">
            Você precisa estar logado para acessar as caixas de itens diárias.
          </p>
          <Button 
            onClick={() => router.push('/api/auth/signin')} 
            className="px-8 py-3"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Caixas Diárias de {gameTitle} | Phanteon Games</title>
        <meta name="description" content={`Abra caixas diárias de ${gameTitle} e ganhe itens para usar no jogo.`} />
      </Head>

      <div className="min-h-screen bg-dark-300">
        {/* Banner de fundo */}
        <div className="relative h-64 bg-gradient-to-r from-dark-400 to-dark-300 overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-center bg-cover" style={{ 
            backgroundImage: `url('/images/games/${game}-banner.jpg')` 
          }} />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-300 to-transparent" />
          <div className="container mx-auto px-4 h-full flex items-end pb-6 relative z-10">
            <div>
              <Link href="/profile" className="flex items-center text-gray-400 hover:text-primary mb-4 transition">
                <FaChevronLeft className="mr-2" /> Voltar
              </Link>
              <h1 className="text-4xl font-bold text-white">Caixas de {gameTitle}</h1>
              <p className="text-gray-300 mt-2">
                Abra caixas diárias e ganhe itens para usar em nosso servidor.
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="container mx-auto px-4 py-10">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8 text-white">
              <div className="flex items-center">
                <FaSadTear className="mr-3 text-xl" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {cases.length === 0 && !loading && !error ? (
            <div className="text-center py-12">
              <FaGift className="mx-auto text-6xl text-gray-600 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Nenhuma caixa disponível</h2>
              <p className="text-gray-400">
                Não há caixas disponíveis para {gameTitle} no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cases.map(caseItem => (
                <CaseCard 
                  key={caseItem.id} 
                  caseData={caseItem} 
                  userId={session?.user?.id}
                  gameType={game}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Componente de cartão de caixa
const CaseCard = ({ caseData, userId, gameType }) => {
  const router = useRouter();
  const [canOpen, setCanOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [statusError, setStatusError] = useState(false);

  // Tratamento de casos em que a verificação de status falha
  useEffect(() => {
    // Se não temos como verificar o status, mostramos o botão de abrir por padrão
    if (!userId) {
      setCanOpen(true);
      setLoading(false);
    }
  }, [userId]);

  // Carregar status da caixa para o usuário
  useEffect(() => {
    if (!userId || !caseData.id) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/cases/status/${caseData.id}/${userId}`);
        
        // Verificar se o componente ainda está montado
        if (!isMounted) return;

        if (!response.ok) {
          // Se houver erro na API, mostramos o botão de abrir por padrão
          setCanOpen(true);
          setStatusError(true);
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        if (!isMounted) return;

        if (data.success) {
          setCanOpen(data.canOpen);
          if (!data.canOpen && data.lastOpening) {
            calculateTimeLeft(data.lastOpening);
          }
        } else {
          // Em caso de erro, permitimos abrir por padrão
          setCanOpen(true);
          setStatusError(true);
        }
      } catch (err) {
        console.error('Erro ao verificar status da caixa:', err);
        if (isMounted) {
          setCanOpen(true); // Em caso de erro, permitimos abrir por padrão
          setStatusError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkStatus();
    
    // Garantir que o loading seja definido como false após um tempo
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
        setCanOpen(true); // Em caso de timeout, permitimos abrir por padrão
      }
    }, 5000); // Timeout de segurança

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [caseData.id, userId]);

  // Calcular tempo restante para próxima abertura
  const calculateTimeLeft = (lastOpening) => {
    const lastDate = new Date(lastOpening);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(0, 0, 0, 0);

    const updateTimer = () => {
      const now = new Date();
      const difference = nextDate - now;
      
      if (difference <= 0) {
        setCanOpen(true);
        setTimeLeft(null);
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  };

  // Abrir a caixa
  const handleOpenCase = () => {
    router.push(`/caixas/abrir/${caseData.id}?game=${gameType}`);
  };

  return (
    <Card className="overflow-hidden hover:border-primary transition-all duration-300">
      <div className="relative h-48 bg-dark-500">
        {caseData.image_url ? (
          <Image 
            src={caseData.image_url} 
            alt={caseData.name}
            fill
            className="object-contain p-4"
            onError={(e) => {
              // Se a imagem falhar ao carregar, substituímos pelo ícone padrão
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = "w-full h-full flex items-center justify-center";
                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#6c7580" viewBox="0 0 16 16"><path d="M4 .5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-1Zm0 3v1a.5.5 0 0 1 .5.5h7a.5.5 0 0 1 .5-.5v-1a.5.5 0 0 1-.5-.5h-7a.5.5 0 0 1-.5.5Zm0 3.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-1Z"/><path d="M3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0M2 8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1a.5.5 0 0 1 0-1H12a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V8Z"/></svg>';
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaGift className="text-6xl text-gray-600" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold text-white">{caseData.name}</h3>
        <p className="text-gray-400 text-sm mb-4">{caseData.description}</p>
        
        {loading ? (
          <div className="flex justify-center py-2">
            <LoadingSpinner size="small" />
          </div>
        ) : canOpen ? (
          <Button
            onClick={handleOpenCase}
            className="w-full py-3"
          >
            <FaGift className="mr-2" /> Abrir Caixa
          </Button>
        ) : (
          <div className="bg-dark-500 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center text-yellow-500 mb-1">
              <FaClock className="mr-2" /> Próxima abertura em:
            </div>
            <div className="text-white font-mono">{timeLeft || 'Calculando...'}</div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default GameCases; 