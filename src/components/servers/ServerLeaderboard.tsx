import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { LeaderboardEntry } from '@/types/database.types';
import { Button } from '@/components/ui/Button';
import { GiTrophy, GiSwordWound, GiDeathSkull, GiHourglass } from 'react-icons/gi';
import { FiUsers, FiAward } from 'react-icons/fi';

type ServerLeaderboardProps = {
  leaderboard: LeaderboardEntry[];
  type: string;
  onTypeChange: (type: string) => void;
  isLoading?: boolean;
};

export function ServerLeaderboard({ 
  leaderboard, 
  type, 
  onTypeChange, 
  isLoading = false 
}: ServerLeaderboardProps) {
  // Formatação de valores com base no tipo
  const formatValue = (entry: LeaderboardEntry): string => {
    switch (type) {
      case 'kills':
        return entry.score.toFixed(0);
      case 'deaths':
        return entry.score.toFixed(0);
      case 'playtime':
        return formatPlaytime(entry.score);
      case 'kd_ratio':
        return entry.score.toFixed(2);
      default:
        return entry.score.toString();
    }
  };
  
  // Formatação de tempo de jogo
  const formatPlaytime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };
  
  // Obter o ícone para o tipo de leaderboard
  const getLeaderboardIcon = (): React.ReactNode => {
    switch (type) {
      case 'kills':
        return <GiSwordWound className="text-red-500" />;
      case 'deaths':
        return <GiDeathSkull className="text-gray-500" />;
      case 'playtime':
        return <GiHourglass className="text-blue-500" />;
      case 'kd_ratio':
        return <FiAward className="text-yellow-500" />;
      default:
        return <GiTrophy className="text-phanteon-orange" />;
    }
  };
  
  // Obter o título para o tipo de leaderboard
  const getLeaderboardTitle = (): string => {
    switch (type) {
      case 'kills':
        return 'Mais Kills';
      case 'deaths':
        return 'Mais Mortes';
      case 'playtime':
        return 'Mais Tempo de Jogo';
      case 'kd_ratio':
        return 'Melhor K/D Ratio';
      default:
        return 'Leaderboard';
    }
  };
  
  // Ordenar leaderboard
  const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {getLeaderboardTitle()}
          </h2>
          <div className="text-xl">
            {getLeaderboardIcon()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros de tipo */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={type === 'kills' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('kills')}
          >
            <GiSwordWound className="mr-2" />
            Kills
          </Button>
          
          <Button
            variant={type === 'deaths' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('deaths')}
          >
            <GiDeathSkull className="mr-2" />
            Mortes
          </Button>
          
          <Button
            variant={type === 'playtime' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('playtime')}
          >
            <GiHourglass className="mr-2" />
            Tempo de Jogo
          </Button>
          
          <Button
            variant={type === 'kd_ratio' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('kd_ratio')}
          >
            <FiAward className="mr-2" />
            K/D Ratio
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-phanteon-orange border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sortedLeaderboard.length === 0 ? (
          <div className="bg-phanteon-dark p-4 rounded-lg text-center">
            <p className="text-gray-300">Nenhum dado de leaderboard disponível.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-phanteon-light">
                  <th className="py-3 px-4 text-gray-400 font-medium">Posição</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Jogador</th>
                  <th className="py-3 px-4 text-gray-400 font-medium text-right">
                    {type === 'kills' ? 'Kills' : 
                     type === 'deaths' ? 'Mortes' : 
                     type === 'playtime' ? 'Tempo de Jogo' : 
                     type === 'kd_ratio' ? 'K/D Ratio' : 'Pontuação'}
                  </th>
                  {type === 'kills' && (
                    <th className="py-3 px-4 text-gray-400 font-medium text-right">K/D</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((entry, index) => (
                  <tr 
                    key={`${entry.id}_${index}`} 
                    className="border-b border-phanteon-light hover:bg-phanteon-light/10"
                  >
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
                    <td className="py-3 px-4 text-white text-right font-medium">
                      {formatValue(entry)}
                    </td>
                    {type === 'kills' && (
                      <td className="py-3 px-4 text-white text-right">
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
  );
}