// src/components/server/LeaderboardSection.tsx
import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import useLeaderboard from '../../hooks/useLeaderboard';
import { formatPlaytime } from '../../lib/utils/formatUtils';
import { FaTrophy, FaSkull, FaClock, FaStar } from 'react-icons/fa';

interface LeaderboardSectionProps {
  serverId?: string;
  limit?: number;
}

const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({ 
  serverId = 'game.phanteongames.com:28015',
  limit = 5
}) => {
  const [activeTab, setActiveTab] = useState<'kills' | 'playtime' | 'deaths'>('kills');
  
  const { data: killsData, isLoading: killsLoading } = useLeaderboard(serverId, 'kills', undefined, limit);
  const { data: playtimeData, isLoading: playtimeLoading } = useLeaderboard(serverId, 'playtime', undefined, limit);
  const { data: deathsData, isLoading: deathsLoading } = useLeaderboard(serverId, 'deaths', undefined, limit);
  
  const isLoading = activeTab === 'kills' ? killsLoading : 
                   activeTab === 'playtime' ? playtimeLoading : deathsLoading;
  
  const currentData = activeTab === 'kills' ? killsData : 
                     activeTab === 'playtime' ? playtimeData : deathsData;

  return (
    <Card className="overflow-hidden">
      <div className="flex border-b border-zinc-700">
        <button
          className={`flex items-center px-4 py-3 ${
            activeTab === 'kills' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:bg-zinc-700'
          }`}
          onClick={() => setActiveTab('kills')}
        >
          <FaTrophy className="mr-2" /> Kills
        </button>
        <button
          className={`flex items-center px-4 py-3 ${
            activeTab === 'playtime' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:bg-zinc-700'
          }`}
          onClick={() => setActiveTab('playtime')}
        >
          <FaClock className="mr-2" /> Tempo de Jogo
        </button>
        <button
          className={`flex items-center px-4 py-3 ${
            activeTab === 'deaths' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:bg-zinc-700'
          }`}
          onClick={() => setActiveTab('deaths')}
        >
          <FaSkull className="mr-2" /> Mortes
        </button>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner color="amber" text="Carregando leaderboard..." />
          </div>
        ) : currentData && currentData.length > 0 ? (
          <div className="space-y-2">
            {currentData.map((entry, index) => (
              <div key={entry.id} className="flex items-center p-3 bg-zinc-800 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-zinc-300 text-black' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'bg-zinc-700 text-zinc-300'
                }`}>
                  {index + 1}
                </div>
                
                <div className="flex-grow">
                  <div className="font-semibold">{entry.name}</div>
                  {activeTab === 'kills' && (
                    <div className="text-xs text-zinc-400 flex items-center">
                      <FaTrophy className="text-yellow-500 mr-1" /> {entry.score} kills
                      {entry.secondary_score > 0 && (
                        <span className="ml-2">
                          | K/D: {entry.secondary_score.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                  {activeTab === 'playtime' && (
                    <div className="text-xs text-zinc-400 flex items-center">
                      <FaClock className="text-blue-400 mr-1" /> {formatPlaytime(Math.floor(entry.score / 60))}
                    </div>
                  )}
                  {activeTab === 'deaths' && (
                    <div className="text-xs text-zinc-400 flex items-center">
                      <FaSkull className="text-red-500 mr-1" /> {entry.score} mortes
                      {entry.secondary_score > 0 && (
                        <span className="ml-2">
                          | Kills: {entry.secondary_score}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {index < 3 && (
                  <div className={`h-6 w-6 flex-shrink-0 ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-zinc-300' :
                    'text-amber-700'
                  }`}>
                    <FaStar />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500">
            Nenhum dado de leaderboard disponível
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.href = '/leaderboard'}
          >
            Ver Leaderboard Completo
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default LeaderboardSection;