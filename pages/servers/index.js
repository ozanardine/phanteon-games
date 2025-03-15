import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { FiServer, FiShield, FiCrosshair, FiRefreshCw, FiSearch, FiUsers, FiInfo } from 'react-icons/fi';
import { SiRust } from 'react-icons/si';
import { TabSelector } from '../../components/ui/TabSelector';
import { ServerCard } from '../../components/servers/ServerCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function ServersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [communityStats, setCommunityStats] = useState({
    registeredPlayers: 0,
    activeServers: 0,
    completedEvents: 0,
    vipSubscriptions: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  const tabs = [
    { id: 'all', label: 'Todos', icon: <FiServer /> },
    { 
      id: 'rust', 
      label: 'Rust', 
      icon: <div className="w-4 h-4 flex items-center justify-center">
              <SiRust className="text-primary" />
            </div> 
    },
  ];

  const fetchServers = async () => {
    try {
      setIsLoading(true);
      const endpoint = activeTab === 'all' 
        ? '/api/servers' 
        : `/api/servers?game=${activeTab}`;
      
      const response = await fetch(`${endpoint}${refreshing ? `&t=${Date.now()}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Verificar se o retorno é uma array
      if (!Array.isArray(data)) {
        console.warn('Resposta da API não é um array:', data);
        setServers(data.servers || []);
      } else {
        setServers(data);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching server data:', err);
      setError(err.message || 'Falha ao buscar dados dos servidores');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCommunityStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/community-stats');
      
      if (!response.ok) {
        console.error(`Erro ao buscar estatísticas da comunidade (${response.status}): ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      setCommunityStats(data);
    } catch (err) {
      console.error('Error fetching community stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    fetchCommunityStats();
    
    // Set up auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchServers();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServers();
  };
  
  // Filter servers based on search query
  const filteredServers = searchQuery
    ? servers.filter(server => 
        server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : servers;

  return (
    <>
      <Head>
        <title>Servidores | Phanteon Games</title>
        <meta name="description" content="Servidores da comunidade Phanteon Games. Confira o status, informações e estatísticas de cada servidor." />
      </Head>

      <main className="min-h-screen bg-dark-400">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 bg-dark-300">
          <div className="absolute inset-0 bg-[url('/images/rust_banner3.png')] bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-dark-400/90 via-dark-300/90 to-dark-300"></div>
          
          <div className="container-custom mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Nossos <span className="text-primary">Servidores</span>
              </h1>
              <p className="text-gray-300 md:text-lg mb-8">
                Confira o status e informações dos servidores oficiais da Phanteon Games.
                Junte-se à nossa comunidade e desfrute da melhor experiência de jogo.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  href="/planos"
                  className="group"
                  icon={<FiShield />}
                >
                  Ver Planos VIP
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  href="https://discord.gg/v8575VMgPW"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<FiUsers />}
                >
                  Comunidade
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Servers List Section */}
        <section className="py-12 bg-dark-400">
          <div className="container-custom mx-auto px-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
              <TabSelector
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                className="min-w-[300px]"
              />
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-grow md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="bg-dark-300 border border-dark-200 text-white w-full pl-10 pr-3 py-2 rounded-md focus:outline-none focus:border-primary"
                    placeholder="Buscar servidor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing || isLoading}
                  icon={<FiRefreshCw className={refreshing ? "animate-spin" : ""} />}
                >
                  {refreshing ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            </div>

            {/* Server Status Cards */}
            {isLoading && !refreshing ? (
              <div className="flex justify-center items-center py-16">
                <LoadingSpinner size="lg" color="primary" fullScreen={false} text="Carregando servidores..." />
              </div>
            ) : error ? (
              <Card variant="darker" padding="large" className="border-red-500/20">
                <div className="text-center">
                  <h3 className="text-red-400 font-semibold mb-2">Erro ao carregar servidores</h3>
                  <p className="text-gray-300 mb-4">
                    {error}
                  </p>
                  <Button 
                    onClick={handleRefresh}
                    variant="danger"
                    icon={<FiRefreshCw />}
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </Card>
            ) : filteredServers.length === 0 ? (
              <Card variant="darker" padding="large">
                <div className="text-center">
                  <FiServer className="mx-auto text-4xl text-primary mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Nenhum servidor encontrado
                  </h3>
                  <p className="text-gray-300">
                    {searchQuery
                      ? `Nenhum servidor encontrado para "${searchQuery}". Tente outra busca.`
                      : (activeTab === 'all'
                        ? 'Não há servidores ativos no momento.'
                        : `Não há servidores de ${activeTab} ativos no momento.`)}
                  </p>
                </div>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServers.map((server) => (
                    <ServerCard
                      key={server.id}
                      id={server.id}
                      name={server.name}
                      game={server.game}
                      status={server.status}
                      players={server.players}
                      maxPlayers={server.maxPlayers}
                      map={server.map}
                      seed={server.seed}
                      worldSize={server.worldSize}
                      lastWipe={server.lastWipe}
                      address={server.address}
                      description={server.description}
                      logo={server.logo}
                      wipeSchedule={server.wipeSchedule}
                    />
                  ))}
                </div>
                
                {searchQuery && filteredServers.length < servers.length && (
                  <div className="mt-6 text-center text-gray-400">
                    Mostrando {filteredServers.length} de {servers.length} servidores
                  </div>
                )}
              </>
            )}
          </div>
        </section>
        
        {/* Community Stats Section */}
        <section className="py-16 bg-gradient-to-b from-dark-300 to-dark-400">
          <div className="container-custom mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Comunidade <span className="text-primary">Phanteon Games</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Somos uma comunidade ativa e em constante crescimento. Confira alguns números da nossa comunidade.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center p-6 border border-dark-200 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <div className="bg-primary/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FiUsers className="text-primary text-2xl" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  {statsLoading ? (
                    <span className="text-gray-500">...</span>
                  ) : (
                    communityStats.registeredPlayers
                  )}
                </h3>
                <p className="text-gray-400">Jogadores Registrados</p>
              </Card>
              
              <Card className="text-center p-6 border border-dark-200 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <div className="bg-primary/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FiServer className="text-primary text-2xl" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  {statsLoading ? (
                    <span className="text-gray-500">...</span>
                  ) : (
                    communityStats.activeServers
                  )}
                </h3>
                <p className="text-gray-400">Servidores Ativos</p>
              </Card>
              
              <Card className="text-center p-6 border border-dark-200 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <div className="bg-primary/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FiCrosshair className="text-primary text-2xl" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  {statsLoading ? (
                    <span className="text-gray-500">...</span>
                  ) : (
                    communityStats.completedEvents
                  )}
                </h3>
                <p className="text-gray-400">Eventos Realizados</p>
              </Card>
              
              <Card className="text-center p-6 border border-dark-200 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <div className="bg-primary/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FiShield className="text-primary text-2xl" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  {statsLoading ? (
                    <span className="text-gray-500">...</span>
                  ) : (
                    communityStats.vipSubscriptions
                  )}
                </h3>
                <p className="text-gray-400">Assinaturas VIP</p>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-dark-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/rust_banner3.png')] bg-cover bg-center opacity-5"></div>
          
          <div className="container-custom mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto bg-dark-400/80 p-10 rounded-2xl border border-primary/20 backdrop-blur-sm">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Pronto para se juntar a nós?
                </h2>
                <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                  Escolha seu servidor e comece a jogar agora mesmo. Adquira VIP para uma experiência ainda melhor!
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    variant="primary"
                    size="lg"
                    href="/planos"
                    icon={<FiShield />}
                  >
                    Ver Planos VIP
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    href="https://discord.gg/v8575VMgPW"
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={<FiUsers />}
                  >
                    Entrar no Discord
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}