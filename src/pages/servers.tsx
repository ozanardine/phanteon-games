import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { ServerCard } from '@/components/servers/ServerCard';
import { fetchServers } from '@/utils/serverApi';
import { Server } from '@/types/database.types';
import { FiSearch, FiServer, FiFilter } from 'react-icons/fi';
import { useRouter } from 'next/router';

// Tipos de jogos suportados (para expansão futura)
type GameType = 'rust' | 'minecraft' | 'csgo' | 'all';

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [filteredServers, setFilteredServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState<GameType>('all');
  const router = useRouter();
  
  // Lista de jogos disponíveis (para expansão futura)
  const games = [
    { id: 'all', name: 'Todos os jogos' },
    { id: 'rust', name: 'Rust' },
    { id: 'minecraft', name: 'Minecraft' },
    { id: 'csgo', name: 'CS:GO' },
  ];

  useEffect(() => {
    const getServers = async () => {
      try {
        setIsLoading(true);
        const data = await fetchServers();
        setServers(data);
        setFilteredServers(data);
      } catch (err) {
        console.error('Error fetching servers:', err);
        setError('Não foi possível carregar os servidores. Por favor, tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    getServers();
  }, []);

  // Filtrar servidores com base no termo de busca e no jogo selecionado
  useEffect(() => {
    let result = servers;
    
    // Filtrar por jogo
    if (selectedGame !== 'all') {
      result = result.filter(server => {
        // Verificar se server.game existe e não é null/undefined
        return server.game && server.game.toLowerCase() === selectedGame;
      });
    }
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(server => 
        (server.name && server.name.toLowerCase().includes(term)) || 
        (server.ip && server.ip.toLowerCase().includes(term))
      );
    }
    
    setFilteredServers(result);
  }, [searchTerm, selectedGame, servers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleGameChange = (game: GameType) => {
    setSelectedGame(game);
  };

  const handleViewDetails = (serverId: string) => {
    router.push(`/servers/${serverId}`);
  };

  // Agrupar servidores por jogo para exibição
  const groupedServers = filteredServers.reduce((acc, server) => {
    // Verificar se server.game existe e não é null/undefined
    const game = server.game ? server.game.toLowerCase() : 'desconhecido';
    if (!acc[game]) {
      acc[game] = [];
    }
    acc[game].push(server);
    return acc;
  }, {} as Record<string, Server[]>);

  return (
    <Layout title="Servidores | Phanteon Games" description="Lista de servidores da Phanteon Games">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader 
          title="Nossos Servidores" 
          description="Confira nossos servidores de jogos e junte-se à diversão!"
        />
        
        {/* Filtros e pesquisa */}
        <div className="mb-8 bg-phanteon-gray p-4 rounded-lg border border-phanteon-light">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <Input
                placeholder="Buscar servidores..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
                fullWidth
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {games.map(game => (
                <Button
                  key={game.id}
                  variant={selectedGame === game.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleGameChange(game.id as GameType)}
                  className="flex items-center"
                >
                  {game.id === 'all' ? <FiFilter className="mr-2" /> : <FiServer className="mr-2" />}
                  {game.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loading size="lg" />
          </div>
        ) : error ? (
          <Alert type="error">{error}</Alert>
        ) : filteredServers.length === 0 ? (
          <Alert type="info">
            Nenhum servidor encontrado com os filtros selecionados.
          </Alert>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedServers).map(([game, gameServers]) => (
              <div key={game} className="space-y-4">
                <h2 className="text-2xl font-bold text-white capitalize border-b border-phanteon-light pb-2">
                  {game === 'rust' ? 'Rust' : 
                   game === 'minecraft' ? 'Minecraft' : 
                   game === 'csgo' ? 'CS:GO' : 
                   game === 'desconhecido' ? 'Outros' : game}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gameServers.map(server => (
                    <ServerCard 
                      key={server.id} 
                      server={server} 
                      onViewDetails={() => handleViewDetails(server.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}