import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaChevronLeft, FaGift, FaCheckCircle, FaSadTear, FaServer, FaClock, FaLock } from 'react-icons/fa';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

// Função para formatar shortname para URL do CDN Rust Helper
const formatItemShortName = (shortName) => {
  if (!shortName) return '';
  return shortName.replace(/\./g, '-');
};

// Função para obter URL de imagem do CDN Rust Helper
const getItemImageUrl = (shortName) => {
  if (!shortName) {
    return null;
  }
  return `https://cdn.rusthelp.com/images/source/${formatItemShortName(shortName)}.png`;
};

// Obter classe de raridade para borda - MOVIDO PARA FORA DO COMPONENTE
const getRarityBorderClass = (rarity) => {
  switch (rarity?.toLowerCase()) {
    case 'common': return 'border-gray-500 bg-dark-700';
    case 'uncommon': return 'border-blue-500 bg-dark-700';
    case 'rare': return 'border-teal-500 bg-dark-700';
    case 'epic': return 'border-purple-500 bg-dark-700';
    case 'legendary': return 'border-yellow-400 bg-dark-700';
    default: return 'border-gray-500 bg-dark-700';
  }
};

// Obter classe de background de raridade - MOVIDO PARA FORA DO COMPONENTE
const getRarityBackgroundClass = (rarity) => {
  switch (rarity?.toLowerCase()) {
    case 'common': return 'bg-gray-800';
    case 'uncommon': return 'bg-blue-900';
    case 'rare': return 'bg-teal-900';
    case 'epic': return 'bg-purple-900';
    case 'legendary': return 'bg-amber-900';
    default: return 'bg-gray-800';
  }
};

// Mapeamento de nomes de itens para shortnames do Rust
const itemShortnames = {
  'Scrap': 'scrap',
  'Wood': 'wood',
  'Metal Fragments': 'metal.fragments',
  'High Quality Metal': 'metal.refined',
  'Assault Rifle': 'rifle.ak',
  'Rocket Launcher': 'rocket.launcher',
  'L96 Rifle': 'rifle.l96',
  'Supply Signal': 'supply.signal',
  'Stone': 'stones',
  'Sulfur': 'sulfur',
  'Cloth': 'cloth',
  'Leather': 'leather',
  'Low Grade Fuel': 'lowgradefuel',
  'Medical Syringe': 'syringe.medical'
};

// Componente para renderizar um item da roleta
const RouletteItem = ({ item, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className={`roulette-item flex-shrink-0 w-32 h-32 relative p-2 m-1 border-2 ${getRarityBorderClass(item.rarity)} ${className}`} data-id={item.id}>
      {/* Imagem do item */}
      <div className="relative h-24 flex items-center justify-center">
        {!imageError ? (
          <img 
            src={getItemImageUrl(item.shortname)}
            alt={item.name}
            className="max-h-full max-w-full object-contain drop-shadow-lg"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-dark-700/50 flex items-center justify-center text-2xl font-bold text-gray-400">
            {item.name.charAt(0)}
          </div>
        )}
      </div>
      
      {/* Nome do item */}
      <div className="text-white text-center font-medium text-xs truncate">
        {item.name}
      </div>
    </div>
  );
};

