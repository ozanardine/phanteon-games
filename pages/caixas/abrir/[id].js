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
      
      if (item.image_url) {
        const img = document.createElement('img');
        img.src = item.image_url;
        img.alt = item.name;
        img.className = 'max-h-full max-w-full object-contain';
        imageWrapper.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'text-4xl text-gray-600';
        placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M21,12c0,1.1-0.9,2-2,2h-3l-2.29,2.29c-0.39,0.39-1.02,0.39-1.41,0L10,14H7c-1.1,0-2-0.9-2-2V5c0-1.1,0.9-2,2-2h12c1.1,0,2,0.9,2,2V12z M7,12h3.83l1.88,1.88c0.39,0.39,1.02,0.39,1.41,0L16,12h3V5H7V12z M3,20h10c0.55,0,1-0.45,1-1v-1H3c-0.55,0-1-0.45-1-1v-7.59c-0.57,0.19-1,0.74-1,1.39v7.4C1,19.1,1.9,20,3,20z"></path></svg>';
        imageWrapper.appendChild(placeholder);
      }
      
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
  
  return (
    <>
      <Head>
        <title>
          {caseData ? `Abrindo ${caseData.name}` : 'Abrindo Caixa'} | Phanteon Games
        </title>
        <meta name="description" content="Abra caixas e ganhe itens para usar em nossos servidores." />
      </Head>
      
      <div className="min-h-screen bg-dark-300">
        {/* Cabeçalho */}
        <div className="bg-dark-400 py-4">
          <div className="container mx-auto px-4">
            <Link 
              href={game ? `/caixas/${game}` : "/caixas/rust"} 
              className="flex items-center text-gray-400 hover:text-primary transition"
            >
              <FaChevronLeft className="mr-2" /> 
              Voltar para caixas
            </Link>
          </div>
        </div>
        
        {/* Conteúdo principal */}
        <div className="container mx-auto px-4 py-8">
          {/* Título da caixa */}
          {caseData && (
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">{caseData.name}</h1>
              <p className="text-gray-400">{caseData.description}</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8 mx-auto max-w-2xl text-white">
              <div className="flex items-center">
                <FaSadTear className="mr-3 text-xl" />
                <p>{error}</p>
              </div>
            </div>
          )}
          
          {/* Visualizador de roleta */}
          <div className="bg-dark-400 rounded-lg p-4 mb-8 mx-auto max-w-2xl">
            <div 
              ref={rouletteRef}
              className="w-full h-40 overflow-hidden relative border-2 border-primary rounded-lg"
            >
              {/* Indicador do centro */}
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-primary z-10"></div>
              
              {/* Conteúdo da roleta */}
              <div 
                ref={rouletteItemsRef}
                className="flex items-center h-full absolute left-0 top-0"
              >
                {/* Os itens serão adicionados dinamicamente via JavaScript */}
              </div>
              
              {/* Gradiente para desvanecer as bordas */}
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-dark-400 to-transparent z-10"></div>
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-dark-400 to-transparent z-10"></div>
            </div>
            
            {/* Botão de abrir caixa */}
            {!result && (
              <div className="mt-4 text-center">
                <Button
                  onClick={handleOpenCase}
                  disabled={opening}
                  className="px-8 py-3"
                >
                  {opening ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <>
                      <FaGift className="mr-2" /> Abrir Caixa
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* Resultado da abertura */}
            {result && (
              <div className="mt-6 text-center">
                <h2 className="text-xl font-bold text-white mb-2">
                  Você ganhou:
                </h2>
                
                <div className={`mx-auto w-48 h-48 p-4 flex flex-col items-center justify-center rounded-lg mb-4 ${getRarityClass(result.item.rarity)}`}>
                  {result.item.image_url ? (
                    <div className="relative h-28 w-28 mb-2">
                      <Image
                        src={result.item.image_url}
                        alt={result.item.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <FaGift className="text-5xl text-gray-400 mb-2" />
                  )}
                  
                  <div className="text-white font-bold">{result.item.name}</div>
                  <div className="text-sm text-gray-300">x{result.item.amount}</div>
                  <div className="text-xs mt-1 px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                    {getRarityName(result.item.rarity)}
                  </div>
                </div>
                
                {/* Formulário de resgate */}
                {!claimed && (
                  <div className="mt-4 p-4 bg-dark-500 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Resgatar Item no Servidor
                    </h3>
                    
                    <div className="mb-4">
                      <label className="block text-gray-400 text-sm mb-2">
                        Selecione o servidor:
                      </label>
                      <select
                        value={selectedServer}
                        onChange={(e) => setSelectedServer(e.target.value)}
                        className="w-full p-2 bg-dark-400 border border-dark-200 rounded-lg text-white"
                        disabled={claiming}
                      >
                        {servers.map(server => (
                          <option key={server.id} value={server.id}>
                            {server.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <Button
                      onClick={handleClaimItem}
                      disabled={claiming || !selectedServer}
                      className="w-full py-3"
                    >
                      {claiming ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <>
                          <FaGamepad className="mr-2" /> Resgatar no Jogo
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Mensagem de sucesso */}
                {claimed && (
                  <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center justify-center text-green-400 mb-2">
                      <FaCheckCircle className="mr-2 text-xl" /> 
                      Item Resgatado com Sucesso!
                    </div>
                    <p className="text-gray-300 text-sm">
                      O item foi enviado para o seu inventário no jogo.
                    </p>
                  </div>
                )}
                
                <div className="mt-6">
                  <Link 
                    href={game ? `/caixas/${game}` : "/caixas/rust"}
                    className="text-primary hover:text-primary-light transition"
                  >
                    Voltar para caixas
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Informações de itens possíveis */}
          {!result && (
            <div className="mx-auto max-w-4xl">
              <h2 className="text-xl font-bold text-white mb-4">
                Itens Possíveis de Ganhar:
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map(item => (
                  <div 
                    key={item.id} 
                    className={`p-3 rounded-lg ${getRarityClass(item.rarity)}`}
                  >
                    <div className="relative h-20 flex items-center justify-center mb-2">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="object-contain max-h-full"
                        />
                      ) : (
                        <FaGift className="text-3xl text-gray-600" />
                      )}
                    </div>
                    <div className="text-white text-center text-sm font-medium">{item.name}</div>
                    <div className="text-gray-400 text-center text-xs">
                      {(item.drop_chance * 100).toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OpenCase; 