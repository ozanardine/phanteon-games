import React, { useState } from 'react';
import { FiCrosshair, FiSkull, FiClock, FiFilter, FiChevronDown, FiTrophy, FiUser } from 'react-icons/fi';
import Card from '../ui/Card';

// Definir funções utilitárias para formatação
const defaultFormatPlaytime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

const defaultFormatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

// Componente para o pódio dos três melhores jogadores
function LeaderboardPodium({ players }) {
  // Pega apenas os três primeiros jogadores
  const topPlayers = players.slice(0, 3);
  
  // Definir as posições para o pódio
  const positions = [
    { order: 2, place: "2º", medal: "silver" }, // Segundo lugar (à esquerda)
    { order: 1, place: "1º", medal: "gold" },   // Primeiro lugar (ao centro)
    { order: 3, place: "3º", medal: "bronze" }  // Terceiro lugar (à direita)
  ];

  const medalColors = {
    gold: "from-yellow-300 to-yellow-600",
    silver: "from-gray-300 to-gray-500",
    bronze: "from-amber-600 to-amber-800"
  };

  const podiumHeights = {
    1: "h-40",
    2: "h-32",
    3: "h-24"
  };

  return (
    <div className="mb-10">
      <div className="flex justify-around items-end mb-4 px-4">
        {positions.map((position) => {
          const player = topPlayers[position.order - 1];
          if (!player) return null;
          
          // Determinar a cor do pódio baseado na medalha
          let podiumGradient = "";
          if (position.medal === 'gold') {
            podiumGradient = "from-primary/40";
          } else if (position.medal === 'silver') {
            podiumGradient = "from-gray-500/40";
          } else {
            podiumGradient = "from-amber-700/40";
          }
          
          return (
            <div 
              key={position.order} 
              className="flex flex-col items-center relative"
              style={{ order: position.order }}
            >
              {/* Medalha/Avatar */}
              <div className={`relative mb-3 ${position.order === 1 ? 'scale-125 -mt-2' : ''}`}>
                <div className={`avatar-ring bg-gradient-to-br ${medalColors[position.medal]} p-1 rounded-full`}>
                  <div className="relative w-16 h-16 rounded-full bg-dark-400 overflow-hidden border-2 border-dark-100/40 flex items-center justify-center">
                    <FiUser className="w-8 h-8 text-white/80" />
                    
                    {/* Medalha */}
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-dark-100 to-dark-400 rounded-full p-1 border border-dark-100/40">
                      <FiTrophy className={`w-4 h-4 ${
                        position.medal === 'gold' ? 'text-yellow-400' : 
                        position.medal === 'silver' ? 'text-gray-300' : 'text-amber-700'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Nome do jogador */}
              <div className="text-center w-full">
                <h3 className={`font-bold truncate max-w-28 mx-auto ${
                  position.order === 1 ? 'text-white text-lg' : 'text-gray-300 text-base'
                }`}>
                  {player.playerName}
                </h3>
                <div className="flex items-center justify-center space-x-2 text-xs mt-1">
                  <span className="text-green-400 flex items-center" title="Kills">
                    <FiCrosshair className="mr-1" /> {player.kills}
                  </span>
                  <span className="text-red-400 flex items-center" title="Mortes">
                    <FiSkull className="mr-1" /> {player.deaths}
                  </span>
                </div>
                
                {/* Para o primeiro lugar, mostrar tempo de jogo */}
                {position.order === 1 && (
                  <div className="mt-1 text-xs text-gray-400 flex items-center justify-center">
                    <FiClock className="mr-1" /> 
                    {Math.floor(player.playtime / 60)}h {player.playtime % 60}m
                  </div>
                )}
              </div>
              
              {/* Pódio */}
              <div className={`absolute -z-10 bottom-0 w-full transform translate-y-full pt-2`}>
                <div className={`bg-gradient-to-t ${podiumGradient} to-transparent rounded-t-lg ${podiumHeights[position.order]}`}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Componente da tabela de jogadores
function LeaderboardTable({ players, formatPlaytime, formatDate }) {
  const safeFormatPlaytime = formatPlaytime || defaultFormatPlaytime;
  const safeFormatDate = formatDate || defaultFormatDate;
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-dark-400 border-b border-dark-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Posição</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Jogador</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
              <FiCrosshair className="inline mr-1" /> Kills
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
              <FiSkull className="inline mr-1" /> Mortes
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
              <FiClock className="inline mr-1" /> Tempo de Jogo
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Última Conexão</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => {
            // Determine se é um dos três primeiros para estilização especial
            const isTopThree = index < 3;
            const position = index + 1;
            let badgeColor = "";
            
            if (position === 1) {
              badgeColor = "bg-gradient-to-br from-yellow-300 to-yellow-600 text-dark-900";
            } else if (position === 2) {
              badgeColor = "bg-gradient-to-br from-gray-300 to-gray-500 text-dark-900";
            } else if (position === 3) {
              badgeColor = "bg-gradient-to-br from-amber-600 to-amber-800 text-white";
            } else {
              badgeColor = "bg-dark-300";
            }
            
            return (
              <tr 
                key={player.playerId || index} 
                className={`border-b border-dark-500 ${
                  isTopThree 
                    ? 'bg-dark-400/20 hover:bg-dark-400/40' 
                    : 'hover:bg-dark-400/20'
                }`}
              >
                <td className="px-4 py-3 text-left">
                  <span className={`rounded-full w-6 h-6 inline-flex items-center justify-center text-xs font-semibold ${badgeColor}`}>
                    {position}
                  </span>
                </td>
                <td className="px-4 py-3 text-left">
                  <span className={`font-medium ${isTopThree ? 'text-primary' : 'text-white'}`}>
                    {player.playerName}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-green-400">{player.kills}</td>
                <td className="px-4 py-3 text-center text-red-400">{player.deaths}</td>
                <td className="px-4 py-3 text-center text-gray-300">{safeFormatPlaytime(player.playtime)}</td>
                <td className="px-4 py-3 text-right text-gray-400 text-sm">{safeFormatDate(player.lastSeen)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Componente principal do Leaderboard
export default function Leaderboard({ leaderboard, formatPlaytime, formatDate }) {
  const [sortBy, setSortBy] = useState('kills');
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Se não houver dados, mostrar mensagem
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="bg-dark-400 rounded-lg p-6 text-center">
        <p className="text-gray-300">Nenhum dado de leaderboard disponível no momento.</p>
      </div>
    );
  }
  
  // Ordenar os jogadores com base no critério selecionado
  const sortedPlayers = [...leaderboard].sort((a, b) => {
    if (sortBy === 'kills') return b.kills - a.kills;
    if (sortBy === 'deaths') return a.deaths - b.deaths; // Menos mortes é melhor
    if (sortBy === 'playtime') return b.playtime - a.playtime;
    return 0;
  });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold text-white">
          Leaderboard
          <span className="ml-2 text-sm font-normal text-gray-400">
            {leaderboard.length} jogadores
          </span>
        </h3>
        
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center space-x-1 bg-dark-400 hover:bg-dark-300 rounded-lg px-4 py-2 text-gray-300 transition-colors"
          >
            <FiFilter className="mr-2" />
            <span>Ordenar por</span>
            <span className="text-primary font-medium">
              {sortBy === 'kills' && 'Kills'}
              {sortBy === 'deaths' && 'Mortes'}
              {sortBy === 'playtime' && 'Tempo de Jogo'}
            </span>
            <FiChevronDown className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {filterOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-dark-400 ring-1 ring-dark-200 z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={() => {
                    setSortBy('kills');
                    setFilterOpen(false);
                  }}
                  className={`block px-4 py-2 text-sm w-full text-left ${
                    sortBy === 'kills' ? 'bg-primary/10 text-primary' : 'text-gray-300 hover:bg-dark-300'
                  }`}
                >
                  <FiCrosshair className="inline mr-2" /> Por Kills
                </button>
                <button
                  onClick={() => {
                    setSortBy('deaths');
                    setFilterOpen(false);
                  }}
                  className={`block px-4 py-2 text-sm w-full text-left ${
                    sortBy === 'deaths' ? 'bg-primary/10 text-primary' : 'text-gray-300 hover:bg-dark-300'
                  }`}
                >
                  <FiSkull className="inline mr-2" /> Por Mortes (menos)
                </button>
                <button
                  onClick={() => {
                    setSortBy('playtime');
                    setFilterOpen(false);
                  }}
                  className={`block px-4 py-2 text-sm w-full text-left ${
                    sortBy === 'playtime' ? 'bg-primary/10 text-primary' : 'text-gray-300 hover:bg-dark-300'
                  }`}
                >
                  <FiClock className="inline mr-2" /> Por Tempo de Jogo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Pódio para os três primeiros */}
      <LeaderboardPodium players={sortedPlayers} />
      
      {/* Cartões para mostrar estatísticas agregadas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card variant="dark" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-gray-400 text-sm">Total de Kills</h4>
              <p className="text-2xl font-bold text-green-400">
                {sortedPlayers.reduce((total, player) => total + player.kills, 0)}
              </p>
            </div>
            <div className="rounded-full bg-green-400/10 p-3">
              <FiCrosshair className="text-green-400 text-xl" />
            </div>
          </div>
        </Card>
        
        <Card variant="dark" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-gray-400 text-sm">Total de Mortes</h4>
              <p className="text-2xl font-bold text-red-400">
                {sortedPlayers.reduce((total, player) => total + player.deaths, 0)}
              </p>
            </div>
            <div className="rounded-full bg-red-400/10 p-3">
              <FiSkull className="text-red-400 text-xl" />
            </div>
          </div>
        </Card>
        
        <Card variant="dark" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-gray-400 text-sm">Tempo de Jogo Total</h4>
              <p className="text-2xl font-bold text-blue-400">
                {Math.floor(sortedPlayers.reduce((total, player) => total + player.playtime, 0) / 60)}h
              </p>
            </div>
            <div className="rounded-full bg-blue-400/10 p-3">
              <FiClock className="text-blue-400 text-xl" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Tabela de jogadores */}
      <Card variant="dark" padding="none">
        <LeaderboardTable 
          players={sortedPlayers} 
          formatPlaytime={formatPlaytime} 
          formatDate={formatDate}
        />
      </Card>
    </div>
  );
}