// Componente principal
const OpenCase = () => {
  const router = useRouter();
  const { id: caseId, game } = router.query;
  const { data: session, status } = useSession();
  const [caseData, setCaseData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState('');
  const [error, setError] = useState(null);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const [rouletteItems, setRouletteItems] = useState([]);
  const [rouletteStyle, setRouletteStyle] = useState({});
  
  // Refs para a roleta
  const rouletteRef = useRef(null);
  const rouletteContainerRef = useRef(null);
  
  // Gerar um ID único para segurança da sessão
  const sessionId = useRef(
    typeof window !== 'undefined' && window.crypto
      ? window.crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  );
  
  // Carregar dados da caixa
  useEffect(() => {
    if (!caseId || status === 'loading') return;
    
    // Verificar autenticação e redirecionar se necessário
    if (status === 'unauthenticated') {
      toast.error('Você precisa estar logado para acessar esta página');
      router.push('/api/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href));
      return;
    }
    
    const fetchCaseDetails = async () => {
      try {
        setLoading(true);
        
        // Verificação extra de autenticação
        if (!session) {
          console.log("Sessão não disponível, aguardando...");
          return; // Não continua se não houver sessão
        }
        
        const response = await fetch(`/api/cases/detail/${caseId}`);
        
        if (response.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.');
          router.push('/api/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href));
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Garantir que cada item tenha um shortname
          const itemsWithShortnames = data.items.map(item => ({
            ...item,
            shortname: item.shortname || itemShortnames[item.name] || 
                      item.name?.toLowerCase().replace(/\s+/g, '.')
          }));
          
          setCaseData(data.case);
          setItems(itemsWithShortnames);
          
          // Pré-carregar imagens
          preloadImages(itemsWithShortnames);
        } else {
          setError(data.message || 'Erro ao carregar detalhes da caixa');
          toast.error('Não foi possível carregar a caixa');
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes da caixa:', err);
        setError(`Erro ao conectar ao servidor: ${err.message}`);
        toast.error('Erro ao carregar a caixa');
      } finally {
        setLoading(false);
      }
    };
    
    // Carregar servidores disponíveis
    const fetchServers = async () => {
      try {
        if (!session) return; // Não continua se não houver sessão
        
        const response = await fetch('/api/servers/list');
        const data = await response.json();
        
        if (data.success && data.servers.length > 0) {
          setServers(data.servers);
          setSelectedServer(data.servers[0].id);
        }
      } catch (err) {
        console.error('Erro ao buscar servidores:', err);
      }
    };
    
    fetchCaseDetails();
    fetchServers();
  }, [caseId, status, router, session]);
  
  // Pré-carregar imagens dos itens
  const preloadImages = (items) => {
    const uniqueShortnames = [...new Set(items.map(item => item.shortname).filter(Boolean))];
    let loadedCount = 0;
    const totalImagesToLoad = uniqueShortnames.length;
    
    if (totalImagesToLoad === 0) {
      setImagesPreloaded(true);
      return;
    }
    
    uniqueShortnames.forEach(shortname => {
      if (!shortname) return;
      
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= totalImagesToLoad) {
          setImagesPreloaded(true);
        }
      };
      img.onerror = () => {
        console.warn(`Falha ao carregar imagem: ${shortname}`);
        loadedCount++;
        if (loadedCount >= totalImagesToLoad) {
          setImagesPreloaded(true);
        }
      };
      img.src = getItemImageUrl(shortname);
    });
    
    // Adicionar um timeout para garantir que não ficamos esperando eternamente
    setTimeout(() => {
      if (!imagesPreloaded) {
        console.warn('Timeout ao carregar imagens, continuando mesmo assim');
        setImagesPreloaded(true);
      }
    }, 3000);
  };
  
  // Preparar itens para a roleta
  useEffect(() => {
    if (items.length === 0 || !imagesPreloaded) return;
    
    // Usar um número maior de itens para uma roleta mais cheia
    const numRepetitions = 5;
    const finalItems = [];
    
    // Repete os itens várias vezes para criar uma roleta mais longa
    for (let i = 0; i < numRepetitions; i++) {
      // Embaralha os itens em cada repetição para evitar padrões
      const shuffledItems = [...items].sort(() => 0.5 - Math.random());
      finalItems.push(...shuffledItems);
    }
    
    setRouletteItems(finalItems);
    
    // Centralizar a roleta para um visual melhor - feito via CSS agora
    setRouletteStyle({
      transform: 'translateX(0px)'
    });
  }, [items, imagesPreloaded]);
  
  // Iniciar animação de roleta
  const startRouletteAnimation = useCallback(() => {
    // Calcular quantidade de rolagem para uma experiência mais longa
    const itemWidth = 134; // Largura do item + margem
    const totalItems = items.length * 5; // Multiplicamos pelo número de repetições
    const randomOffset = Math.floor(Math.random() * itemWidth);
    const scrollDistance = (totalItems * itemWidth) - randomOffset;
    
    // Iniciar animação com uma curva de bezier mais natural
    setRouletteStyle({
      transition: 'transform 6s cubic-bezier(0.15, 0.85, 0.25, 1.0)',
      transform: `translateX(-${scrollDistance}px)`
    });
  }, [items]);
  
  // Parar a animação no item ganho
  const stopRouletteAnimation = useCallback((wonItem) => {
    if (!rouletteContainerRef.current || !wonItem || !rouletteRef.current) return;
    
    try {
      // Encontrar o elemento correspondente ao item ganho
      const itemElements = rouletteContainerRef.current.querySelectorAll(`[data-id="${wonItem.id}"]`);
      
      if (itemElements.length === 0) {
        console.error('Nenhum elemento correspondente ao item ganho foi encontrado');
        return;
      }
      
      // Escolher um elemento aleatório para parar (para variar a posição)
      const randomIndex = Math.min(3, Math.floor(Math.random() * itemElements.length));
      const targetElement = itemElements[randomIndex];
      
      // Obter a posição do elemento
      const targetRect = targetElement.getBoundingClientRect();
      const rouletteRect = rouletteRef.current.getBoundingClientRect();
      
      // Calcular a posição para centralizar o item (ajuste aqui se necessário)
      const centerPosition = (rouletteRect.width / 2) - (targetRect.width / 2);
      const currentOffset = targetRect.left - rouletteRect.left;
      const scrollNeeded = currentOffset - centerPosition;
      
      console.log('Parando roleta no item:', wonItem.name);
      console.log('Posições:', { targetLeft: targetRect.left, rouletteLeft: rouletteRect.left, centerPos: centerPosition });
      
      // Aplicar a animação final com React
      setRouletteStyle({
        transition: 'transform 1s cubic-bezier(0.1, 0.8, 0.2, 1.0)',
        transform: `translateX(-${scrollNeeded}px)`
      });
      
      // Destacar o item ganho após um breve atraso
      setTimeout(() => {
        // Aplicar classes de destaque via DOM para o item específico
        if (targetElement) {
          targetElement.classList.add('winner');
          targetElement.classList.add('glow-effect');
          targetElement.style.transform = 'scale(1.1)';
          targetElement.style.zIndex = '10';
        }
      }, 1000);
    } catch (error) {
      console.error('Erro ao parar animação da roleta:', error);
    }
  }, []);
  
  // Abrir a caixa
  const handleOpenCase = async () => {
    if (opening || result) return;
    
    // Verificar autenticação novamente
    if (!session || status !== 'authenticated') {
      toast.error('Você precisa estar logado para abrir a caixa');
      setError('Sua sessão expirou. Por favor, faça login novamente.');
      
      // Forçar nova autenticação
      signIn('discord', { callbackUrl: window.location.href });
      return;
    }
    
    try {
      setOpening(true);
      
      // Iniciar animação de roleta
      startRouletteAnimation();
      
      // Chamar API para abrir a caixa com ID de sessão para segurança
      const response = await fetch('/api/cases/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId.current,
        },
        body: JSON.stringify({
          userId: session.user.id,
          caseId: caseId,
          steamId: session.user.steamId || '',
          sessionId: sessionId.current,
        }),
      });
      
      if (response.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        
        // Forçar nova autenticação
        signIn('discord', { callbackUrl: window.location.href });
        setOpening(false);
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Garantir que o item ganho tenha um shortname
        if (data.item) {
          data.item.shortname = data.item.shortname || 
                              itemShortnames[data.item.name] || 
                              data.item.name?.toLowerCase().replace(/\s+/g, '.');
        }
        
        // Continuar a animação por um tempo para criar suspense
        setTimeout(() => {
          // Parar a animação no item ganho
          stopRouletteAnimation(data.item);
          
          // Criar um pequeno atraso para melhorar a experiência
          setTimeout(() => {
            setResult(data);
            // Reproduzir som de item ganho (opcional)
            playWinSound(data.item.rarity);
          }, 1000);
        }, 5000); // Aumentei para 5s para criar mais suspense
      } else {
        setError(data.message || 'Erro ao abrir a caixa');
        toast.error(data.message || 'Não foi possível abrir a caixa');
        setOpening(false);
      }
    } catch (err) {
      console.error('Erro ao abrir a caixa:', err);
      setError(`Erro ao conectar ao servidor: ${err.message}`);
      toast.error('Erro de conexão ao servidor');
      setOpening(false);
    }
  };
  
  // Reproduzir som de vitória baseado na raridade (opcional)
  const playWinSound = (rarity) => {
    // Você pode implementar a reprodução de som aqui
    // Por exemplo:
    /*
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      
      switch(rarity?.toLowerCase()) {
        case 'legendary':
          audio.src = '/sounds/legendary.mp3';
          break;
        case 'epic':
          audio.src = '/sounds/epic.mp3';
          break;
        default:
          audio.src = '/sounds/win.mp3';
      }
      
      audio.play().catch(e => console.warn('Não foi possível reproduzir o som:', e));
    }
    */
  };
  
  // Resgatar o item ganho
  const handleClaimItem = async () => {
    if (!result || claiming || claimed || !selectedServer) return;
    
    // Verificar autenticação novamente
    if (!session || status !== 'authenticated') {
      toast.error('Você precisa estar logado para resgatar o item');
      
      // Forçar nova autenticação
      signIn('discord', { callbackUrl: window.location.href });
      return;
    }
    
    try {
      setClaiming(true);
      
      const response = await fetch('/api/cases/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId.current,
        },
        body: JSON.stringify({
          openingId: result.opening.id,
          steamId: session.user.steamId || '',
          serverId: selectedServer,
          sessionId: sessionId.current,
        }),
      });
      
      if (response.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        
        // Forçar nova autenticação
        signIn('discord', { callbackUrl: window.location.href });
        setClaiming(false);
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setClaimed(true);
        toast.success('Item resgatado com sucesso!');
      } else {
        setError(data.message || 'Erro ao resgatar item');
        toast.error(data.message || 'Não foi possível resgatar o item');
      }
    } catch (err) {
      console.error('Erro ao resgatar item:', err);
      setError(`Erro ao conectar ao servidor: ${err.message}`);
      toast.error('Erro de conexão ao servidor');
    } finally {
      setClaiming(false);
    }
  };
  
  // Componente para exibição do resultado
  const ItemWonView = () => {
    if (!result || !result.item) return null;
    
    const item = result.item;
    const rarity = item.rarity ? item.rarity.toLowerCase() : 'common';
    
    return (
      <div className="text-center mt-8 mb-12">
        <div className="bg-dark-800 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Parabéns!</h2>
          
          <div className={`relative mx-auto w-48 h-48 flex items-center justify-center p-4 rounded-lg border-2 ${getRarityBorderClass(rarity)} ${getRarityBackgroundClass(rarity)} glow-effect`}>
            <img 
              src={getItemImageUrl(item.shortname)}
              alt={item.name}
              className="max-w-full max-h-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.className = "w-24 h-24 rounded-full bg-dark-700/50 flex items-center justify-center text-4xl font-bold text-gray-400";
                placeholder.innerText = item.name.charAt(0);
                e.target.parentNode.appendChild(placeholder);
              }}
            />
          </div>
          
          <h3 className="text-xl font-bold text-white mt-4">{item.name}</h3>
          <p className="text-gray-400 mt-1">{item.description || 'Item do jogo'}</p>
          
          {/* Badge de raridade */}
          <div className="mt-4 inline-block">
            <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase 
              ${rarity === 'common' ? 'bg-gray-600/30 text-gray-300' : 
                rarity === 'uncommon' ? 'bg-blue-600/30 text-blue-300' :
                rarity === 'rare' ? 'bg-teal-600/30 text-teal-300' :
                rarity === 'epic' ? 'bg-purple-600/30 text-purple-300' :
                'bg-yellow-600/30 text-yellow-300'
              }`}
            >
              {rarity}
            </span>
          </div>
          
          {!claimed ? (
            <div className="mt-8">
              {/* Selecão de servidor, se houver mais de um */}
              {servers.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Selecione um servidor para receber seu item:
                  </label>
                  <select 
                    value={selectedServer}
                    onChange={(e) => setSelectedServer(e.target.value)}
                    className="w-full bg-dark-700 border border-dark-500 rounded-md px-4 py-2 text-white"
                  >
                    {servers.map(server => (
                      <option key={server.id} value={server.id}>
                        {server.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <Button
                onClick={handleClaimItem}
                disabled={claiming}
                className="px-8 py-3 w-full"
              >
                {claiming ? (
                  <>
                    <LoadingSpinner size="small" className="mr-2" />
                    Resgatando...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2" />
                    Resgatar Item
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="mt-8 bg-green-800/20 border border-green-700/30 rounded-lg p-4">
              <p className="text-green-400 flex items-center justify-center">
                <FaCheckCircle className="mr-2" /> 
                Item resgatado com sucesso!
              </p>
              <p className="text-gray-300 text-sm mt-2">
                Você receberá seu item no servidor selecionado.
              </p>
            </div>
          )}
          
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => router.push(`/caixas/${game}`)}
              className="px-5 py-2"
            >
              <FaChevronLeft className="mr-2" /> Voltar para Caixas
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  // Verificar autenticação
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-900 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">Login Necessário</h1>
          <p className="text-gray-300 mb-8">
            Você precisa estar logado para abrir caixas de itens.
          </p>
          <Button 
            onClick={() => signIn('discord', { callbackUrl: window.location.href })}
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
        <title>
          {caseData ? `Abrindo ${caseData.name}` : 'Abrindo Caixa'} | Phanteon Games
        </title>
        <meta name="description" content="Abra caixas e ganhe itens para usar em nossos servidores." />
      </Head>
      
      <div className="min-h-screen bg-dark-900 pb-12">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-br from-dark-800 to-dark-900 py-6 border-b border-dark-700">
          <div className="container mx-auto px-4">
            <Link href={`/caixas/${game}`} className="flex items-center text-gray-400 hover:text-primary mb-4 transition">
              <FaChevronLeft className="mr-2" /> Voltar
            </Link>
            <div className="flex flex-col md:flex-row md:items-end justify-between">
              <h1 className="text-3xl font-bold text-white">{caseData?.name || 'Abrir Caixa'}</h1>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          {error ? (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8 text-white flex items-center">
              <FaSadTear className="mr-3 text-xl" />
              <p>{error}</p>
              {status === 'unauthenticated' && (
                <Button 
                  variant="primary"
                  onClick={() => signIn('discord', { callbackUrl: window.location.href })}
                  className="ml-4 px-4 py-2 text-sm"
                >
                  Fazer Login
                </Button>
              )}
            </div>
          ) : (
            <>
              {!result ? (
                <div className="text-center">
                  <div className="max-w-4xl mx-auto">
                    {/* Banner da caixa */}
                    <div className="mb-8 bg-gradient-to-br from-dark-800 to-dark-900 rounded-lg p-6 border border-dark-700">
                      <h2 className="text-xl font-bold text-white mb-4">
                        Abra esta caixa para ganhar um dos seguintes itens:
                      </h2>
                      <p className="text-gray-400 mb-6">Abra esta caixa uma vez por dia para ganhar itens em nosso servidor Rust</p>
                      
                      {/* Roleta de itens - Estilo semelhante ao CSGOSKINS */}
                      <div className="relative w-full h-36 overflow-hidden bg-dark-800 rounded-lg mb-8 border-t border-b border-dark-600" ref={rouletteRef}>
                        {/* Indicador central */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary z-10 line-pulse"></div>
                        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-dark-900 to-transparent z-10"></div>
                        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-dark-900 to-transparent z-10"></div>
                        
                        {/* Triângulo indicador */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 -top-3 z-20">
                          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[12px] border-transparent border-t-primary"></div>
                        </div>
                        
                        {/* Itens da roleta - renderizados com React */}
                        {items.length > 0 && imagesPreloaded ? (
                          <div 
                            className="flex items-center p-2" 
                            ref={rouletteContainerRef}
                            style={rouletteStyle}
                          >
                            {rouletteItems.map((item, index) => (
                              <RouletteItem key={`${item.id}-${index}`} item={item} />
                            ))}
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <LoadingSpinner size="md" text="Carregando itens..." />
                          </div>
                        )}
                      </div>
                      
                      {/* Botão de abrir */}
                      <Button
                        onClick={handleOpenCase}
                        disabled={opening || !imagesPreloaded || rouletteItems.length === 0 || status !== 'authenticated'}
                        className="px-8 py-3"
                        variant="primary"
                      >
                        {opening ? (
                          <>
                            <LoadingSpinner size="small" className="mr-2" />
                            Abrindo...
                          </>
                        ) : !imagesPreloaded || rouletteItems.length === 0 ? (
                          <>
                            <LoadingSpinner size="small" className="mr-2" />
                            Carregando...
                          </>
                        ) : status !== 'authenticated' ? (
                          <>
                            <FaLock className="mr-2" />
                            Login Necessário
                          </>
                        ) : (
                          <>
                            <FaGift className="mr-2" />
                            Abrir Caixa
                          </>
                        )}
                      </Button>
                      
                      {/* Informação de segurança */}
                      <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
                        <FaLock className="mr-1" /> 
                        Sistema 100% seguro - Os itens são sorteados pelo servidor
                      </div>
                    </div>
                    
                    {/* Conteúdo da caixa */}
                    <div className="mt-12">
                      <h2 className="text-xl font-bold text-white mb-4 text-center">Conteúdo da caixa</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {items.map((item) => (
                          <div 
                            key={item.id} 
                            className={`rounded-lg overflow-hidden border ${getRarityBorderClass(item.rarity)}`}
                          >
                            <div className={`p-3 ${getRarityBackgroundClass(item.rarity)}`}>
                              <div className="relative h-24 flex items-center justify-center mb-2">
                                <img 
                                  src={getItemImageUrl(item.shortname)}
                                  alt={item.name}
                                  className="max-h-full max-w-full object-contain drop-shadow-lg"
                                  onError={(e) => {
                                    // Fallback para placeholder
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    const placeholder = document.createElement('div');
                                    placeholder.className = "w-16 h-16 rounded-full bg-dark-700/50 flex items-center justify-center text-2xl font-bold text-gray-400";
                                    placeholder.innerText = item.name.charAt(0);
                                    e.target.parentNode.appendChild(placeholder);
                                  }}
                                />
                              </div>
                              <div className="text-center">
                                <p className="text-white text-sm font-medium truncate">{item.name}</p>
                                <p className="text-xs text-gray-400">{(item.drop_chance * 100).toFixed(4)}%</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <ItemWonView />
                  
                  {/* Lista de itens possíveis */}
                  <div className="mt-12 bg-dark-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-4 text-center">Outros itens possíveis</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {items.filter(i => i.id !== result.item.id).map((item) => (
                        <div 
                          key={item.id} 
                          className={`rounded-lg overflow-hidden border ${getRarityBorderClass(item.rarity)}`}
                        >
                          <div className={`p-3 ${getRarityBackgroundClass(item.rarity)}`}>
                            <div className="relative h-24 flex items-center justify-center mb-2">
                              <img 
                                src={getItemImageUrl(item.shortname)}
                                alt={item.name}
                                className="max-h-full max-w-full object-contain drop-shadow-lg"
                                onError={(e) => {
                                  // Fallback para placeholder
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  const placeholder = document.createElement('div');
                                  placeholder.className = "w-16 h-16 rounded-full bg-dark-700/50 flex items-center justify-center text-2xl font-bold text-gray-400";
                                  placeholder.innerText = item.name.charAt(0);
                                  e.target.parentNode.appendChild(placeholder);
                                }}
                              />
                            </div>
                            <div className="text-center">
                              <p className="text-white text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs text-gray-400">{(item.drop_chance * 100).toFixed(4)}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default OpenCase;