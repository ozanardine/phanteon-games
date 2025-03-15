// pages/player/[steamId].js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FiCrosshair, FaCrosshairs, FaSkull, FiClock, FiCalendar, FiUser, FiArrowLeft } from 'react-icons/all';

export default function PlayerDetailsPage() {
  const router = useRouter();
  const { steamId } = router.query;
  const [playerData, setPlayerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (steamId) {
      fetchPlayerData();
    }
  }, [steamId]);

  const fetchPlayerData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/players/${steamId}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados do jogador (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      setPlayerData(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar dados do jogador:', err);
      setError(err.message || 'Falha ao buscar dados do jogador');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-custom mx-auto py-12 px-4">
        <div className="flex items-center text-gray-400 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <FiArrowLeft className="mr-2" /> Voltar
          </Button>
        </div>
        
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size="lg" color="primary" text="Carregando dados do jogador..." />
        </div>
      </div>
    );
  }

  if (error || !playerData) {
    return (
      <div className="container-custom mx-auto py-12 px-4">
        <div className="flex items-center text-gray-400 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <FiArrowLeft className="mr-2" /> Voltar
          </Button>
        </div>
        
        <Card variant="darker" padding="large" className="border-red-500/20">
          <div className="text-center">
            <h3 className="text-red-400 font-semibold mb-2">Erro ao carregar jogador</h3>
            <p className="text-gray-300 mb-4">{error || 'Jogador não encontrado'}</p>
            <Button 
              onClick={fetchPlayerData}
              variant="primary"
            >
              Tentar Novamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{playerData.name} | Phanteon Games</title>
      </Head>

      <div className="container-custom mx-auto py-12 px-4">
        <div className="flex items-center text-gray-400 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <FiArrowLeft className="mr-2" /> Voltar
          </Button>
        </div>
        
        {/* Cabeçalho do Jogador */}
        <div className="bg-dark-300 rounded-lg overflow-hidden border border-dark-200 mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-dark-400 p-4 rounded-full mr-4">
                  <FiUser className="text-3xl text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{playerData.name}</h1>
                  <p className="text-gray-400">Steam ID: {playerData.steamId}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {playerData.stats.isConnected ? (
                  <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-medium">
                    Online
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">
                    Offline
                  </span>
                )}
                <span className="px-3 py-1 bg-dark-400 text-gray-300 rounded-full text-xs">
                  Último acesso: {new Date(playerData.stats.lastSeen).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="darker" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-gray-400 text-sm">Kills</h4>
                <p className="text-2xl font-bold text-green-400">{playerData.stats.kills}</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-full">
                <FiCrosshair className="text-green-500 text-xl" />
              </div>
            </div>
          </Card>
          
          <Card variant="darker" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-gray-400 text-sm">Mortes</h4>
                <p className="text-2xl font-bold text-red-400">{playerData.stats.deaths}</p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-full">
                <FaSkull className="text-red-500 text-xl" />
              </div>
            </div>
          </Card>
          
          <Card variant="darker" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-gray-400 text-sm">K/D Ratio</h4>
                <p className="text-2xl font-bold text-blue-400">{playerData.stats.kdr}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <FaCrosshairs className="text-blue-500 text-xl" />
              </div>
            </div>
          </Card>
          
          <Card variant="darker" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-gray-400 text-sm">Tempo de Jogo</h4>
                <p className="text-2xl font-bold text-purple-400">
                  {Math.floor(playerData.stats.timePlayed / 60)}h
                </p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-full">
                <FiClock className="text-purple-500 text-xl" />
              </div>
            </div>
          </Card>
        </div>
        
        {/* Estatísticas Detalhadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card variant="darker">
            <Card.Header>
              <Card.Title>Estatísticas Detalhadas</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Headshots</span>
                  <span className="text-white font-medium">{playerData.stats.headshots}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Taxa de Headshot</span>
                  <span className="text-white font-medium">{playerData.stats.headshotRatio}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Suicídios</span>
                  <span className="text-white font-medium">{playerData.stats.suicides}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Primeira Conexão</span>
                  <span className="text-white font-medium">
                    {new Date(playerData.stats.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
          
          <Card variant="darker">
            <Card.Header>
              <Card.Title>Estatísticas Mensais</Card.Title>
            </Card.Header>
            <Card.Body>
              {playerData.monthlyStats && playerData.monthlyStats.length > 0 ? (
                <div className="overflow-y-auto max-h-60">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-dark-400">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-300">Mês</th>
                        <th className="px-3 py-2 text-center text-sm font-medium text-gray-300">Kills</th>
                        <th className="px-3 py-2 text-center text-sm font-medium text-gray-300">Mortes</th>
                        <th className="px-3 py-2 text-center text-sm font-medium text-gray-300">K/D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerData.monthlyStats.map((stat, index) => (
                        <tr key={index} className="border-b border-dark-300">
                          <td className="px-3 py-2 text-left text-white">{stat.month}</td>
                          <td className="px-3 py-2 text-center text-green-400">{stat.kills}</td>
                          <td className="px-3 py-2 text-center text-red-400">{stat.deaths}</td>
                          <td className="px-3 py-2 text-center text-white">{stat.kdr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center">Sem dados mensais disponíveis</p>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </>
  );
}