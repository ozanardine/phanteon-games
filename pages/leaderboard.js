// pages/leaderboard.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { TabSelector } from '../components/ui/TabSelector';
import { FiUsers, FiCrosshair, FiClock, FiCalendar, FiSearch } from 'react-icons/fi';
import { FaSkull } from 'react-icons/fa';

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all-time');
  const [orderBy, setOrderBy] = useState('kills');
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Definir os tabs
  const tabs = [
    { id: 'all-time', label: 'Geral', icon: <FiUsers /> },
    { id: 'monthly', label: 'Mensal', icon: <FiCalendar /> },
  ];

  // Opções de ordenação
  const orderOptions = [
    { id: 'kills', label: 'Kills', icon: <FiCrosshair /> },
    { id: 'time_played', label: 'Tempo de Jogo', icon: <FiClock /> },
    { id: 'deaths', label: 'Menos Mortes', icon: <FaSkull /> },
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, orderBy]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      // Determinar a URL baseada no tab ativo
      const endpoint = activeTab === 'all-time' 
        ? `/api/players/ranking?orderBy=${orderBy}` 
        : `/api/players/monthly-ranking?orderBy=${orderBy}`;
        
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar ranking (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      setPlayers(data.players || []);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar ranking:', err);
      setError(err.message || 'Falha ao buscar ranking de jogadores');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar jogadores baseado na busca
  const filteredPlayers = searchQuery
    ? players.filter(player => 
        player.playerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : players;

  return (
    <>
      <Head>
        <title>Leaderboard | Phanteon Games</title>
      </Head>

      <div className="container-custom mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-white mb-6">Leaderboard</h1>
        
        {/* Tabs e Filtros */}
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
                placeholder="Buscar jogador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className="bg-dark-300 border border-dark-200 text-white px-3 py-2 rounded-md focus:outline-none focus:border-primary"
            >
              {orderOptions.map(option => (
                <option key={option.id} value={option.id}>
                  Por {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Conteúdo do Leaderboard */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="lg" color="primary" text="Carregando leaderboard..." />
          </div>
        ) : error ? (
          <Card variant="darker" padding="large" className="border-red-500/20">
            <div className="text-center">
              <h3 className="text-red-400 font-semibold mb-2">Erro ao carregar leaderboard</h3>
              <p className="text-gray-300 mb-4">{error}</p>
              <Button 
                onClick={fetchLeaderboard}
                variant="primary"
              >
                Tentar Novamente
              </Button>
            </div>
          </Card>
        ) : filteredPlayers.length === 0 ? (
          <Card variant="darker" padding="large">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum jogador encontrado
              </h3>
              <p className="text-gray-300">
                {searchQuery
                  ? `Nenhum jogador encontrado para "${searchQuery}"`
                  : 'Não há dados de jogadores disponíveis'}
              </p>
            </div>
          </Card>
        ) : (
          <Card variant="darker" padding="none">
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
                      <FaSkull className="inline mr-1" /> Mortes
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">K/D</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                      <FiClock className="inline mr-1" /> Tempo de Jogo
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Última Conexão</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player, index) => {
                    // Determine se é um dos três primeiros para estilização
                    const isTopThree = index < 3;
                    const position = player.rank || (index + 1);
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
                        className={`border-b border-dark-500 cursor-pointer ${
                          isTopThree 
                            ? 'bg-dark-400/20 hover:bg-dark-400/40' 
                            : 'hover:bg-dark-400/20'
                        }`}
                        onClick={() => router.push(`/player/${player.playerId}`)}
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
                        <td className="px-4 py-3 text-center text-white font-medium">{player.kd}</td>
                        <td className="px-4 py-3 text-center text-gray-300">
                          {Math.floor(player.playtime / 60)}h {player.playtime % 60}m
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400 text-sm">
                          {new Date(player.lastSeen).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}