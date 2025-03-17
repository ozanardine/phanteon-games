import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaChevronLeft, FaGift, FaGamepad, FaInfoCircle, FaExclamationTriangle, FaLock } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getItemImageUrl } from '../../utils/formatters';

const GameCases = () => {
  const router = useRouter();
  const { game } = router.query;
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [error, setError] = useState(null);
  const [gameTitle, setGameTitle] = useState('');

  // Timeout de segurança para evitar carregamento infinito
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        if (cases.length === 0 && !error) {
          setError('Tempo limite de carregamento excedido. Por favor, recarregue a página.');
        }
      }
    }, 10000);

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
        
        if (!response.ok) {
          const errorText = await response.text();
          
          let errorMessage = 'Erro ao carregar caixas';
          let errorDetails = '';
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
            errorDetails = errorData.errorDetail || '';
            
            toast.error(errorMessage);
            setError(`${errorMessage} ${errorDetails ? `(${errorDetails})` : ''}`);
          } catch (e) {
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
            Você precisa estar logado para acessar as caixas de itens.
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
              <Link href="/perfil" className="flex items-center text-gray-400 hover:text-primary mb-4 transition">
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
                <FaExclamationTriangle className="mr-3 text-xl" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
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

  // Carregar status da caixa para o usuário
  useEffect(() => {
    if (!userId || !caseData.id) {
      setCanOpen(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/cases/status/${caseData.id}/${userId}`);
        
        if (!isMounted) return;

        if (!response.ok) {
          setCanOpen(true);
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
          setCanOpen(true);
        }
      } catch (err) {
        console.error('Erro ao verificar status da caixa:', err);
        if (isMounted) {
          setCanOpen(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkStatus();
    
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
        setCanOpen(true);
      }
    }, 5000);

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
    if (caseData.shortname && caseData.image_url && e.target.src !== caseData.image_url) {
      e.target.src = caseData.image_url;
      e.target.onerror = () => {
        setImageFailed(true);
      };
    } else {
      setImageFailed(true);
    }
  };

  // Determinar a raridade e cores com base no tipo de caixa
  const getRarityData = () => {
    const freeCase = caseData.price === 0 || caseData.free;
    
    if (freeCase) {
      return {
        label: 'Grátis',
        bgClass: 'from-blue-800 to-blue-900',
        borderClass: 'border-blue-500',
        textClass: 'text-blue-400'
      };
    }
    
    switch (caseData.rarity?.toLowerCase()) {
      case 'legendary':
        return {
          label: 'Lendário',
          bgClass: 'from-yellow-700 to-amber-900',
          borderClass: 'border-yellow-500',
          textClass: 'text-yellow-400'
        };
      case 'epic':
        return {
          label: 'Épico',
          bgClass: 'from-purple-800 to-purple-900',
          borderClass: 'border-purple-500',
          textClass: 'text-purple-400'
        };
      case 'rare':
        return {
          label: 'Raro',
          bgClass: 'from-teal-800 to-teal-900',
          borderClass: 'border-teal-500',
          textClass: 'text-teal-400'
        };
      default:
        return {
          label: 'Comum',
          bgClass: 'from-gray-700 to-gray-800',
          borderClass: 'border-gray-600',
          textClass: 'text-gray-400'
        };
    }
  };

  const rarityData = getRarityData();

  return (
    <Card 
      className={`overflow-hidden transform transition-transform duration-500 hover:scale-105 ${hovered ? 'shadow-xl' : 'shadow-md'} border-2 ${rarityData.borderClass}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`relative h-48 flex items-center justify-center border-b ${rarityData.borderClass} overflow-hidden bg-gradient-to-b ${rarityData.bgClass}`}>
        {/* Efeito de brilho no hover */}
        {hovered && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine" />
        )}
        
        {!imageFailed && getImageSource() ? (
          <img 
            src={getImageSource()}
            alt={caseData.name}
            className="object-contain max-h-40 max-w-40 drop-shadow-lg transition-transform duration-300"
            style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div dangerouslySetInnerHTML={{__html: `
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" class="text-gray-600" viewBox="0 0 16 16">
                <path d="M3 2.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1 5 0v.006c0 .07 0 .27-.038.494H15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 14.5V7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h2.038A2.968 2.968 0 0 1 3 2.506V2.5zm1.068.5H7v-.5a1.5 1.5 0 1 0-3 0c0 .085.002.274.045.43a.522.522 0 0 0 .023.07zM9 3h2.932a.56.56 0 0 0 .023-.07c.043-.156.045-.345.045-.43a1.5 1.5 0 0 0-3 0V3zM1 4v2h6V4H1zm8 0v2h6V4H9zm5 3H9v8h4.5a.5.5 0 0 0 .5-.5V7zm-7 8V7H2v7.5a.5.5 0 0 0 .5.5H7z"></path>
              </svg>
            `}} />
          </div>
        )}
        
        {/* Badge de raridade ou tipo */}
        <div className="absolute top-2 right-2">
          <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${rarityData.bgClass} ${rarityData.textClass}`}>
            {rarityData.label}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-xl font-bold text-white mb-1">{caseData.name}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{caseData.description}</p>
        
        {loading ? (
          <div className="flex justify-center py-2">
            <LoadingSpinner size="small" />
          </div>
        ) : canOpen ? (
          <Button
            onClick={handleOpenCase}
            className="w-full py-3 group overflow-hidden relative"
            variant="gradient"
          >
            <span className="relative z-10 flex items-center justify-center">
              <FaGift className="mr-2" /> Abrir Caixa
            </span>
          </Button>
        ) : (
          <div className="bg-dark-700/80 border border-dark-600 rounded-lg p-3 text-center">
            <p className={`text-sm mb-1 ${rarityData.textClass}`}>Próxima abertura em:</p>
            <div className="text-white font-mono text-lg">{timeLeft || 'Calculando...'}</div>
            <div className="text-xs text-gray-400 mt-1 flex items-center justify-center">
              <FaLock className="mr-1" /> Limite diário
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default GameCases;