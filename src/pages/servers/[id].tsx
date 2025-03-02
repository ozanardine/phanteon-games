import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { ServerStatus } from '@/components/ui/ServerStatus';
import { 
  fetchServerDetails, 
  fetchBattleMetricsData, 
  fetchServerPlugins, 
  fetchServerLeaderboard,
  fetchServerEvents,
  fetchOnlinePlayers,
  fetchVipUsers,
  fetchServerTeam,
  BattleMetricsServer
} from '@/utils/serverApi';
import { Server } from '@/types/database.types';
import { formatDateTime, formatDate } from '@/utils/dateUtils';
import { 
  FiUsers, 
  FiServer, 
  FiClock, 
  FiChevronLeft, 
  FiCalendar, 
  FiMap,
  FiCpu,
  FiExternalLink,
  FiCopy
} from 'react-icons/fi';
import { GiSwordman, GiPerson, GiTrophy } from 'react-icons/gi';
import { SiRust } from 'react-icons/si';

// Define props for the page
type ServerPageProps = {
  initialServer: Server | null;
};

// Define tab type for section navigation
type TabType = 'info' | 'players' | 'leaderboard' | 'events' | 'plugins' | 'team';

export default function ServerDetailPage({ initialServer }: ServerPageProps) {
  const router = useRouter();
  const { id } = router.query;
  const serverId = typeof id === 'string' ? id : '';
  
  useEffect(() => {
    // Redirecionar para a lista de servidores se o ID for inválido
    if (router.isReady && (!id || id === 'undefined' || id === 'null')) {
      console.error('ID de servidor inválido:', id);
      router.push('/servers');
    }
  }, [router.isReady, id, router]);

  const [server, setServer] = useState<Server | null>(initialServer);
  const [battlemetricsData, setBattlemetricsData] = useState<BattleMetricsServer | null>(null);
  const [plugins, setPlugins] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([]);
  const [vipUsers, setVipUsers] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [leaderboardType, setLeaderboardType] = useState('kills');
  
  // Fetch all necessary data
  useEffect(() => {
    if (!serverId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // If we don't have server data yet, fetch it
        if (!server) {
          const serverData = await fetchServerDetails(serverId);
          if (!serverData) {
            throw new Error('Servidor não encontrado');
          }
          setServer(serverData);
        }
        
        // Fetch BattleMetrics data (assuming we store BattleMetrics ID in the database)
        // For this example, I'll use the server_id as the BattleMetrics ID
        const battlemetricsId = server?.server_id || serverId;
        const bmData = await fetchBattleMetricsData(battlemetricsId);
        setBattlemetricsData(bmData);
        
        // Fetch additional data based on active tab to avoid unnecessary requests
        if (activeTab === 'plugins') {
          const pluginsData = await fetchServerPlugins(serverId);
          setPlugins(pluginsData);
        } else if (activeTab === 'leaderboard') {
          const leaderboardData = await fetchServerLeaderboard(serverId, leaderboardType);
          setLeaderboard(leaderboardData);
        } else if (activeTab === 'events') {
          const eventsData = await fetchServerEvents(serverId);
          setEvents(eventsData);
        } else if (activeTab === 'players') {
          const playersData = await fetchOnlinePlayers(serverId);
          setOnlinePlayers(playersData);
        } else if (activeTab === 'team') {
          const teamData = await fetchServerTeam(serverId);
          setTeam(teamData);
          
          // Also fetch VIP users for the supporters section
          const vipData = await fetchVipUsers();
          setVipUsers(vipData);
        }
        
      } catch (err: any) {
        console.error('Error fetching server data:', err);
        setError(err.message || 'Erro ao carregar dados do servidor.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [serverId, activeTab, leaderboardType, server]);
  
  // Effect to refresh data at regular intervals
  useEffect(() => {
    if (!serverId || isLoading) return;
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      if (activeTab === 'info' || activeTab === 'players') {
        // Refresh BattleMetrics data and online players
        fetchBattleMetricsData(server?.server_id || serverId)
          .then(data => {
            if (data) setBattlemetricsData(data);
          })
          .catch(err => console.error('Error refreshing BattleMetrics data:', err));
          
        if (activeTab === 'players') {
          fetchOnlinePlayers(serverId)
            .then(data => setOnlinePlayers(data))
            .catch(err => console.error('Error refreshing online players:', err));
        }
      } else if (activeTab === 'events') {
        // Refresh events
        fetchServerEvents(serverId)
          .then(data => setEvents(data))
          .catch(err => console.error('Error refreshing events:', err));
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [serverId, activeTab, isLoading, server]);
  
  const handleCopyAddress = () => {
    if (!server) return;
    navigator.clipboard.writeText(`${server.ip}:${server.port}`);
    alert('Endereço do servidor copiado para a área de transferência!');
  };
  
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };
  
  const handleLeaderboardTypeChange = (type: string) => {
    setLeaderboardType(type);
  };
  
  if (isLoading && !server) {
    return (
      <Layout title="Carregando... | Phanteon Games">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loading size="lg" />
        </div>
      </Layout>
    );
  }
  
  if (error && !server) {
    return (
      <Layout title="Erro | Phanteon Games">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert type="error" className="mb-4">
            {error}
          </Alert>
          <Link href="/servers">
            <Button variant="secondary">
              <FiChevronLeft className="mr-2" />
              Voltar para a lista de servidores
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }
  
  if (!server) {
    return (
      <Layout title="Servidor não encontrado | Phanteon Games">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert type="error" className="mb-4">
            Servidor não encontrado
          </Alert>
          <Link href="/servers">
            <Button variant="secondary">
              <FiChevronLeft className="mr-2" />
              Voltar para a lista de servidores
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }
  
  // Get game icon based on server game
  const GameIcon = server.game.toLowerCase() === 'rust' ? SiRust : FiServer;
  
  return (
    <Layout 
      title={`${server.name} | Phanteon Games`} 
      description={`Servidor de ${server.game} da Phanteon Games`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back button and server title */}
        <div className="mb-6">
          <Link href="/servers">
            <Button variant="ghost" size="sm" className="mb-4">
              <FiChevronLeft className="mr-2" />
              Voltar para a lista de servidores
            </Button>
          </Link>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <GameIcon className="text-phanteon-orange mr-3 text-4xl" />
              <div>
                <h1 className="text-3xl font-bold text-white">{server.name}</h1>
                <div className="flex items-center mt-1">
                  <ServerStatus status={server.status} />
                  <span className="mx-2 text-gray-500">•</span>
                  <span className="text-gray-300">{server.game}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                onClick={handleCopyAddress}
                className="flex items-center"
              >
                <FiCopy className="mr-2" />
                Copiar IP
              </Button>
              
              {/* Connect button (optional, depends on your implementation) */}
              <Button 
                variant="primary"
                className="flex items-center"
                onClick={() => {
                  // Here you could implement a steam:// protocol link for easy connection
                  window.location.href = `steam://connect/${server.ip}:${server.port}`;
                }}
              >
                <FiExternalLink className="mr-2" />
                Conectar
              </Button>
            </div>
          </div>
        </div>
        
        {/* Tab navigation */}
        <div className="mb-6 border-b border-phanteon-light">
          <div className="flex overflow-x-auto">
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'info'
                  ? 'text-phanteon-orange border-phanteon-orange'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
              onClick={() => handleTabChange('info')}
            >
              Informações
            </button>
            
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'players'
                  ? 'text-phanteon-orange border-phanteon-orange'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
              onClick={() => handleTabChange('players')}
            >
              Jogadores
            </button>
            
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'leaderboard'
                  ? 'text-phanteon-orange border-phanteon-orange'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
              onClick={() => handleTabChange('leaderboard')}
            >
              Leaderboard
            </button>
            
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'events'
                  ? 'text-phanteon-orange border-phanteon-orange'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
              onClick={() => handleTabChange('events')}
            >
              Eventos
            </button>
            
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'plugins'
                  ? 'text-phanteon-orange border-phanteon-orange'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
              onClick={() => handleTabChange('plugins')}
            >
              Plugins
            </button>
            
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'team'
                  ? 'text-phanteon-orange border-phanteon-orange'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
              onClick={() => handleTabChange('team')}
            >
              Equipe
            </button>
          </div>
        </div>
        
        {/* Tab content */}
        <div className="pb-8">
          {/* Server Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-8">
              {/* Server stats overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="p-3 rounded-md bg-phanteon-orange/20 mr-4">
                        <FiUsers className="text-phanteon-orange w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Jogadores</p>
                        <p className="text-xl font-bold text-white">
                          {server.players_current} / {server.players_max}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="p-3 rounded-md bg-phanteon-orange/20 mr-4">
                        <FiMap className="text-phanteon-orange w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Mapa</p>
                        <p className="text-xl font-bold text-white">
                          {server.map || battlemetricsData?.attributes.details.map || 'Desconhecido'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="p-3 rounded-md bg-phanteon-orange/20 mr-4">
                        <FiCpu className="text-phanteon-orange w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Tempo Online</p>
                        <p className="text-xl font-bold text-white">
                          {battlemetricsData?.attributes.details.uptime 
                            ? `${Math.floor(battlemetricsData.attributes.details.uptime / 3600)} horas`
                            : 'Desconhecido'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Server details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <h2 className="text-xl font-bold text-white">Detalhes do Servidor</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {server.game.toLowerCase() === 'rust' && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-phanteon-dark p-3 rounded-md">
                              <p className="text-sm text-gray-400 mb-1">Tamanho do Mundo</p>
                              <p className="text-white font-medium">
                                {battlemetricsData?.attributes.details.rust_world_size || server.world_size || 'Padrão'}
                              </p>
                            </div>
                            
                            <div className="bg-phanteon-dark p-3 rounded-md">
                              <p className="text-sm text-gray-400 mb-1">Tipo de Wipe</p>
                              <p className="text-white font-medium">
                                {server.wipe_type === 'map' ? 'Apenas Mapa' : 'Mapa e BP'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-phanteon-dark p-3 rounded-md">
                              <p className="text-sm text-gray-400 mb-1">Último Wipe</p>
                              <p className="text-white font-medium">
                                {server.last_wipe 
                                  ? formatDate(server.last_wipe)
                                  : battlemetricsData?.attributes.details.rust_last_wipe
                                    ? formatDate(battlemetricsData.attributes.details.rust_last_wipe)
                                    : 'Desconhecido'
                                }
                              </p>
                            </div>
                            
                            <div className="bg-phanteon-dark p-3 rounded-md">
                              <p className="text-sm text-gray-400 mb-1">Próximo Wipe</p>
                              <p className="text-white font-medium">
                                {server.next_wipe 
                                  ? formatDate(server.next_wipe)
                                  : battlemetricsData?.attributes.details.rust_next_wipe
                                    ? formatDate(battlemetricsData.attributes.details.rust_next_wipe)
                                    : 'Desconhecido'
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-phanteon-dark p-3 rounded-md">
                              <p className="text-sm text-gray-400 mb-1">FPS do Servidor</p>
                              <p className="text-white font-medium">
                                {battlemetricsData?.attributes.details.fps || 'N/A'}
                              </p>
                            </div>
                            
                            <div className="bg-phanteon-dark p-3 rounded-md">
                              <p className="text-sm text-gray-400 mb-1">Ping</p>
                              <p className="text-white font-medium">
                                {server.ping || 'N/A'} ms
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                      
                      <div className="bg-phanteon-dark p-3 rounded-md">
                        <p className="text-sm text-gray-400 mb-1">Endereço do Servidor</p>
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium">{server.ip}:{server.port}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyAddress}
                          >
                            Copiar
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-phanteon-dark p-3 rounded-md">
                        <p className="text-sm text-gray-400 mb-1">Última Atualização</p>
                        <p className="text-white font-medium">
                          {formatDateTime(server.last_online)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card>
                    <CardHeader>
                      <h2 className="text-xl font-bold text-white">Regras do Servidor</h2>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="bg-phanteon-dark p-3 rounded-md">
                          <p className="text-white font-medium">Sem cheats ou hacks</p>
                        </div>
                        <div className="bg-phanteon-dark p-3 rounded-md">
                          <p className="text-white font-medium">Sem ofensas ou discriminação</p>
                        </div>
                        <div className="bg-phanteon-dark p-3 rounded-md">
                          <p className="text-white font-medium">Sem spam ou flood no chat</p>
                        </div>
                        <div className="bg-phanteon-dark p-3 rounded-md">
                          <p className="text-white font-medium">Respeite outros jogadores</p>
                        </div>
                        
                        <Link href="/rules">
                          <Button variant="outline" fullWidth className="mt-2">
                            Ver Todas as Regras
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="mt-4">
                    <CardHeader>
                      <h2 className="text-xl font-bold text-white">Suporte</h2>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">
                        Está tendo problemas com o servidor ou precisa de ajuda?
                      </p>
                      <Button variant="primary" fullWidth>
                        Contatar Suporte
                      </Button>
                      
                      <div className="mt-4 pt-4 border-t border-phanteon-light">
                        <p className="text-gray-400 text-sm mb-2">Discord da Comunidade</p>
                        <a
                          href="https://discord.gg/phanteongames"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-phanteon-orange hover:underline flex items-center"
                        >
                          discord.gg/phanteongames
                          <FiExternalLink className="ml-2" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
          
          {/* Players Tab */}
          {activeTab === 'players' && (
            <div>
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <Loading size="lg" />
                </div>
              ) : onlinePlayers.length === 0 ? (
                <Alert type="info">
                  Não há jogadores online no momento.
                </Alert>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Jogadores Online</h2>
                        <div className="flex items-center bg-phanteon-dark px-3 py-1 rounded-full">
                          <FiUsers className="text-green-500 mr-2" />
                          <span className="text-white font-medium">{onlinePlayers.length}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left border-b border-phanteon-light">
                              <th className="py-3 px-4 text-gray-400 font-medium">Nome</th>
                              <th className="py-3 px-4 text-gray-400 font-medium">Ping</th>
                              <th className="py-3 px-4 text-gray-400 font-medium">Tempo de Sessão</th>
                              <th className="py-3 px-4 text-gray-400 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {onlinePlayers.map((player) => (
                              <tr key={player.steam_id} className="border-b border-phanteon-light hover:bg-phanteon-light/10">
                                <td className="py-3 px-4 text-white">
                                  <div className="flex items-center">
                                    <GiPerson className="mr-2 text-gray-400" />
                                    {player.name}
                                    {player.is_admin && (
                                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded-full">
                                        ADMIN
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-white">
                                  {player.ping} ms
                                </td>
                                <td className="py-3 px-4 text-white">
                                  {Math.floor(player.session_time / 60)} horas {player.session_time % 60} minutos
                                </td>
                                <td className="py-3 px-4 text-white">
                                  {player.is_alive ? (
                                    <span className="text-green-500">Vivo</span>
                                  ) : (
                                    <span className="text-red-500">Morto</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
          
          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div>
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <Loading size="lg" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={leaderboardType === 'kills' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleLeaderboardTypeChange('kills')}
                    >
                      <GiSwordman className="mr-2" />
                      Kills
                    </Button>
                    
                    <Button
                      variant={leaderboardType === 'deaths' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleLeaderboardTypeChange('deaths')}
                    >
                      Mortes
                    </Button>
                    
                    <Button
                      variant={leaderboardType === 'playtime' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleLeaderboardTypeChange('playtime')}
                    >
                      <FiClock className="mr-2" />
                      Tempo de Jogo
                    </Button>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">
                          Leaderboard de {leaderboardType === 'kills' ? 'Kills' : 
                                        leaderboardType === 'deaths' ? 'Mortes' : 
                                        'Tempo de Jogo'}
                        </h2>
                        <GiTrophy className="text-phanteon-orange text-2xl" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {leaderboard.length === 0 ? (
                        <Alert type="info">
                          Não há dados de leaderboard disponíveis no momento.
                        </Alert>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-left border-b border-phanteon-light">
                                <th className="py-3 px-4 text-gray-400 font-medium">Posição</th>
                                <th className="py-3 px-4 text-gray-400 font-medium">Jogador</th>
                                <th className="py-3 px-4 text-gray-400 font-medium">
                                  {leaderboardType === 'kills' ? 'Kills' : 
                                   leaderboardType === 'deaths' ? 'Mortes' : 
                                   'Horas Jogadas'}
                                </th>
                                {leaderboardType === 'kills' && (
                                  <th className="py-3 px-4 text-gray-400 font-medium">K/D</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {leaderboard.map((entry, index) => (
                                <tr key={entry.id} className="border-b border-phanteon-light hover:bg-phanteon-light/10">
                                  <td className="py-3 px-4 text-white">
                                    <div className="flex items-center">
                                      {index === 0 ? (
                                        <span className="w-6 h-6 flex items-center justify-center bg-yellow-500 text-black font-bold rounded-full">1</span>
                                      ) : index === 1 ? (
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-400 text-black font-bold rounded-full">2</span>
                                      ) : index === 2 ? (
                                        <span className="w-6 h-6 flex items-center justify-center bg-amber-700 text-white font-bold rounded-full">3</span>
                                      ) : (
                                        <span className="w-6 h-6 flex items-center justify-center bg-phanteon-dark text-gray-300 font-medium rounded-full">{index + 1}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-white">
                                    {entry.name}
                                  </td>
                                  <td className="py-3 px-4 text-white font-medium">
                                    {entry.score}
                                  </td>
                                  {leaderboardType === 'kills' && (
                                    <td className="py-3 px-4 text-white">
                                      {entry.secondary_score ? entry.secondary_score.toFixed(2) : 'N/A'}
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
          
          {/* Events Tab */}
          {activeTab === 'events' && (
            <div>
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <Loading size="lg" />
                </div>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <h2 className="text-xl font-bold text-white">Eventos do Servidor</h2>
                    </CardHeader>
                    <CardContent>
                      {events.length === 0 ? (
                        <Alert type="info">
                          Não há eventos para mostrar no momento.
                        </Alert>
                      ) : (
                        <div className="space-y-4">
                          {events.map((event) => (
                            <div 
                              key={event.event_id} 
                              className="bg-phanteon-dark p-4 rounded-lg border border-phanteon-light hover:border-phanteon-orange transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-white font-medium">
                                    {event.type}
                                  </h3>
                                  <p className="text-gray-400 text-sm mt-1">
                                    {event.extra_data && event.extra_data.description 
                                      ? event.extra_data.description 
                                      : `Evento tipo ${event.event_type_rust || event.type}`}
                                  </p>
                                  
                                  {event.position_x && event.position_y && event.position_z && (
                                    <p className="text-sm text-gray-500 mt-2">
                                      Localização: ({Math.round(event.position_x)}, {Math.round(event.position_y)}, {Math.round(event.position_z)})
                                    </p>
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-500">
                                  {formatDateTime(event.updated_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <h2 className="text-xl font-bold text-white">Eventos da Comunidade</h2>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-phanteon-orange/20 p-4 rounded-lg border border-phanteon-orange">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-white font-medium">
                                Torneio de PVP
                              </h3>
                              <p className="text-gray-300 text-sm mt-1">
                                Participe do nosso torneio semanal de PVP com prêmios exclusivos!
                              </p>
                              <p className="text-phanteon-orange text-sm mt-2">
                                Sábado às 20:00
                              </p>
                            </div>
                            
                            <Button variant="outline" size="sm">
                              Inscrever-se
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-phanteon-dark p-4 rounded-lg border border-phanteon-light">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-white font-medium">
                                Wipe do Servidor
                              </h3>
                              <p className="text-gray-300 text-sm mt-1">
                                O próximo wipe acontecerá na próxima semana. Prepare-se!
                              </p>
                              <p className="text-gray-400 text-sm mt-2">
                                Quinta-feira às 16:00
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
          
          {/* Plugins Tab */}
          {activeTab === 'plugins' && (
            <div>
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <Loading size="lg" />
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-bold text-white">Plugins Instalados</h2>
                  </CardHeader>
                  <CardContent>
                    {plugins.length === 0 ? (
                      <Alert type="info">
                        Não há informações sobre plugins disponíveis.
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        {plugins.map((plugin) => (
                          <div key={plugin.id} className="bg-phanteon-dark p-4 rounded-lg">
                            <h3 className="text-white font-medium">{plugin.name}</h3>
                            <p className="text-gray-400 text-sm mt-1">{plugin.description}</p>
                            <div className="flex justify-between mt-2">
                              <span className="text-xs px-2 py-1 bg-phanteon-light text-gray-300 rounded-full">
                                Versão {plugin.version}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {server.game.toLowerCase() === 'rust' && (
                      <div className="mt-8 pt-4 border-t border-phanteon-light">
                        <h3 className="text-lg font-medium text-white mb-4">Plugins Padrão</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-phanteon-dark p-4 rounded-lg">
                            <h3 className="text-white font-medium">TP</h3>
                            <p className="text-gray-400 text-sm mt-1">Sistema de teleporte para facilitar a navegação pelo servidor.</p>
                          </div>
                          
                          <div className="bg-phanteon-dark p-4 rounded-lg">
                            <h3 className="text-white font-medium">Kits</h3>
                            <p className="text-gray-400 text-sm mt-1">Kits de início para facilitar sua jornada no servidor.</p>
                          </div>
                          
                          <div className="bg-phanteon-dark p-4 rounded-lg">
                            <h3 className="text-white font-medium">Home</h3>
                            <p className="text-gray-400 text-sm mt-1">Sistema para definir e teleportar para locais salvos.</p>
                          </div>
                          
                          <div className="bg-phanteon-dark p-4 rounded-lg">
                            <h3 className="text-white font-medium">Loja</h3>
                            <p className="text-gray-400 text-sm mt-1">Sistema de loja para comprar e vender itens no servidor.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-white">Equipe do Servidor</h2>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loading size="lg" />
                    </div>
                  ) : team.length === 0 ? (
                    <Alert type="info">
                      Informações sobre a equipe não disponíveis.
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {team.map((member) => (
                        <div 
                          key={member.id} 
                          className="bg-phanteon-dark p-4 rounded-lg flex items-center"
                        >
                          <Avatar 
                            src={member.profiles?.avatar_url || null} 
                            alt={member.profiles?.username || 'Membro da equipe'} 
                            size="lg"
                          />
                          <div className="ml-4">
                            <h3 className="text-white font-medium">
                              {member.profiles?.username || 'Membro da equipe'}
                            </h3>
                            <p className="text-phanteon-orange text-sm">
                              {member.role}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Equipe padrão caso não haja dados */}
                  {team.length === 0 && !isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      <div className="bg-phanteon-dark p-4 rounded-lg flex items-center">
                        <Avatar 
                          src={null} 
                          alt="Admin" 
                          size="lg"
                        />
                        <div className="ml-4">
                          <h3 className="text-white font-medium">
                            PhantomAdmin
                          </h3>
                          <p className="text-phanteon-orange text-sm">
                            Administrador
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-phanteon-dark p-4 rounded-lg flex items-center">
                        <Avatar 
                          src={null} 
                          alt="Moderador" 
                          size="lg"
                        />
                        <div className="ml-4">
                          <h3 className="text-white font-medium">
                            RustMod
                          </h3>
                          <p className="text-phanteon-orange text-sm">
                            Moderador
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-phanteon-dark p-4 rounded-lg flex items-center">
                        <Avatar 
                          src={null} 
                          alt="Suporte" 
                          size="lg"
                        />
                        <div className="ml-4">
                          <h3 className="text-white font-medium">
                            PhantomSupport
                          </h3>
                          <p className="text-phanteon-orange text-sm">
                            Suporte
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-white">Apoiadores VIP</h2>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loading size="lg" />
                    </div>
                  ) : vipUsers.length === 0 ? (
                    <Alert type="info">
                      Nenhum apoiador VIP encontrado.
                    </Alert>
                  ) : (
                    <div className="flex flex-wrap gap-4 justify-center">
                      {vipUsers.map((user) => (
                        <div 
                          key={user.id} 
                          className="flex flex-col items-center"
                        >
                          <Avatar 
                            src={user.avatar_url || null} 
                            alt={user.username || 'Apoiador VIP'} 
                            size="lg"
                            className="mb-2"
                          />
                          <p className="text-white text-sm text-center">
                            {user.username || 'Apoiador VIP'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-8 pt-4 border-t border-phanteon-light text-center">
                    <p className="text-gray-300 mb-4">
                      Torne-se um apoiador VIP e ajude a manter nossos servidores!
                    </p>
                    <Link href="/vip">
                      <Button variant="primary">
                        Ver Planos VIP
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Server-side rendering para obter dados iniciais do servidor
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  let server = null;
  
  if (id && typeof id === 'string' && id !== 'undefined' && id !== 'null') {
    try {
      server = await fetchServerDetails(id);
    } catch (error) {
      console.error('Error fetching server details:', error);
    }
  } else {
    // Redirecionar para a lista de servidores se o ID for inválido
    return {
      redirect: {
        destination: '/servers',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      initialServer: server,
    },
  };
};