// src/components/server/PlayerStatsCard.tsx
import React from 'react';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { usePlayerStats } from '../../hooks/usePlayerStats';
import { formatPlaytime } from '../../lib/utils/formatUtils';
import { formatDateBR } from '../../lib/utils/dateUtils';
import { FaUser, FaClock, FaSkull, FaCrosshairs, FaCircle } from 'react-icons/fa';

interface PlayerStatsCardProps {
  steamId: string;
  serverId?: string;
}

const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({
  steamId,
  serverId = 'game.phanteongames.com:28015'
}) => {
  const { playerStats, isLoading, error } = usePlayerStats(steamId, serverId);
  
  // Calcular estatísticas
  const kdRatio = playerStats ? 
    (playerStats.total_deaths > 0 ? playerStats.total_kills / playerStats.total_deaths : playerStats.total_kills) 
    : 0;
  
  return (
    <Card>
      {isLoading ? (
        <div className="p-6 flex justify-center">
          <LoadingSpinner color="amber" text="Carregando estatísticas..." />
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <p className="text-red-500">Erro ao carregar estatísticas</p>
          <p className="text-sm text-zinc-500">{error.message}</p>
        </div>
      ) : !playerStats ? (
        <div className="p-6 text-center">
          <p className="text-zinc-400">Jogador não encontrado ou sem estatísticas</p>
        </div>
      ) : (
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="h-12 w-12 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-300 mr-4">
              <FaUser className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{playerStats.name}</h3>
              <div className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${playerStats.is_online ? 'bg-green-500' : 'bg-zinc-500'}`}></div>
                <span className="text-zinc-400">
                  {playerStats.is_online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-zinc-400 text-sm mb-1">Tempo Total de Jogo</div>
              <div className="font-semibold text-lg">
                {formatPlaytime(Math.floor(playerStats.total_playtime / 60))}
              </div>
            </div>
            
            <div>
              <div className="text-zinc-400 text-sm mb-1">KD Ratio</div>
              <div className="font-semibold text-lg">{kdRatio.toFixed(2)}</div>
            </div>
            
            <div>
              <div className="text-zinc-400 text-sm mb-1">Kills</div>
              <div className="font-semibold text-lg">{playerStats.total_kills}</div>
            </div>
            
            <div>
              <div className="text-zinc-400 text-sm mb-1">Mortes</div>
              <div className="font-semibold text-lg">{playerStats.total_deaths}</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-zinc-400 text-sm mb-1">Último Acesso</div>
              <div className="text-sm">
                {playerStats.last_connected ? formatDateBR(new Date(playerStats.last_connected)) : 'Desconhecido'}
              </div>
            </div>
            
            <div>
              <div className="text-zinc-400 text-sm mb-1">Estatísticas Mensais</div>
              <div className="flex space-x-4 text-sm">
                <div className="flex items-center">
                  <FaCrosshairs className="text-amber-500 mr-1" /> 
                  {playerStats.monthly_kills} kills
                </div>
                <div className="flex items-center">
                  <FaSkull className="text-red-500 mr-1" /> 
                  {playerStats.monthly_deaths} mortes
                </div>
                <div className="flex items-center">
                  <FaClock className="text-blue-500 mr-1" /> 
                  {formatPlaytime(Math.floor(playerStats.monthly_playtime / 60))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <a 
              href={`https://steamcommunity.com/profiles/${steamId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm transition-colors"
            >
              Ver Perfil Steam
            </a>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PlayerStatsCard;