import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiUsers, FiServer, FiMap, FiCalendar, FiHash, FiMaximize2, FiChevronLeft, 
         FiClock, FiSkull, FiShield, FiTarget, FiCrosshair, FiRefreshCw } from 'react-icons/fi';
import { TabSelector } from '../../components/ui/TabSelector';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RustMapPreview from '../../components/servers/RustMapPreview';
import Leaderboard from '../../components/servers/Leaderboard';

export default function ServerDetailPage() {
  const router = useRouter();
  const { id, tab: initialTab } = router.query;
  
  const [activeTab, setActiveTab] = useState(initialTab || 'info');
  const [serverData, setServerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mapPreviewLoading, setMapPreviewLoading] = useState(false);
  const [mapPreviewUrl, setMapPreviewUrl] = useState(null);
  const [mapPreviewError, setMapPreviewError] = useState(null);

  const tabs = [
    { id: 'info', label: 'Informações', icon: <FiServer /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <FiCrosshair /> },
    { id: 'events', label: 'Eventos', icon: <FiCalendar /> },
  ];

  useEffect(() => {
    if (initialTab && tabs.some(t => t.id === initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const fetchServerDetails = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/servers/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch server details');
      }
      
      const data = await response.json();
      setServerData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching server details:', err);
      setError(err.message || 'Failed to fetch server details');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServerDetails();
    
    // Auto refresh a cada 2 minutos
    const interval = setInterval(fetchServerDetails, 120000);
    
    return () => clearInterval(interval);
  }, [id]);

  // Update URL when tab changes without full reload
  useEffect(() => {
    if (activeTab && id) {
      router.push(`/servers/${id}?tab=${activeTab}`, undefined, { shallow: true });
    }
  }, [activeTab, id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServerDetails();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatPlaytime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes % 60}m`;
  };

  if (isLoading && !refreshing) {
    return (
      <div className="container-custom py-12">
        <div className="flex items-center text-gray-400 mb-6">
          <Link href="/servers" legacyBehavior>
            <a className="flex items-center hover:text-primary transition-colors">
              <FiChevronLeft className="mr-1" />
              Voltar para Servidores
            </a>
          </Link>
        </div>
        
        <div className="py-20">
          <LoadingSpinner size="lg" color="primary" fullScreen={false} text="Carregando informações do servidor..." />
        </div>
      </div>
    );
  }

  if (error || !serverData) {
    return (
      <div className="container-custom py-12">
        <div className="flex items-center text-gray-400 mb-6">
          <Link href="/servers" legacyBehavior>
            <a className="flex items-center hover:text-primary transition-colors">
              <FiChevronLeft className="mr-1" />
              Voltar para Servidores
            </a>
          </Link>
        </div>

        <Card variant="darker" padding="large" className="border-red-500/20">
          <div className="text-center">
            <h3 className="text-red-400 font-semibold mb-2">Erro ao carregar servidor</h3>
            <p className="text-gray-300 mb-4">
              {error || 'Não foi possível carregar os detalhes do servidor.'}
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Button 
                onClick={handleRefresh}
                variant="danger"
                icon={<FiRefreshCw />}
              >
                Tentar Novamente
              </Button>
              <Button 
                href="/servers"
                variant="secondary"
              >
                Voltar para Servidores
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const { server, leaderboard = [], events = [] } = serverData;

  return (
    <>
      <Head>
        <title>{server.name} | Phanteon Games</title>
        <meta name="description" content={`Detalhes e estatísticas do servidor ${server.name} da comunidade Phanteon Games.`} />
      </Head>

      <main className="container-custom py-12">
        {/* Breadcrumb e Título */}
        <div className="mb-8">
          <div className="flex items-center text-gray-400 mb-4">
            <Link href="/servers" legacyBehavior>
              <a className="flex items-center hover:text-primary transition-colors">
                <FiChevronLeft className="mr-1" />
                Voltar para Servidores
              </a>
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              {server.logo && (
                <div className="w-16 h-16 mr-4 rounded-md bg-dark-400 overflow-hidden border border-dark-200">
                  <img 
                    src={server.logo} 
                    alt={`${server.name} logo`} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white">{server.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <Card.Badge 
                    variant={server.status === 'online' ? 'success' : 'danger'}
                  >
                    {server.status === 'online' ? 'Online' : 'Offline'}
                  </Card.Badge>
                  <Card.Badge variant="info" className="capitalize">
                    {server.game}
                  </Card.Badge>
                  <span className="flex items-center text-gray-300">
                    <FiUsers className="inline mr-1" />
                    {server.players}/{server.maxPlayers}
                  </span>
                </div>
              </div>
            </div>
            
            <Button 
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              icon={<FiRefreshCw className={refreshing ? "animate-spin" : ""} />}
            >
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
        </div>

        {/* Barra de progresso de jogadores */}
        <Card variant="darker" className="mb-6 p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center text-gray-300">
              <FiUsers className="mr-2 text-primary" />
              <span>Jogadores Online</span>
            </div>
            <span className="text-white font-medium">
              {server.players}/{server.maxPlayers}
            </span>
          </div>
          <div className="w-full bg-dark-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${getPlayerBarColor(server.players, server.maxPlayers)}`} 
              style={{ width: `${getPlayerPercentage(server.players, server.maxPlayers)}%` }}
            ></div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mb-6">
          <TabSelector
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Tab Panel Container */}
        <Card variant="darker" padding="none">
          {activeTab === 'info' && (
            <div className="p-6">
              {server.description && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Sobre o Servidor</h3>
                  <p className="text-gray-300">{server.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-dark-400 rounded-lg p-4">
                  <div className="flex items-center text-gray-300 mb-2">
                    <FiUsers className="mr-2 text-primary" />
                    <span>Jogadores</span>
                  </div>
                  <p className="text-white font-medium text-lg">
                    {server.players} / {server.maxPlayers}
                  </p>
                </div>
                
                <div className="bg-dark-400 rounded-lg p-4">
                  <div className="flex items-center text-gray-300 mb-2">
                    <FiMap className="mr-2 text-primary" />
                    <span>Mapa</span>
                  </div>
                  <p className="text-white font-medium text-lg">
                    {server.map || 'N/A'}
                  </p>
                </div>
                
                {server.lastWipe && (
                  <div className="bg-dark-400 rounded-lg p-4">
                    <div className="flex items-center text-gray-300 mb-2">
                      <FiCalendar className="mr-2 text-primary" />
                      <span>Último Wipe</span>
                    </div>
                    <p className="text-white font-medium text-lg">
                      {formatDate(server.lastWipe)}
                    </p>
                  </div>
                )}
                
                {server.seed && (
                  <div className="bg-dark-400 rounded-lg p-4">
                    <div className="flex items-center text-gray-300 mb-2">
                      <FiHash className="mr-2 text-primary" />
                      <span>Seed</span>
                    </div>
                    <p className="text-white font-medium text-lg">
                      {server.game === 'rust' ? (
                        <a 
                          href={`https://rustmaps.com/map/${server.seed}/${server.worldSize}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {server.seed}
                        </a>
                      ) : server.seed}
                    </p>
                  </div>
                )}
                
                {server.worldSize && (
                  <div className="bg-dark-400 rounded-lg p-4">
                    <div className="flex items-center text-gray-300 mb-2">
                      <FiMaximize2 className="mr-2 text-primary" />
                      <span>Tamanho</span>
                    </div>
                    <p className="text-white font-medium text-lg">
                      {server.worldSize}
                    </p>
                  </div>
                )}
              </div>

              {/* Preview do Mapa para servidores Rust */}
              {server.game === 'rust' && server.seed && server.worldSize && (
                <div className="mb-6">
                  <RustMapPreview seed={server.seed} worldSize={server.worldSize} />
                </div>
              )}

              <Card variant="dark" className="p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Conectar ao Servidor</h3>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="bg-dark-200 p-3 rounded-md flex-grow font-mono">
                    <code className="text-gray-300">{server.address}</code>
                  </div>
                  {server.game === 'rust' && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        navigator.clipboard.writeText(`client.connect ${server.address}`);
                        alert('Comando copiado para a área de transferência!');
                      }}
                    >
                      Copiar Comando F1
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="p-6">
              <Leaderboard 
                leaderboard={leaderboard} 
                formatPlaytime={formatPlaytime} 
                formatDate={formatDate} 
              />
            </div>
          )}

          {activeTab === 'events' && (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Próximos Eventos</h3>
              
              {!events || events.length === 0 ? (
                <div className="bg-dark-400 rounded-lg p-6 text-center">
                  <p className="text-gray-300">Nenhum evento programado no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map(event => (
                    <Card key={event.id} variant="dark" padding="none" className="overflow-hidden">
                      {event.image && (
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={event.image} 
                            alt={event.title}
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      )}
                      
                      <div className="p-4">
                        <h4 className="text-lg font-semibold text-white mb-1">{event.title}</h4>
                        
                        <div className="flex items-center text-primary mb-3">
                          <FiCalendar className="mr-2" />
                          <span>{formatDateTime(event.date)}</span>
                        </div>
                        
                        <p className="text-gray-300 mb-2">{event.description}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </main>
    </>
  );
}

// Funções auxiliares 
function getPlayerPercentage(players, maxPlayers) {
  return Math.min(Math.round((players / maxPlayers) * 100), 100);
}

function getPlayerBarColor(players, maxPlayers) {
  const percentage = getPlayerPercentage(players, maxPlayers);
  if (percentage < 30) return 'bg-green-500';
  if (percentage < 70) return 'bg-yellow-500';
  return 'bg-red-500';
}
