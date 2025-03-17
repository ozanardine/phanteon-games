import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaChevronLeft, FaGift, FaCheckCircle, FaSadTear, FaServer, FaClock, FaLock } from 'react-icons/fa';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { getItemImageUrl } from '../../../utils/formatters';

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
  const [nextOpeningTime, setNextOpeningTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  
  // Refs para a animação
  const rouletteRef = useRef(null);
  const rouletteItemsRef = useRef(null);
  
  // Gerar um ID único para segurança da sessão
  const sessionId = useRef(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  
  // Carregar dados da caixa
  useEffect(() => {
    if (!caseId || status !== 'authenticated') return;
    
    const fetchCaseDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/cases/detail/${caseId}`);
        const data = await response.json();
        
        if (data.success) {
          setCaseData(data.case);
          setItems(data.items);
          
          // Verificar se há restrição de tempo para próxima abertura
          if (data.nextOpening) {
            setNextOpeningTime(new Date(data.nextOpening));
            updateTimeLeft(new Date(data.nextOpening));
          }
        } else {
          setError(data.message || 'Erro ao carregar detalhes da caixa');
          toast.error('Não foi possível carregar a caixa');
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes da caixa:', err);
        setError('Erro ao conectar ao servidor');
      } finally {
        setLoading(false);
      }
    };
    
    // Carregar servidores disponíveis
    const fetchServers = async () => {
      try {
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
  }, [caseId, status]);
  
  // Atualizar contador de tempo
  const updateTimeLeft = (nextTime) => {
    if (!nextTime) return;
    
    const updateTimer = () => {
      const now = new Date();
      const difference = nextTime - now;
      
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }
      
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    
    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timerId);
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
            onClick={() => router.push('/api/auth/signin')} 
            className="px-8 py-3"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }
  
  // Abrir a caixa
  const handleOpenCase = async () => {
    if (opening || result || timeLeft) return;
    
    try {
      setOpening(true);
      
      // Preparar itens para a roleta
      prepareRouletteItems();
      
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
          steamId: session.user.steamId,
          sessionId: sessionId.current,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Continuar a animação por um tempo para criar suspense
        setTimeout(() => {
          // Parar a animação no item ganho
          stopRouletteAnimation(data.item);
          
          // Criar um pequeno atraso para melhorar a experiência
          setTimeout(() => {
            setResult(data);
          }, 1000);
        }, 3000);
      } else {
        stopRouletteAnimation();
        setError(data.message || 'Erro ao abrir a caixa');
        toast.error(data.message || 'Não foi possível abrir a caixa');
        setOpening(false);
      }
    } catch (err) {
      console.error('Erro ao abrir a caixa:', err);
      stopRouletteAnimation();
      setError('Erro ao conectar ao servidor');
      toast.error('Erro de conexão ao servidor');
      setOpening(false);
    }
  };
  
  // Preparar itens para a roleta
  const prepareRouletteItems = () => {
    if (!rouletteItemsRef.current) return;
    
    // Limpar qualquer conteúdo anterior
    rouletteItemsRef.current.innerHTML = '';
    
    // Usar um número maior de itens para uma roleta mais cheia
    const numRepetitions = 5;
    const finalItems = [];
    
    // Repete os itens várias vezes para criar uma roleta mais longa
    for (let i = 0; i < numRepetitions; i++) {
      // Embaralha os itens em cada repetição para evitar padrões
      const shuffledItems = [...items].sort(() => 0.5 - Math.random());
      finalItems.push(...shuffledItems);
    }
    
    // Adicionar os itens à roleta
    finalItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = `roulette-item flex-shrink-0 w-32 h-32 relative p-2 m-1 border-2 ${getRarityBorderClass(item.rarity)}`;
      itemElement.dataset.id = item.id;
      
      // Imagem do item
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'relative h-24 flex items-center justify-center';
      
      // Sempre prioriza o CDN com base no shortname
      if (item.shortname) {
        const img = document.createElement('img');
        img.src = getItemImageUrl(item.shortname);
        img.alt = item.name;
        img.className = 'max-h-full max-w-full object-contain drop-shadow-lg';
        
        // Handler para erro de carregamento de imagem
        img.onerror = () => {
          if (item.image_url) {
            img.src = item.image_url;
            
            img.onerror = () => {
              img.style.display = 'none';
              displayPlaceholder(imageWrapper);
            };
          } else {
            img.style.display = 'none';
            displayPlaceholder(imageWrapper);
          }
        };
        
        imageWrapper.appendChild(img);
      } else if (item.image_url) {
        const img = document.createElement('img');
        img.src = item.image_url;
        img.alt = item.name;
        img.className = 'max-h-full max-w-full object-contain drop-shadow-lg';
        
        img.onerror = () => {
          img.style.display = 'none';
          displayPlaceholder(imageWrapper);
        };
        
        imageWrapper.appendChild(img);
      } else {
        displayPlaceholder(imageWrapper);
      }
      
      itemElement.appendChild(imageWrapper);
      
      // Nome do item
      const nameElement = document.createElement('div');
      nameElement.className = 'text-white text-center font-medium text-xs truncate';
      nameElement.textContent = item.name;
      itemElement.appendChild(nameElement);
      
      rouletteItemsRef.current.appendChild(itemElement);
    });
  };
  
  // Função para exibir o placeholder SVG
  const displayPlaceholder = (container) => {
    const placeholder = document.createElement('div');
    placeholder.className = 'text-4xl text-gray-600 h-full w-full flex items-center justify-center';
    placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M3 2.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1 5 0v.006c0 .07 0 .27-.038.494H15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 14.5V7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h2.038A2.968 2.968 0 0 1 3 2.506V2.5zm1.068.5H7v-.5a1.5 1.5 0 1 0-3 0c0 .085.002.274.045.43a.522.522 0 0 0 .023.07zM9 3h2.932a.56.56 0 0 0 .023-.07c.043-.156.045-.345.045-.43a1.5 1.5 0 0 0-3 0V3zM1 4v2h6V4H1zm8 0v2h6V4H9zm5 3H9v8h4.5a.5.5 0 0 0 .5-.5V7zm-7 8V7H2v7.5a.5.5 0 0 0 .5.5H7z"></path></svg>';
    container.appendChild(placeholder);
  };
  
  // Iniciar animação de roleta
  const startRouletteAnimation = () => {
    if (!rouletteItemsRef.current) return;
    
    // Resetar posição
    rouletteItemsRef.current.style.transition = 'none';
    rouletteItemsRef.current.style.transform = 'translateX(0)';
    
    // Forçar reflow para garantir que a transição funcione
    rouletteItemsRef.current.offsetHeight;
    
    // Calcular quantidade de rolagem para uma experiência mais longa
    const itemWidth = 134; // Largura do item + margem
    const totalItems = items.length * 5; // Multiplicamos pelo número de repetições
    const randomOffset = Math.floor(Math.random() * itemWidth);
    const scrollDistance = totalItems * itemWidth - randomOffset;
    
    // Iniciar animação com uma curva de bezier mais natural
    rouletteItemsRef.current.style.transition = 'transform 6s cubic-bezier(0.15, 0.85, 0.25, 1.0)';
    rouletteItemsRef.current.style.transform = `translateX(-${scrollDistance}px)`;
  };
  
  // Parar a animação no item ganho
  const stopRouletteAnimation = (wonItem) => {
    if (!rouletteItemsRef.current || !wonItem) return;
    
    // Encontrar todos os elementos com o ID do item ganho
    const itemElements = rouletteItemsRef.current.querySelectorAll(`[data-id="${wonItem.id}"]`);
    
    if (itemElements.length > 0) {
      // Escolher um elemento aleatório para parar (para variar a posição)
      const randomIndex = Math.floor(Math.random() * Math.min(itemElements.length - 3, 10)) + 3;
      const targetElement = itemElements[randomIndex];
      
      // Obter a posição do elemento
      const rect = targetElement.getBoundingClientRect();
      const rouletteRect = rouletteRef.current.getBoundingClientRect();
      
      // Calcular a posição para centralizar o item
      const offset = rect.left - rouletteRect.left - (rouletteRect.width / 2) + (rect.width / 2);
      
      // Aplicar a animação final
      rouletteItemsRef.current.style.transition = 'transform 1s cubic-bezier(0.1, 0.8, 0.2, 1)';
      rouletteItemsRef.current.style.transform = `translateX(-${offset}px)`;
      
      // Adicionar efeito de destaque ao item ganho
      setTimeout(() => {
        if (targetElement) {
          targetElement.style.transform = 'scale(1.1)';
          targetElement.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
          targetElement.style.transition = 'all 0.5s ease';
          targetElement.style.zIndex = '10';
        }
      }, 1000);
    }
  };
  
  // Resgatar o item ganho
  const handleClaimItem = async () => {
    if (!result || claiming || claimed || !selectedServer) return;
    
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
          steamId: session.user.steamId,
          serverId: selectedServer,
          sessionId: sessionId.current,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setClaimed(true);
        toast.success('Item resgatado com sucesso!');
        
        // Atualizar nextOpeningTime se fornecido na resposta
        if (data.nextOpening) {
          setNextOpeningTime(new Date(data.nextOpening));
          updateTimeLeft(new Date(data.nextOpening));
        }
      } else {
        setError(data.message || 'Erro ao resgatar item');
        toast.error(data.message || 'Não foi possível resgatar o item');
      }
    } catch (err) {
      console.error('Erro ao resgatar item:', err);
      setError('Erro ao conectar ao servidor');
      toast.error('Erro de conexão ao servidor');
    } finally {
      setClaiming(false);
    }
  };
  
  // Obter classe de raridade para borda
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
  
  // Obter classe de background de raridade 
  const getRarityBackgroundClass = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case 'common': return 'from-gray-800 to-gray-900';
      case 'uncommon': return 'from-blue-900 to-dark-900';
      case 'rare': return 'from-teal-900 to-dark-900';
      case 'epic': return 'from-purple-900 to-dark-900';
      case 'legendary': return 'from-yellow-900 to-dark-900';
      default: return 'from-gray-800 to-gray-900';
    }
  };
  
  // Componente para exibição do resultado
  const ItemWonView = () => {
    if (!result || !result.item) return null;
    
    const item = result.item;
    const rarity = item.rarity ? item.rarity.toLowerCase() : 'common';
    
    // SVG placeholder para itens sem imagem
    const placeholderSvg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZjNzU4MCI+PHBhdGggZD0iTTMgMi41YTIuNSAyLjUgMCAwIDEgNSAwIDIuNSAyLjUgMCAwIDEgNSAwdi4wMDZjMCAuMDcgMCAuMjctLjAzOC40OTRIMTVhMSAxIDAgMCAxIDEgMXYyYTEgMSAwIDAgMS0xIDF2Ny41YTEuNSAxLjUgMCAwIDEtMS41IDEuNWgtMTFBMS41IDEuNSAwIDAgMSAxIDE0LjVWN2ExIDEgMCAwIDEtMS0xVjRhMSAxIDAgMCAxIDEtMWgyLjAzOEEyLjk2OCAyLjk2OCAwIDAgMSAzIDIuNTA2VjIuNXptMS4wNjguNUg3di0uNWExLjUgMS41IDAgMSAwLTMgMGMwIC4wODUuMDAyLjI3NC4wNDUuNDNhLjUyMi41MjIgMCAwIDAgLjAyMy4wN3pNOSAzaDIuOTMyYS41Ni41NiAwIDAgMCAuMDIzLS4wN2MuMDQzLS4xNTYuMDQ1LS4zNDUuMDQ1LS40M2ExLjUgMS41IDAgMCAwLTMgMFYzek0xIDR2Mmg2VjRIMXptOCAwdjJoNlY0SDl6bTUgM0g5djhoNC41YS41LjUgMCAwIDAgLjUtLjVWN3ptLTcgOFY3SDJ2Ny41YS41LjUgMCAwIDAgLjUuNUg3eiI+PC9wYXRoPjwvc3ZnPg==';
    
    // Determinar a URL da imagem do item - prioriza CDN
    const getImageSource = () => {
      if (item.shortname) return getItemImageUrl(item.shortname);
      if (item.image_url) return item.image_url;
      return placeholderSvg;
    };
    
    return (
      <div className="text-center mt-8 mb-12">
        <div className="bg-dark-800 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Parabéns!</h2>
          
          <div className={`relative mx-auto w-48 h-48 flex items-center justify-center p-4 rounded-lg border-2 ${getRarityBorderClass(rarity)} bg-gradient-to-b ${getRarityBackgroundClass(rarity)}`}>
            <img 
              src={getImageSource()}
              alt={item.name}
              className="max-w-full max-h-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
              onError={(e) => {
                // Tenta a URL de imagem se o CDN falhar
                if (item.shortname && item.image_url && e.target.src !== item.image_url) {
                  e.target.src = item.image_url;
                } else {
                  // Se tudo falhar, usa o placeholder SVG
                  e.target.src = placeholderSvg;
                }
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
              
              {timeLeft && (
                <div className="flex items-center mt-4 md:mt-0 bg-dark-800 px-4 py-2 rounded-lg border border-dark-600">
                  <FaClock className="text-yellow-500 mr-2" />
                  <div>
                    <div className="text-xs text-gray-400">Próxima chance em</div>
                    <div className="text-white font-mono">{timeLeft}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          {error ? (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8 text-white flex items-center">
              <FaSadTear className="mr-3 text-xl" />
              <p>{error}</p>
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
                      <p className="text-gray-400 mb-6">{caseData?.description}</p>
                      
                      {/* Roleta de itens - Estilo semelhante ao CSGOSKINS */}
                      <div className="relative w-full h-36 overflow-hidden bg-dark-800 rounded-lg mb-8 border-t border-b border-dark-600" ref={rouletteRef}>
                        {/* Indicador central */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary z-10"></div>
                        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-dark-900 to-transparent z-10"></div>
                        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-dark-900 to-transparent z-10"></div>
                        
                        {/* Triângulo indicador */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 -top-3 z-20">
                          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[12px] border-transparent border-t-primary"></div>
                        </div>
                        
                        {/* Itens da roleta */}
                        <div 
                          className="flex items-center p-2 transition-transform" 
                          ref={rouletteItemsRef}
                          style={{ transform: 'translateX(0px)' }}
                        >
                          {/* Aqui serão inseridos os itens da roleta dinamicamente */}
                        </div>
                      </div>
                      
                      {/* Botão de abrir */}
                      <Button
                        onClick={handleOpenCase}
                        disabled={opening || !!timeLeft}
                        className={`px-8 py-3 ${timeLeft ? 'bg-gray-700 cursor-not-allowed' : ''}`}
                        variant="gradient"
                      >
                        {opening ? (
                          <>
                            <LoadingSpinner size="small" className="mr-2" />
                            Abrindo...
                          </>
                        ) : timeLeft ? (
                          <>
                            <FaClock className="mr-2" />
                            Aguarde {timeLeft}
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
                    <div className="mt-12 bg-dark-800 rounded-lg p-6">
                      <h2 className="text-xl font-bold text-white mb-4 text-center">Conteúdo da caixa</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {items.map((item) => (
                          <div 
                            key={item.id} 
                            className={`rounded-lg overflow-hidden border ${getRarityBorderClass(item.rarity)}`}
                          >
                            <div className={`p-2 bg-gradient-to-b ${getRarityBackgroundClass(item.rarity)}`}>
                              <div className="relative h-24 flex items-center justify-center mb-2">
                                <img 
                                  src={item.shortname ? getItemImageUrl(item.shortname) : (item.image_url || placeholderSvg)}
                                  alt={item.name}
                                  className="max-h-full max-w-full object-contain drop-shadow-lg"
                                  onError={(e) => {
                                    if (item.shortname && item.image_url && e.target.src !== item.image_url) {
                                      e.target.src = item.image_url;
                                    } else {
                                      e.target.src = placeholderSvg;
                                    }
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {items.filter(i => i.id !== result.item.id).map((item) => (
                        <div 
                          key={item.id} 
                          className={`rounded-lg overflow-hidden border ${getRarityBorderClass(item.rarity)}`}
                        >
                          <div className={`p-2 bg-gradient-to-b ${getRarityBackgroundClass(item.rarity)}`}>
                            <div className="relative h-24 flex items-center justify-center mb-2">
                              <img 
                                src={item.shortname ? getItemImageUrl(item.shortname) : (item.image_url || placeholderSvg)}
                                alt={item.name}
                                className="max-h-full max-w-full object-contain drop-shadow-lg"
                                onError={(e) => {
                                  if (item.shortname && item.image_url && e.target.src !== item.image_url) {
                                    e.target.src = item.image_url;
                                  } else {
                                    e.target.src = placeholderSvg;
                                  }
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