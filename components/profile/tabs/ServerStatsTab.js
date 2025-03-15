// components/profile/tabs/ServerStatsTab.js
import React, { useState, useEffect } from 'react';
import { FaServer, FaUser, FaChartLine, FaExclamationTriangle, FaGamepad } from 'react-icons/fa';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';
import { formatDate } from '../utils';
import { toast } from 'react-hot-toast';

const ServerStatsTab = ({ userData, serverData, onEditSteamId }) => {
  const [isLoading, setIsLoading] = useState(!serverData);
  const [playerStats, setPlayerStats] = useState(serverData || null);
  const [error, setError] = useState(null);

  // Efeito para carregar estatísticas do jogador no servidor caso não tenha sido fornecido
  useEffect(() => {
    const fetchPlayerStats = async () => {
      if (userData?.steam_id && !serverData) {
        try {
          setIsLoading(true);
          setError(null);
          
          // Chamada simulada à API - em produção, buscar dados reais
          const response = await fetch(`/api/players/${userData.steam_id}`);
          if (!response.ok) {
            throw new Error(`Erro ao buscar estatísticas do jogador (${response.status})`);
          }
          
          const data = await response.json();
          setPlayerStats(data);
        } catch (err) {
          console.error('Erro ao buscar estatísticas:', err);
          setError(err.message || 'Não foi possível buscar suas estatísticas do servidor');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchPlayerStats();
  }, [userData, serverData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoadingSpinner size="lg" text="Carregando estatísticas do servidor..." />
      </div>
    );
  }

  if (error || !userData?.steam_id) {
    return (
      <Card className="p-6 text-center">
        <FaExclamationTriangle className="mx-auto text-primary text-4xl mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">
          {!userData?.steam_id ? 'Steam ID não configurado' : 'Erro ao carregar estatísticas'}
        </h3>
        <p className="text-gray-400 mb-4">
          {!userData?.steam_id 
            ? 'Configure seu Steam ID para visualizar suas estatísticas nos servidores.'
            : error || 'Ocorreu um erro ao buscar suas estatísticas. Tente novamente mais tarde.'}
        </p>
        {!userData?.steam_id && onEditSteamId && (
          <Button 
            variant="primary"
            onClick={onEditSteamId}
          >
            Configurar Steam ID
          </Button>
        )}
      </Card>
    );
  }

  // Renderizar com dados simulados se não tem estatísticas reais
  const stats = playerStats || {
    name: userData?.name || 'Jogador',
    steamId: userData.steam_id,
    stats: {
      kills: 0,
      deaths: 0,
      headshots: 0,
      kdr: '0.00',
      timePlayed: 0,
      lastSeen: new Date().toISOString(),
      isConnected: false
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho com Informações Gerais */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaServer className="text-primary mr-2" />
            Perfil no Servidor
          </Card.Title>
        </Card.Header>
        <Card.Body className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar do Jogador */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-dark-400 border border-dark-300 flex items-center justify-center flex-shrink-0">
              <FaUser className="text-4xl text-gray-500" />
            </div>
            
            {/* Informações Principais */}
            <div className="space-y-3 flex-grow">
              <div className="flex items-center">
                <h3 className="text-xl font-bold text-white">{stats.name}</h3>
                <span 
                  className={`ml-3 px-2 py-0.5 rounded text-xs font-medium ${
                    stats.stats.isConnected 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {stats.stats.isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <p className="text-gray-400 text-sm">
                Steam ID: <span className="text-gray-300 font-mono">{stats.steamId}</span>
              </p>
              
              <div className="text-gray-400 text-sm">
                Última conexão: <span className="text-gray-300">{formatDate(stats.stats.lastSeen)}</span>
              </div>
              
              {/* Estatísticas Rápidas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                <div className="bg-dark-400/60 p-3 rounded-lg">
                  <div className="text-primary text-xs font-medium mb-1">Kills</div>
                  <div className="text-white font-bold text-lg">{stats.stats.kills}</div>
                </div>
                
                <div className="bg-dark-400/60 p-3 rounded-lg">
                  <div className="text-primary text-xs font-medium mb-1">Mortes</div>
                  <div className="text-white font-bold text-lg">{stats.stats.deaths}</div>
                </div>
                
                <div className="bg-dark-400/60 p-3 rounded-lg">
                  <div className="text-primary text-xs font-medium mb-1">K/D</div>
                  <div className="text-white font-bold text-lg">{stats.stats.kdr}</div>
                </div>
                
                <div className="bg-dark-400/60 p-3 rounded-lg">
                  <div className="text-primary text-xs font-medium mb-1">Tempo Jogado</div>
                  <div className="text-white font-bold text-lg">
                    {Math.floor(stats.stats.timePlayed / 60)}h
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Estatísticas Detalhadas */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaChartLine className="text-primary mr-2" />
            Estatísticas Detalhadas
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estatísticas de Combate */}
            <div className="bg-dark-400/50 p-4 rounded-lg border border-dark-300">
              <h3 className="text-white font-medium mb-3">Combate</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Kills</span>
                  <span className="text-white font-medium">{stats.stats.kills}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mortes</span>
                  <span className="text-white font-medium">{stats.stats.deaths}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">K/D Ratio</span>
                  <span className="text-white font-medium">{stats.stats.kdr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Headshots</span>
                  <span className="text-white font-medium">{stats.stats.headshots || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Taxa de Headshot</span>
                  <span className="text-white font-medium">
                    {stats.stats.headshotRatio || 0}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Estatísticas de Progresso */}
            <div className="bg-dark-400/50 p-4 rounded-lg border border-dark-300">
              <h3 className="text-white font-medium mb-3">Progresso</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tempo de Jogo</span>
                  <span className="text-white font-medium">
                    {Math.floor(stats.stats.timePlayed / 60)}h {stats.stats.timePlayed % 60}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rank</span>
                  <span className="text-white font-medium">#42</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">XP</span>
                  <span className="text-white font-medium">5,280</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estruturas Construídas</span>
                  <span className="text-white font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Recursos Coletados</span>
                  <span className="text-white font-medium">24,351</span>
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Dados do Servidor */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaGamepad className="text-primary mr-2" />
            Servidor Atual
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="bg-dark-400/50 p-4 rounded-lg border border-dark-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-medium">Rust Survival #1</h3>
                <p className="text-gray-400 text-sm">82.29.62.21:28015</p>
              </div>
              <Card.Badge variant="success">Online</Card.Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-gray-400 text-xs mb-1">Mapa</div>
                <div className="text-white">Procedural</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Tamanho</div>
                <div className="text-white">4500</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Jogadores</div>
                <div className="text-white">42/60</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Próximo Wipe</div>
                <div className="text-white">06/04/2025</div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText('client.connect 82.29.62.21:28015');
                toast.success('Comando de conexão copiado!');
              }}
            >
              <FaGamepad className="mr-2" />
              Copiar Comando de Conexão
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ServerStatsTab;