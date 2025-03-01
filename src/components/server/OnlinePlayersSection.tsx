// src/components/server/OnlinePlayersSection.tsx
import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { supabase } from '../../lib/supabase/client';
import { formatPlaytime } from '../../lib/utils/formatUtils';
import { FaSearch, FaUser, FaClock, FaWifi } from 'react-icons/fa';

interface OnlinePlayer {
  steam_id: string;
  name: string;
  session_time: number;
  ping: number;
  is_admin: boolean;
}

interface OnlinePlayersSectionProps {
  serverId?: string;
  limit?: number;
  showSearch?: boolean;
}

const OnlinePlayersSection: React.FC<OnlinePlayersSectionProps> = ({
  serverId = 'game.phanteongames.com:28015',
  limit = 10,
  showSearch = true
}) => {
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<OnlinePlayer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);

  // Buscar jogadores online
  useEffect(() => {
    const fetchPlayers = async () => {
      setIsLoading(true);
      try {
        // Buscar contagem total de jogadores online
        const { count } = await supabase
          .from('online_players')
          .select('*', { count: 'exact', head: true })
          .eq('server_id', serverId);

        setTotalPlayers(count || 0);
        
        // Buscar detalhes de jogadores online
        const { data, error } = await supabase
          .from('online_players')
          .select('steam_id, name, session_time, ping, is_admin')
          .eq('server_id', serverId)
          .order('session_time', { ascending: false })
          .limit(limit);
        
        if (error) throw error;
        
        setPlayers(data || []);
        setFilteredPlayers(data || []);
      } catch (err) {
        console.error('Erro ao buscar jogadores online:', err);
        setError('Não foi possível carregar a lista de jogadores');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayers();
    
    // Configurar atualização periódica (a cada 1 minuto)
    const interval = setInterval(fetchPlayers, 60000);
    
    return () => clearInterval(interval);
  }, [serverId, limit]);

  // Filtrar jogadores quando o termo de busca mudar
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPlayers(players);
      return;
    }
    
    const filtered = players.filter(player => 
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredPlayers(filtered);
  }, [searchTerm, players]);

  return (
    <Card>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Jogadores Online ({totalPlayers})</h3>
          
          {showSearch && (
            <div className="relative w-48">
              <input
                type="text"
                placeholder="Buscar jogador..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-1 px-3 pl-8 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-zinc-500 text-xs" />
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner color="amber" text="Carregando jogadores..." />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-zinc-500">{error}</div>
        ) : filteredPlayers.length > 0 ? (
          <div className="divide-y divide-zinc-700">
            {filteredPlayers.map(player => (
              <div key={player.steam_id} className="py-3 flex items-center">
                <div className="h-8 w-8 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-300 mr-3">
                  <FaUser />
                </div>
                
                <div className="flex-grow">
                  <div className="font-semibold flex items-center">
                    {player.name}
                    {player.is_admin && (
                      <span className="ml-2 px-1.5 py-0.5 bg-red-800 text-white text-xs rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs text-zinc-400 mt-1">
                    <div className="flex items-center mr-4">
                      <FaClock className="mr-1" /> {formatPlaytime(Math.floor(player.session_time / 60))}
                    </div>
                    <div className="flex items-center">
                      <FaWifi className="mr-1" /> {player.ping}ms
                    </div>
                  </div>
                </div>
                
                <a 
                  href={`https://steamcommunity.com/profiles/${player.steam_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 text-xs bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition-colors"
                >
                  Perfil
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500">
            Nenhum jogador online encontrado
            {searchTerm && ` com o termo "${searchTerm}"`}
          </div>
        )}
        
        {totalPlayers > limit && !searchTerm && (
          <div className="mt-4 text-center text-sm text-zinc-500">
            Mostrando {Math.min(limit, filteredPlayers.length)} de {totalPlayers} jogadores online
          </div>
        )}
      </div>
    </Card>
  );
};

export default OnlinePlayersSection;