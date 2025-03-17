import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaInfoCircle, FaGamepad, FaGift, FaChevronLeft, FaClock, FaSadTear, FaCheck, FaLock, FaStar } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getItemImageUrl, getRarityClass } from '../../utils/formatters';

// Componentes da página
const GameCases = () => {
  const router = useRouter();
  const { game } = router.query;
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [error, setError] = useState(null);
  const [gameTitle, setGameTitle] = useState('');
  const [dailyStreak, setDailyStreak] = useState(0);

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
          // Se houver informação sobre streak diário
          if (data.dailyStreak) {
            setDailyStreak(data.dailyStreak);
          }
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
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Verifica se o usuário está autenticado
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-900 px-4">
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

      <div className="min-h-screen bg-dark-900">
        {/* Banner de fundo */}
        <div className="relative h-64 bg-gradient-to-r from-dark-800 to-dark-900 overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-center bg-cover" style={{ 
            backgroundImage: `url('/images/games/${game}-banner.jpg')` 
          }} />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />
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
          {dailyStreak > 0 && (
            <div className="bg-gradient-to-r from-blue-900/30 to-dark-800 rounded-lg p-4 mb-8 border border-blue-800/30">
              <div className="flex items-center">
                <div className="mr-4 bg-blue-700/30 p-3 rounded-full">
                  <FaStar className="text-yellow-400 text-2xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Série Diária: {dailyStreak} dia{dailyStreak > 1 ? 's' : ''}</h3>
                  <p className="text-gray-300 text-sm">
                    Continue abrindo caixas diariamente para receber recompensas exclusivas!
                    {dailyStreak >= 6 ? ' Você receberá um item bônus amanhã!' : ''}
                  </p>
                </div>
                <div className="ml-auto hidden md:block">
                  <div className="flex space-x-1">
                    {[...Array(7)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-8 h-8 flex items-center justify-center rounded ${i < dailyStreak ? 'bg-primary text-dark-900' : 'bg-dark-700 text-gray-500'}`}
                      >
                        {i < dailyStreak ? <FaCheck className="text-sm" /> : i+1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8 text-white">
              <div className="flex items-center">
                <FaSadTear className="mr-3 text-xl" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Informações sobre como ganhar caixas extras */}
          <div className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-lg p-6 mb-8 border border-dark-700">
            <div className="flex items-center mb-4">
              <FaGift className="text-primary text-2xl mr-3" />
              <h3 className="text-xl font-bold text-white">Abra até 3 caixas grátis!</h3>
            </div>
            <ol className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="bg-primary text-dark-900 w-5 h-5 rounded-full flex items-center justify-center font-bold mr-2 mt-0.5 flex-shrink-0">1</span>
                <span>Adicione <strong className="text-primary">PHANTEON</strong> ao seu apelido para abrir esta caixa.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-dark-900 w-5 h-5 rounded-full flex items-center justify-center font-bold mr-2 mt-0.5 flex-shrink-0">2</span>
                <span>Abra diariamente por <strong>7 dias</strong> para receber uma caixa de bônus.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-dark-900 w-5 h-5 rounded-full flex items-center justify-center font-bold mr-2 mt-0.5 flex-shrink-0">3</span>
                <span>Configure o <strong>avatar</strong> para receber um <strong>item adicional</strong> no dia do bônus.</span>
              </li>
            </ol>
          </div>

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
  const [hovered, setHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // SVG placeholder para itens sem imagem
  const placeholderSvg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZjNzU4MCI+PHBhdGggZD0iTTMgMi41YTIuNSAyLjUgMCAwIDEgNSAwIDIuNSAyLjUgMCAwIDEgNSAwdi4wMDZjMCAuMDcgMCAuMjctLjAzOC40OTRIMTVhMSAxIDAgMCAxIDEgMXYyYTEgMSAwIDAgMS0xIDF2Ny41YTEuNSAxLjUgMCAwIDEtMS41IDEuNWgtMTFBMS41IDEuNSAwIDAgMSAxIDE0LjVWN2ExIDEgMCAwIDEtMS0xVjRhMSAxIDAgMCAxIDEtMWgyLjAzOEEyLjk2OCAyLjk2OCAwIDAgMSAzIDIuNTA2VjIuNXptMS4wNjguNUg3di0uNWExLjUgMS41IDAgMSAwLTMgMGMwIC4wODUuMDAyLjI3NC4wNDUuNDNhLjUyMi41MjIgMCAwIDAgLjAyMy4wN3pNOSAzaDIuOTMyYS41Ni41NiAwIDAgMCAuMDIzLS4wN2MuMDQzLS4xNTYuMDQ1LS4zNDUuMDQ1LS40M2ExLjUgMS41IDAgMCAwLTMgMFYzek0xIDR2Mmg2VjRIMXptOCAwdjJoNlY0SDl6bTUgM0g5djhoNC41YS41LjUgMCAwIDAgLjUtLjVWN3ptLTcgOFY3SDJ2Ny41YS41LjUgMCAwIDAgLjUuNUg3eiI+PC9wYXRoPjwvc3ZnPg==';

  // Determinar a URL da imagem da caixa - prioriza CDN
  const getImageSource = () => {
    if (caseData.shortname) return getItemImageUrl(caseData.shortname);
    if (caseData.image_url) return caseData.image_url;
    return placeholderSvg;
  };

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

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  };

  // Abrir a caixa
  const handleOpenCase = () => {
    router.push(`/caixas/abrir/${caseData.id}?game=${gameType}`);
  };

  // Handler para erro de imagem
  const handleImageError = (e) => {
    // Se a imagem do CDN falhar e houver uma URL alternativa
    if (caseData.shortname && caseData.image_url && e.target.src !== caseData.image_url) {
      e.target.src = caseData.image_url;
      // Segunda chance de falha - se a URL alternativa também falhar
      e.target.onerror = () => {
        setImageFailed(true);
      };
    } else {
      setImageFailed(true);
    }
  };

  return (
    <Card 
      className={`overflow-hidden transform transition-all duration-300 ${hovered ? 'scale-105 shadow-xl' : ''} hover:border-primary bg-gradient-to-b from-dark-800 to-dark-900 border border-dark-700`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative h-48 flex items-center justify-center bg-dark-800 border-b border-dark-700 overflow-hidden">
        {/* Efeito de brilho no hover */}
        {hovered && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full animate-shine" />
        )}
        
        {!imageFailed && getImageSource() ? (
          <Image 
            src={getImageSource()}
            alt={caseData.name}
            fill
            className="object-contain p-4 drop-shadow-lg transition-transform duration-300"
            style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div 
              className="text-gray-600" 
              dangerouslySetInnerHTML={{
                __html: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16"><path d="M3 2.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1 5 0v.006c0 .07 0 .27-.038.494H15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 14.5V7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h2.038A2.968 2.968 0 0 1 3 2.506V2.5zm1.068.5H7v-.5a1.5 1.5 0 1 0-3 0c0 .085.002.274.045.43a.522.522 0 0 0 .023.07zM9 3h2.932a.56.56 0 0 0 .023-.07c.043-.156.045-.345.045-.43a1.5 1.5 0 0 0-3 0V3zM1 4v2h6V4H1zm8 0v2h6V4H9zm5 3H9v8h4.5a.5.5 0 0 0 .5-.5V7zm-7 8V7H2v7.5a.5.5 0 0 0 .5.5H7z"></path></svg>`
              }}
            />
          </div>
        )}
        
        {/* Badge de raridade ou tipo */}
        {caseData.rarity && (
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
              caseData.rarity.toLowerCase() === 'common' ? 'bg-gray-700 text-gray-300' :
              caseData.rarity.toLowerCase() === 'uncommon' ? 'bg-blue-700 text-blue-300' :
              caseData.rarity.toLowerCase() === 'rare' ? 'bg-teal-700 text-teal-300' :
              caseData.rarity.toLowerCase() === 'epic' ? 'bg-purple-700 text-purple-300' :
              'bg-yellow-700 text-yellow-300'
            }`}>
              {caseData.rarity}
            </span>
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
            className="w-full py-3 group overflow-hidden relative"
          >
            <span className="relative z-10 flex items-center justify-center">
              <FaGift className="mr-2" /> Abrir Caixa
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
          </Button>
        ) : (
          <div className="bg-dark-700/50 border border-dark-600 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center text-yellow-500 mb-1">
              <FaClock className="mr-2" /> Próxima abertura em:
            </div>
            <div className="text-white font-mono text-lg">{timeLeft || 'Calculando...'}</div>
            <div className="text-xs text-gray-400 mt-1 flex items-center justify-center">
              <FaLock className="mr-1" /> Sistema com proteção anti-fraude
            </div>
          </div>
        )}
      </div>
      
      {/* Decoração de fundo */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -z-10 opacity-50"></div>
    </Card>
  );
};

export default GameCases; 