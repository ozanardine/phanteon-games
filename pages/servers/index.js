import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiServer, FiShield, FiCrosshair, FiMoon, FiMonitor, FiRefreshCw } from 'react-icons/fi';
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

  const tabs = [
    { id: 'all', label: 'Todos', icon: <FiServer /> },
    { id: 'rust', label: 'Rust', icon: <SiRust /> },
    // Adicione mais abas conforme necessário para outros jogos
    // { id: 'minecraft', label: 'Minecraft', icon: <FiCube /> },
    // { id: 'csgo', label: 'CS:GO', icon: <FiCrosshair /> },
  ];

  const fetchServers = async () => {
    try {
      setIsLoading(true);
      const endpoint = activeTab === 'all' 
        ? '/api/servers' 
        : `/api/servers?game=${activeTab}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch server data');
      }
      
      const data = await response.json();
      setServers(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching server data:', err);
      setError(err.message || 'Failed to fetch server data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServers();
    
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

  return (
    <>
      <Head>
        <title>Servidores | Phanteon Games</title>
        <meta name="description" content="Servidores da comunidade Phanteon Games. Confira o status, informações e estatísticas de cada servidor." />
      </Head>

      <main className="container-custom py-12">
        <div className="mb-8">
          <h1 className="page-title">Nossos Servidores</h1>
          <p className="page-subtitle">
            Confira o status e informações dos servidores oficiais da Phanteon Games.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <TabSelector
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          
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

        {isLoading && !refreshing ? (
          <div className="py-20">
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
        ) : servers.length === 0 ? (
          <Card variant="darker" padding="large">
            <div className="text-center">
              <FiServer className="mx-auto text-4xl text-primary mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum servidor encontrado
              </h3>
              <p className="text-gray-300">
                {activeTab === 'all'
                  ? 'Não há servidores ativos no momento.'
                  : `Não há servidores de ${activeTab} ativos no momento.`}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
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
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
