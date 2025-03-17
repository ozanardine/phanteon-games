import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaChevronLeft, FaGift, FaGamepad, FaCheckCircle, FaSadTear, FaServer } from 'react-icons/fa';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { getItemImageUrl, getRarityClass } from '../../../utils/formatters';

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
  
  // Refs para a animação
  const rouletteRef = useRef(null);
  const rouletteItemsRef = useRef(null);
  
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
  
  // Verificar autenticação
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-300">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-300 px-4">
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
    if (opening || result) return;
    
    try {
      setOpening(true);
      
      // Preparar itens para a roleta (duplicar para criar efeito visual)
      prepareRouletteItems();
      
      // Iniciar animação de roleta
      startRouletteAnimation();
      
      // Chamar API para abrir a caixa
      const response = await fetch('/api/cases/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          caseId: caseId,
          steamId: session.user.steamId
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Continuar a animação por um tempo para criar suspense
        setTimeout(() => {
          // Parar a animação no item ganho
          stopRouletteAnimation(data.item);
          setResult(data);
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
    
    // Criar array de itens para a roleta (duplicar para criar efeito visual)
    const rouletteItems = [...items, ...items, ...items, ...items];
    
    // Adicionar os itens à roleta
    rouletteItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = `roulette-item flex-shrink-0 w-36 h-36 relative p-2 ${getRarityClass(item.rarity)}`;
      itemElement.dataset.id = item.id;
      
      // Imagem do item
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'relative h-28 flex items-center justify-center';
      
      const img = document.createElement('img');
      
      // Primeiro tenta usar a URL da imagem do item, se disponível
      // Se não, usa o shortname para buscar do CDN
      if (item.image_url) {
        img.src = item.image_url;
      } else if (item.shortname) {
        img.src = getItemImageUrl(item.shortname);
      } else {
        // Fallback para ícone genérico
        const placeholder = document.createElement('div');
        placeholder.className = 'text-4xl text-gray-600';
        placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M21,12c0,1.1-0.9,2-2,2h-3l-2.29,2.29c-0.39,0.39-1.02,0.39-1.41,0L10,14H7c-1.1,0-2-0.9-2-2V5c0-1.1,0.9-2,2-2h12c1.1,0,2,0.9,2,2V12z M7,12h3.83l1.88,1.88c0.39,0.39,1.02,0.39,1.41,0L16,12h3V5H7V12z M3,20h10c0.55,0,1-0.45,1-1v-1H3c-0.55,0-1-0.45-1-1v-7.59c-0.57,0.19-1,0.74-1,1.39v7.4C1,19.1,1.9,20,3,20z"></path></svg>';
        imageWrapper.appendChild(placeholder);
        itemElement.appendChild(imageWrapper);
        
        // Nome do item
        const nameElement = document.createElement('div');
        nameElement.className = 'text-white text-center font-medium text-sm truncate';
        nameElement.textContent = item.name;
        itemElement.appendChild(nameElement);
        
        rouletteItemsRef.current.appendChild(itemElement);
        return;
      }
      
      img.alt = item.name;
      img.className = 'max-h-full max-w-full object-contain';
      
      // Handler para erro de carregamento de imagem
      img.onerror = () => {
        img.onerror = null; // Evitar loop infinito
        
        // Se a imagem original falhar e houver um shortname, tenta buscar do CDN
        if (item.image_url && item.shortname) {
          img.src = getItemImageUrl(item.shortname);
        } else {
          // Se todas as tentativas falharem, use o placeholder
          img.style.display = 'none';
          const placeholder = document.createElement('div');
          placeholder.className = 'text-4xl text-gray-600';
          placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M21,12c0,1.1-0.9,2-2,2h-3l-2.29,2.29c-0.39,0.39-1.02,0.39-1.41,0L10,14H7c-1.1,0-2-0.9-2-2V5c0-1.1,0.9-2,2-2h12c1.1,0,2,0.9,2,2V12z M7,12h3.83l1.88,1.88c0.39,0.39,1.02,0.39,1.41,0L16,12h3V5H7V12z M3,20h10c0.55,0,1-0.45,1-1v-1H3c-0.55,0-1-0.45-1-1v-7.59c-0.57,0.19-1,0.74-1,1.39v7.4C1,19.1,1.9,20,3,20z"></path></svg>';
          imageWrapper.appendChild(placeholder);
        }
      };
      
      imageWrapper.appendChild(img);
      itemElement.appendChild(imageWrapper);
      
      // Nome do item
      const nameElement = document.createElement('div');
      nameElement.className = 'text-white text-center font-medium text-sm truncate';
      nameElement.textContent = item.name;
      itemElement.appendChild(nameElement);
      
      rouletteItemsRef.current.appendChild(itemElement);
    });
  };
  
  // Iniciar animação de roleta
  const startRouletteAnimation = () => {
    if (!rouletteItemsRef.current) return;
    
    // Resetar posição
    rouletteItemsRef.current.style.transition = 'none';
    rouletteItemsRef.current.style.transform = 'translateX(0)';
    
    // Força reflow para garantir que a transição funcione
    rouletteItemsRef.current.offsetHeight;
    
    // Iniciar animação
    rouletteItemsRef.current.style.transition = 'transform 4s cubic-bezier(0.1, 0.7, 0.2, 1)';
    rouletteItemsRef.current.style.transform = `translateX(-${items.length * 144 + Math.random() * 144}px)`;
  };
  
  // Parar a animação no item ganho
  const stopRouletteAnimation = (wonItem) => {
    if (!rouletteItemsRef.current || !wonItem) return;
    
    // Encontrar todos os elementos com o ID do item ganho
    const itemElements = rouletteItemsRef.current.querySelectorAll(`[data-id="${wonItem.id}"]`);
    
    if (itemElements.length > 0) {
      // Escolher um elemento aleatório para parar (para variar a posição)
      const randomIndex = Math.floor(Math.random() * Math.min(itemElements.length, 3)) + 1;
      const targetElement = itemElements[randomIndex];
      
      // Obter a posição do elemento
      const rect = targetElement.getBoundingClientRect();
      const rouletteRect = rouletteRef.current.getBoundingClientRect();
      
      // Calcular a posição para centralizar o item
      const offset = rect.left - rouletteRect.left - (rouletteRect.width / 2) + (rect.width / 2);
      
      // Aplicar a animação final
      rouletteItemsRef.current.style.transition = 'transform 1s ease-out';
      rouletteItemsRef.current.style.transform = `translateX(-${offset}px)`;
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
        },
        body: JSON.stringify({
          openingId: result.opening.id,
          steamId: session.user.steamId,
          serverId: selectedServer
        }),
      });
      
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
      setError('Erro ao conectar ao servidor');
      toast.error('Erro de conexão ao servidor');
    } finally {
      setClaiming(false);
    }
  };
  
  // Obter classe de raridade para estilização
  const getRarityClass = (rarity) => {
    switch (rarity) {
      case 'common': return 'bg-gray-800 border border-gray-600';
      case 'uncommon': return 'bg-blue-900/50 border border-blue-500';
      case 'rare': return 'bg-purple-900/50 border border-purple-500';
      case 'epic': return 'bg-pink-900/50 border border-pink-500';
      case 'legendary': return 'bg-yellow-900/50 border border-yellow-500';
      default: return 'bg-gray-800 border border-gray-600';
    }
  };
  
  // Obtendo nome da raridade
  const getRarityName = (rarity) => {
    switch (rarity) {
      case 'common': return 'Comum';
      case 'uncommon': return 'Incomum';
      case 'rare': return 'Raro';
      case 'epic': return 'Épico';
      case 'legendary': return 'Lendário';
      default: return 'Desconhecido';
    }
  };
  
  // Quando o usuário ganhou um item
  const ItemWonView = () => {
    if (!result || !result.item) return null;
    
    const item = result.item;
    const rarity = item.rarity ? item.rarity.toLowerCase() : 'common';
    
    // Determinar a URL da imagem do item
    const getImageSource = () => {
      if (item.image_url) return item.image_url;
      if (item.shortname) return getItemImageUrl(item.shortname);
      return '/images/items/placeholder.png';
    };
    
    return (
      <div className="text-center mt-8 mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Parabéns! Você ganhou:</h2>
        
        <div className={`relative mx-auto w-48 h-48 flex items-center justify-center p-4 rounded-lg border-2 ${getRarityClass(rarity)}`}>
          <img 
            src={getImageSource()}
            alt={item.name}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              // Se a imagem original falhar e houver um shortname, tenta o CDN
              if (item.image_url && item.shortname && e.target.src !== getItemImageUrl(item.shortname)) {
                e.target.src = getItemImageUrl(item.shortname);
              } else {
                // Fallback para placeholder se tudo falhar
                e.target.src = '/images/items/placeholder.png';
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
              rarity === 'uncommon' ? 'bg-green-600/30 text-green-300' :
              rarity === 'rare' ? 'bg-blue-600/30 text-blue-300' :
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
                  className="w-full bg-dark-400 border border-dark-200 rounded-md px-4 py-2 text-white"
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
              className="px-8 py-3"
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
      
      <div className="min-h-screen bg-dark-300 pb-12">
        {/* Header */}
        <div className="bg-dark-400 py-6">
          <div className="container mx-auto px-4">
            <Link href={`/caixas/${game}`} className="flex items-center text-gray-400 hover:text-primary mb-4 transition">
              <FaChevronLeft className="mr-2" /> Voltar
            </Link>
            <h1 className="text-3xl font-bold text-white">{caseData?.name || 'Abrir Caixa'}</h1>
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
                  <div className="max-w-2xl mx-auto">
                    {/* Informação da caixa */}
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-white mb-4">
                        Abra esta caixa para ganhar um dos seguintes itens:
                      </h2>
                      <p className="text-gray-400 mb-6">{caseData?.description}</p>
                      
                      {/* Roleta de itens */}
                      <div className="relative w-full h-36 overflow-hidden bg-dark-400 rounded-lg mb-8" ref={rouletteRef}>
                        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-primary z-10"></div>
                        <div className="flex items-center p-0 transition-transform duration-500 ease-in-out" 
                          ref={rouletteItemsRef}
                          style={{ transform: 'translateX(0px)' }}
                        >
                          {/* Aqui serão inseridos os itens da roleta dinamicamente */}
                        </div>
                      </div>
                      
                      {/* Botão de abrir */}
                      <Button
                        onClick={handleOpenCase}
                        disabled={opening}
                        className="px-8 py-3"
                      >
                        {opening ? (
                          <>
                            <LoadingSpinner size="small" className="mr-2" />
                            Abrindo...
                          </>
                        ) : (
                          <>
                            <FaGift className="mr-2" />
                            Abrir Caixa
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <ItemWonView />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default OpenCase; 