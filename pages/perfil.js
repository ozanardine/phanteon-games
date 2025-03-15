// pages/perfil.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TabSelector } from '../components/ui/TabSelector';
import SubscriptionStatus from '../components/subscriptions/SubscriptionStatus';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  FaDiscord, FaSteam, FaUser, FaHistory, FaChevronRight, FaInfoCircle, 
  FaShieldAlt, FaServer, FaGamepad, FaCrown, FaClock, FaCalendarAlt,
  FaArrowUp, FaUserCircle, FaChartLine, FaExclamationTriangle, FaGift
} from 'react-icons/fa';
import { getUserByDiscordId, getUserSubscription, supabase } from '../lib/supabase';
import { requireAuth, syncUserData } from '../lib/auth';

// ==========================================
// UTILITY FUNCTIONS - Separadas da lógica dos componentes
// ==========================================

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

// Valida o formato do SteamID: deve ter 17 dígitos
const validateSteamId = (steamId) => {
  return steamId && steamId.match(/^[0-9]{17}$/);
};

// Calcula o tempo até a expiração da assinatura
const calculateTimeUntilExpiration = (expirationDate) => {
  if (!expirationDate) return null;
  
  try {
    const now = new Date();
    const expDate = new Date(expirationDate);
    const diff = expDate - now;
    
    if (diff <= 0) return { expired: true, text: 'Expirado' };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return { 
        expired: false, 
        text: `${days} dia${days > 1 ? 's' : ''} ${hours} hora${hours > 1 ? 's' : ''}`,
        days,
        hours
      };
    } else {
      return { 
        expired: false, 
        text: `${hours} hora${hours > 1 ? 's' : ''} restante${hours > 1 ? 's' : ''}`,
        days: 0,
        hours
      };
    }
  } catch (error) {
    console.error('Erro ao calcular tempo restante:', error);
    return { expired: false, text: 'Indeterminado' };
  }
};

// ==========================================
// COMPONENTES MODULARES - Para melhor organização
// ==========================================

// Componente Principal de Gerenciamento de Tabs
const TabContent = ({ activeTab, userData, session, subscriptionData, serverData, onEditSteamId, onRenewSubscription, subscriptionHistory, onUpgradeSubscription }) => {
  switch (activeTab) {
    case 'vip':
      return (
        <VipManagementTab 
          subscriptionData={subscriptionData} 
          subscriptionHistory={subscriptionHistory}
          onRenew={onRenewSubscription}
          onUpgrade={onUpgradeSubscription}
        />
      );
    case 'profile':
      return (
        <ProfileTab 
          userData={userData} 
          session={session} 
          onEditSteamId={onEditSteamId} 
        />
      );
    case 'server':
      return (
        <ServerStatsTab 
          userData={userData} 
          serverData={serverData} 
        />
      );
    case 'rewards':
      return (
        <DailyRewardsTab 
          userData={userData} 
        />
      );
    default:
      return (
        <VipManagementTab 
          subscriptionData={subscriptionData} 
          subscriptionHistory={subscriptionHistory}
          onRenew={onRenewSubscription}
          onUpgrade={onUpgradeSubscription}
        />
      );
  }
};

// Tab de Gerenciamento VIP
const VipManagementTab = ({ subscriptionData, subscriptionHistory = [], onRenew, onUpgrade }) => {
  const hasActiveSubscription = subscriptionData && subscriptionData.status === 'active';
  const expirationInfo = useMemo(() => {
    return hasActiveSubscription ? calculateTimeUntilExpiration(subscriptionData.expires_at) : null;
  }, [hasActiveSubscription, subscriptionData]);
  
  return (
    <div className="space-y-8">
      {/* Status da Assinatura */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaCrown className="text-primary mr-2" />
            Status da Assinatura VIP
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {hasActiveSubscription ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-dark-400 to-dark-300 p-4 rounded-lg">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{subscriptionData.plan_name}</h3>
                  <p className="text-gray-300">
                    Ativo até {formatDate(subscriptionData.expires_at)}
                  </p>
                  {expirationInfo && !expirationInfo.expired && (
                    <p className="text-primary text-sm mt-1">
                      <FaClock className="inline mr-1" /> 
                      {expirationInfo.text} restantes
                    </p>
                  )}
                </div>
                <div className="mt-4 md:mt-0">
                  <Card.Badge variant={expirationInfo?.expired ? 'danger' : 'success'} className="text-sm">
                    {expirationInfo?.expired ? 'Expirado' : 'Ativo'}
                  </Card.Badge>
                </div>
              </div>

              {/* Barra de progresso da assinatura */}
              {expirationInfo && !expirationInfo.expired && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Hoje</span>
                    <span>Expiração</span>
                  </div>
                  <div className="w-full bg-dark-400 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ 
                        width: `${Math.max(5, Math.min(100, 100 - (expirationInfo.days / 30) * 100))}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Benefícios do plano */}
              <div>
                <h4 className="text-white font-medium mb-2">Seus Benefícios:</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {generateBenefitsList(subscriptionData.plan_id).map((benefit, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <div className="bg-primary/20 text-primary rounded-full p-1 flex-shrink-0 mt-0.5 mr-2">
                        <FaCheck className="w-3 h-3" />
                      </div>
                      <span className="text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ações de VIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={onRenew}
                  className="group"
                >
                  <FaClock className="mr-2" />
                  Renovar Assinatura
                  <FaChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
                
                <Button
                  variant="primary"
                  onClick={onUpgrade}
                  className="group"
                >
                  <FaArrowUp className="mr-2" />
                  Fazer Upgrade
                  <FaChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-dark-300 text-gray-400 flex items-center justify-center mx-auto mb-4">
                <FaCrown className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Sem assinatura ativa</h3>
              <p className="text-gray-400 mb-4">
                Você ainda não possui nenhum plano VIP ativo.
                Adquira um plano para obter vantagens exclusivas!
              </p>
              <Button 
                variant="primary"
                onClick={onRenew}
              >
                Ver Planos VIP
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Instruções para VIP */}
      {hasActiveSubscription && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <FaInfoCircle className="text-primary mr-2" />
              Como usar seu VIP
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div>
                <p className="text-gray-300 mb-2">
                  Para resgatar seus itens VIP, utilize o comando:
                </p>
                <div className="bg-dark-400 p-3 rounded font-mono text-sm text-gray-300">
                  /resgatar
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Caso seu inventário esteja cheio, você receberá instruções no jogo.
                </p>
              </div>
              {/* Adicionar mais instruções úteis */}
              <div className="bg-dark-400/50 p-4 rounded-lg border border-dark-300 mt-4">
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <FaShieldAlt className="text-primary mr-2" />
                  Dica VIP
                </h4>
                <p className="text-gray-300 text-sm">
                  Você pode usar o comando <span className="text-primary font-mono">/vip</span> dentro 
                  do jogo para ver todas as opções disponíveis para o seu plano.
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Histórico de Assinaturas */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaHistory className="text-primary mr-2" />
            Histórico de Assinaturas
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {subscriptionHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-dark-400">
                    <th className="py-2 px-4 text-left text-gray-300">Plano</th>
                    <th className="py-2 px-4 text-left text-gray-300">Data</th>
                    <th className="py-2 px-4 text-left text-gray-300">Expiração</th>
                    <th className="py-2 px-4 text-right text-gray-300">Valor</th>
                    <th className="py-2 px-4 text-center text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionHistory.map((sub) => (
                    <tr key={sub.id} className="border-b border-dark-300">
                      <td className="py-3 px-4 text-white">{sub.plan_name}</td>
                      <td className="py-3 px-4 text-gray-400">
                        {formatDate(sub.created_at)}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {formatDate(sub.expires_at)}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-right">
                        R$ {parseFloat(sub.amount || sub.price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            sub.status === 'active'
                              ? 'bg-green-900/20 text-green-500'
                              : sub.status === 'pending'
                              ? 'bg-yellow-900/20 text-yellow-500'
                              : 'bg-red-900/20 text-red-500'
                          }`}
                        >
                          {sub.status === 'active'
                            ? 'Ativo'
                            : sub.status === 'pending'
                            ? 'Pendente'
                            : 'Expirado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400">
                Você ainda não possui histórico de assinaturas.
              </p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

// Tab de Informações de Perfil
const ProfileTab = ({ userData, session, onEditSteamId }) => {
  return (
    <div className="space-y-8">
      {/* Card de Informações do Perfil */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaUser className="text-primary mr-2" />
            Informações Pessoais
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-col md:flex-row md:space-x-6">
            {/* Avatar e Nome */}
            <div className="flex flex-col items-center mb-6 md:mb-0">
              {session?.user?.image ? (
                <div className="relative h-32 w-32 rounded-full overflow-hidden mb-4 border-4 border-dark-300 shadow-lg">
                  <Image 
                    src={session.user.image} 
                    alt={session.user.name} 
                    fill 
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="bg-dark-300 h-32 w-32 rounded-full flex items-center justify-center mb-4 border-4 border-dark-300">
                  <FaUserCircle className="h-20 w-20 text-gray-400" />
                </div>
              )}
              <h2 className="text-xl font-bold text-white">{session?.user?.name}</h2>
              <p className="text-gray-400 text-sm">{session?.user?.email}</p>
            </div>

            {/* Informações de Conta */}
            <div className="flex-grow space-y-5">
              <div className="bg-dark-400/50 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-3">Detalhes da Conta</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center mb-1">
                      <FaDiscord className="text-primary mr-2" />
                      <span className="text-gray-300 text-sm">Discord ID</span>
                    </div>
                    <p className="bg-dark-400 p-2 rounded text-gray-400 text-sm break-all">
                      {session?.user?.discord_id || 'Não disponível'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center mb-1">
                      <FaSteam className="text-primary mr-2" />
                      <span className="text-gray-300 text-sm">Steam ID</span>
                    </div>
                    <div className="flex items-center">
                      <p className="bg-dark-400 p-2 rounded text-gray-400 text-sm flex-grow break-all">
                        {userData?.steam_id || 'Não configurado'}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2"
                        onClick={onEditSteamId}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-1">
                      <FaCalendarAlt className="text-primary mr-2" />
                      <span className="text-gray-300 text-sm">Membro desde</span>
                    </div>
                    <p className="bg-dark-400 p-2 rounded text-gray-400 text-sm">
                      {userData?.created_at ? formatDate(userData.created_at) : 'Data indisponível'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Configurações e Preferências (Placeholder para expansão futura) */}
              <div className="bg-dark-400/50 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-3">Preferências</h3>
                <p className="text-gray-400 text-sm">
                  Aqui você poderá configurar suas preferências de notificações e comunicação.
                  Essas opções estarão disponíveis em breve.
                </p>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Card de Integração de Contas */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaLink className="text-primary mr-2" />
            Contas Conectadas
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Discord */}
            <div className="bg-[#5865F2]/10 p-4 rounded-lg border border-[#5865F2]/20 flex items-center justify-between">
              <div className="flex items-center">
                <FaDiscord className="text-[#5865F2] text-2xl mr-3" />
                <div>
                  <h4 className="text-white font-medium">Discord</h4>
                  <p className="text-gray-400 text-sm truncate max-w-[150px]">
                    {session?.user?.discord_username || session?.user?.name || 'Conta conectada'}
                  </p>
                </div>
              </div>
              <span className="bg-[#5865F2]/20 text-[#5865F2] text-xs font-medium px-2 py-1 rounded">
                Conectado
              </span>
            </div>
            
            {/* Steam */}
            <div className={`${userData?.steam_id ? 'bg-[#1b2838]/10 border-[#1b2838]/20' : 'bg-dark-400/50 border-dark-300'} p-4 rounded-lg border flex items-center justify-between`}>
              <div className="flex items-center">
                <FaSteam className={`${userData?.steam_id ? 'text-[#1b2838]' : 'text-gray-400'} text-2xl mr-3`} />
                <div>
                  <h4 className="text-white font-medium">Steam</h4>
                  <p className="text-gray-400 text-sm">
                    {userData?.steam_id ? 'Conta conectada' : 'Não configurado'}
                  </p>
                </div>
              </div>
              {userData?.steam_id ? (
                <span className="bg-[#1b2838]/20 text-[#1b2838] text-xs font-medium px-2 py-1 rounded">
                  Conectado
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={onEditSteamId}
                >
                  Conectar
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

// Tab de Estatísticas do Servidor
const ServerStatsTab = ({ userData, serverData }) => {
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
        {!userData?.steam_id && (
          <Button 
            variant="primary"
            onClick={() => onEditSteamId && onEditSteamId()}
          >
            Configurar Steam ID
          </Button>
        )}
      </Card>
    );
  }

  // Renderizar com dados simulados se não tem estatísticas reais
  const stats = playerStats || {
    name: session?.user?.name || 'Jogador',
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
                  className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
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

// Tab de Recompensas Diárias
const DailyRewardsTab = ({ userData }) => {
  const [rewardsData, setRewardsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingDay, setClaimingDay] = useState(null);

  useEffect(() => {
    fetchDailyRewards();
  }, []);

  const fetchDailyRewards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/rewards/daily');
      
      if (!response.ok) {
        throw new Error(`Erro (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      setRewardsData(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar recompensas diárias:', err);
      setError(err.message || 'Falha ao buscar recompensas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimReward = async (day) => {
    if (claimingDay) return; // Evitar cliques duplos
    
    try {
      setClaimingDay(day);
      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ day }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Erro ao reivindicar recompensa (${response.status})`);
      }
      
      const data = await response.json();
      
      // Atualizar os dados locais
      setRewardsData(prevData => ({
        ...prevData,
        status: data.status,
        rewards: data.rewards,
      }));
      
      // Exibir mensagem de sucesso
      toast.success(`Recompensas do dia ${day} reivindicadas com sucesso!`);
      
      // Atualizar para ver recompensas pendentes
      fetchDailyRewards();
    } catch (err) {
      console.error('Erro ao reivindicar recompensa:', err);
      toast.error(err.message || 'Falha ao reivindicar recompensa');
    } finally {
      setClaimingDay(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoadingSpinner size="lg" text="Carregando recompensas diárias..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaGift className="text-primary mr-2" />
            Recompensas Diárias
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-6">
            <FaExclamationTriangle className="mx-auto text-yellow-500 text-4xl mb-4" />
            <p className="text-gray-300 mb-4">{error}</p>
            <Button 
              variant="primary" 
              onClick={fetchDailyRewards} 
            >
              Tentar Novamente
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!rewardsData || !rewardsData.rewards || !userData?.steam_id) {
    return (
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaGift className="text-primary mr-2" />
            Recompensas Diárias
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-6">
            <FaGift className="mx-auto text-gray-400 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {!userData?.steam_id 
                ? 'Steam ID não configurado' 
                : 'Recompensas não disponíveis'}
            </h3>
            <p className="text-gray-400 mb-4">
              {!userData?.steam_id 
                ? 'Configure seu Steam ID para acessar recompensas diárias.' 
                : 'Não foi possível carregar as recompensas diárias.'}
            </p>
            {!userData?.steam_id && (
              <Button 
                variant="primary"
                onClick={() => onEditSteamId && onEditSteamId()}
              >
                Configurar Steam ID
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaGift className="text-primary mr-2" />
            Recompensas Diárias
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {/* Status do jogador */}
          <div className="mb-6 bg-dark-400/50 p-4 rounded-lg border border-dark-300">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className="text-white font-medium">Progresso Diário</h4>
                <p className="text-gray-400 text-sm">
                  Dias consecutivos: <span className="text-primary font-bold">{rewardsData.status.consecutive_days}</span>
                </p>
              </div>
              {rewardsData.status.vip_status !== 'none' && (
                <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                  Status VIP: {rewardsData.status.vip_status}
                </div>
              )}
            </div>
            <div className="bg-dark-300 h-2 rounded-full mt-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${(rewardsData.status.consecutive_days / 7) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Visualização das recompensas */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
            {rewardsData.rewards.map((reward, idx) => (
              <div 
                key={idx} 
                className={`relative border rounded-lg overflow-hidden ${
                  reward.claimed 
                    ? 'border-green-500 bg-green-500/10' 
                    : reward.available 
                    ? 'border-primary bg-primary/10 animate-pulse' 
                    : 'border-dark-300 bg-dark-400/50'
                }`}
              >
                <div className="p-3 text-center">
                  <div className="text-white font-medium mb-1">Dia {reward.day}</div>
                  <div className="space-y-2">
                    {reward.items.map((item, itemIdx) => (
                      <div 
                        key={itemIdx}
                        className={`text-sm ${item.isVip ? 'text-primary' : 'text-gray-300'}`}
                      >
                        {item.name} x{item.amount}
                      </div>
                    ))}
                  </div>
                  
                  {reward.available && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleClaimReward(reward.day)}
                      className="w-full mt-4"
                      loading={claimingDay === reward.day}
                      disabled={claimingDay !== null}
                    >
                      Resgatar
                    </Button>
                  )}
                  
                  {reward.claimed && (
                    <div className="mt-4 text-green-500 font-medium text-sm">
                      Resgatado ✓
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Histórico de Recompensas */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaHistory className="text-primary mr-2" />
            Histórico de Recompensas
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {rewardsData.history && rewardsData.history.length > 0 ? (
            <div className="bg-dark-400/50 p-3 rounded-lg border border-dark-300 max-h-60 overflow-y-auto">
              {rewardsData.history.map((reward, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-dark-300 last:border-0">
                  <div className="text-gray-300">
                    {reward.reward_item} x{reward.reward_amount}
                    <span className="text-xs ml-2 text-gray-400">Dia {reward.day}</span>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {new Date(reward.claimed_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400">
                Ainda não há histórico de recompensas resgatadas.
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Recompensas Pendentes */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaInbox className="text-primary mr-2" />
            Recompensas Pendentes
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="text-center p-4 bg-dark-400/70 rounded-lg border border-dark-300">
            <p className="text-gray-300 mb-3">
              Entre no servidor para receber suas recompensas pendentes. Use o comando:
            </p>
            <div className="bg-dark-300 p-3 rounded font-mono text-primary text-sm mb-3">
              /recompensas
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText('/recompensas');
                toast.success('Comando copiado!');
              }}
            >
              <FaClipboard className="mr-2" />
              Copiar Comando
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

// Steam ID Editor Modal Component
const SteamIdModal = ({ isOpen, onClose, steamId, setSteamId, onSave, loading, isNewUser }) => {
  // Validate SteamID format to provide visual feedback
  const isValidFormat = !steamId || validateSteamId(steamId);
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isNewUser ? "Seja bem-vindo! Configure seu Steam ID" : "Editar Steam ID"}
      closeOnOverlayClick={!isNewUser}
      footer={
        <>
          {!isNewUser && (
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="hover:bg-dark-200"
            >
              Cancelar
            </Button>
          )}
          <Button
            variant="primary"
            onClick={onSave}
            loading={loading}
            disabled={!isValidFormat || !steamId}
            className="px-6 shadow-lg hover:shadow-primary/20"
          >
            {isNewUser ? "Salvar e Continuar" : "Salvar"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {isNewUser && (
          <div className="bg-gradient-to-r from-primary/10 to-dark-300 p-5 rounded-lg border border-primary/20">
            <h3 className="font-medium text-white text-lg mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Bem-vindo à Phanteon Games!
            </h3>
            <p className="text-gray-300">
              Para concluir seu cadastro e aproveitar todas as funcionalidades, precisamos que você configure seu Steam ID.
            </p>
          </div>
        )}
        
        <div className="flex items-center space-x-3 bg-dark-400/40 p-4 rounded-lg">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-dark-400 flex items-center justify-center border border-dark-200">
            <FaSteam className="text-xl text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-white">Vinculação de conta Steam</h4>
            <p className="text-gray-400 text-sm">
              Para ativar seu VIP no servidor, precisamos do seu Steam ID de 17 dígitos.
            </p>
          </div>
        </div>
        
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-200">
          <div className="flex flex-col space-y-3">
            <label htmlFor="steamId" className="block text-gray-300 font-medium">
              Steam ID (17 dígitos)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSteam className="text-gray-400" />
              </div>
              <input
                id="steamId"
                type="text"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                className={`pl-10 w-full bg-dark-300 border-2 ${
                  steamId && !isValidFormat ? 'border-red-500' : 'border-dark-200'
                } focus:border-primary rounded-md p-3 text-white focus:outline-none transition duration-200`}
                placeholder="76561198xxxxxxxxx"
              />
            </div>
            {steamId && !isValidFormat ? (
              <p className="text-sm text-red-400 flex items-center">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" fill="currentColor" fillOpacity="0.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Steam ID deve conter exatamente 17 dígitos numéricos
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Certifique-se de que seu Steam ID tenha exatamente 17 dígitos numéricos
              </p>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-dark-300 to-dark-400 rounded-lg p-4 border border-dark-200">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-primary mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <p className="text-gray-300 text-sm">
                Para encontrar seu Steam ID, acesse{' '}
                <a
                  href="https://steamid.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  steamid.io
                </a>{' '}
                e insira o link do seu perfil.
              </p>
              <p className="text-gray-400 text-xs mt-1">O Steam ID está no formato "steamID64" e contém 17 dígitos.</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ==========================================
// FUNÇÕES AUXILIARES - Utilitários adicionais
// ==========================================

// Gera a lista de benefícios com base no ID do plano
const generateBenefitsList = (planId) => {
  // VIP Básico
  const basicBenefits = [
    'Acesso ao plugin Furnace Splitter',
    'Prioridade na fila do servidor',
    'Acesso a eventos exclusivos para VIP Basic',
    'Badge exclusiva no Discord',
    'Cargo exclusivo no Discord',
    'Kit básico a cada wipe',
  ];
  
  // VIP Plus (inclui todos os benefícios do VIP Básico + extras)
  const plusBenefits = [
    ...basicBenefits,
    'Acesso ao plugin QuickSmelt',
    'Prioridade máxima na fila do servidor',
    'Sorteios mensais de skins do jogo',
    'Acesso a salas exclusivas no Discord',
    'Suporte prioritário',
    'Kit avançado a cada wipe',
  ];
  
  // Mapeamento de UUIDs para identificadores de planos
  const planIdToType = {
    '0b81cf06-ed81-49ce-8680-8f9d9edc932e': 'basic', // VIP Basic
    '3994ff53-f110-4c8f-a492-ad988528006f': 'plus',  // VIP Plus
    'vip-basic': 'basic',
    'vip-plus': 'plus'
  };
  
  const planType = planIdToType[planId] || 'basic';
  
  return planType === 'plus' ? plusBenefits : basicBenefits;
};

// Componente de verificação (check)
const FaCheck = ({ className }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
    </svg>
  );
};

// Componente de caixa de entrada (inbox)
const FaInbox = ({ className }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd"></path>
    </svg>
  );
};

// Componente de vínculo (link)
const FaLink = ({ className }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"></path>
    </svg>
  );
};

// Componente de área de transferência (clipboard)
const FaClipboard = ({ className }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
    </svg>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL - Refatorado com otimizações
// ==========================================

export default function PerfilPage({ userData, subscriptionData, subscriptionHistory = [], serverData, errorMessage, newUser }) {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Estado para gerenciamento de tabs
  const [activeTab, setActiveTab] = useState('vip');
  
  // Estados para gerenciamento do SteamID
  const [steamId, setSteamId] = useState(userData?.steam_id || '');
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(newUser === true || !userData?.steam_id);

  // Definição das tabs
  const tabs = [
    { id: 'vip', label: 'Assinatura VIP', icon: <FaCrown /> },
    { id: 'profile', label: 'Meu Perfil', icon: <FaUser /> },
    { id: 'server', label: 'Estatísticas do Servidor', icon: <FaServer /> },
    { id: 'rewards', label: 'Recompensas Diárias', icon: <FaGift /> },
  ];

  // Effect para exibir mensagens de erro
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  // Effect para gerenciar o estado do SteamID e o modal
  useEffect(() => {
    if (userData?.steam_id) {
      setSteamId(userData.steam_id);
    }
  
    // Gerenciar abertura do modal apenas se o componente estiver montado
    const shouldOpenModal = newUser === true || !userData?.steam_id;
    if (shouldOpenModal) {
      setIsEditModalOpen(true);
    }
  }, [userData, newUser]);

  // Handler para salvar o SteamID
  const handleSaveSteamId = useCallback(async () => {
    if (!steamId) {
      toast.error('Por favor, insira seu Steam ID');
      return;
    }
  
    if (!validateSteamId(steamId)) {
      toast.error('Steam ID inválido. Deve conter 17 dígitos numéricos');
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch('/api/user/update-steam-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ steamId }),
      });
  
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Erro (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Steam ID atualizado com sucesso!');
        setIsEditModalOpen(false);
        
        // Usar router.replace em vez de recarregar a página completamente
        router.replace(router.asPath);
      } else {
        throw new Error(data.message || 'Falha ao atualizar Steam ID');
      }
    } catch (error) {
      console.error('Erro ao atualizar Steam ID:', error);
      toast.error(error.message || 'Erro ao atualizar Steam ID');
    } finally {
      setLoading(false);
    }
  }, [steamId, router]);

  // Handler para renovação de assinatura
  const handleRenewSubscription = useCallback(() => {
    if (subscriptionData?.plan_id) {
      router.push(`/checkout/${subscriptionData.plan_id}`);
    } else {
      router.push('/planos');
    }
  }, [subscriptionData, router]);

  // Handler para upgrade de plano
  const handleUpgradeSubscription = useCallback(() => {
    // Se o plano atual é o básico, direcionar para o plus
    if (subscriptionData?.plan_id === '0b81cf06-ed81-49ce-8680-8f9d9edc932e') {
      router.push('/checkout/vip-plus');
    } else {
      // Se for outro plano, direcionar para a página geral de planos
      router.push('/planos');
    }
  }, [subscriptionData, router]);

  // Handlers para o modal de edição do SteamID
  const handleCloseEditModal = useCallback(() => {
    if (userData?.steam_id) {
      setIsEditModalOpen(false);
    } else {
      toast.info('É necessário configurar seu Steam ID para acessar todas as funcionalidades do site.');
    }
  }, [userData]);

  const handleOpenEditModal = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  return (
    <>
      <Head>
        <title>Meu Perfil | Phanteon Games</title>
      </Head>

      <div className="container-custom mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-white mb-2">Meu Perfil</h1>
        <p className="text-gray-400 mb-8">
          Gerencie suas informações, assinaturas VIP e acompanhe seu progresso nos servidores
        </p>
        
        {/* Seletor de Tabs */}
        <div className="mb-8">
          <TabSelector 
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
        
        {/* Conteúdo das Tabs */}
        <TabContent 
          activeTab={activeTab}
          userData={userData}
          session={session}
          subscriptionData={subscriptionData}
          serverData={serverData}
          onEditSteamId={handleOpenEditModal}
          onRenewSubscription={handleRenewSubscription}
          onUpgradeSubscription={handleUpgradeSubscription}
          subscriptionHistory={subscriptionHistory}
        />
      </div>

      {/* Modal de Edição do SteamID */}
      <SteamIdModal 
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        steamId={steamId}
        setSteamId={setSteamId}
        onSave={handleSaveSteamId}
        loading={loading}
        isNewUser={newUser}
      />
    </>
  );
}

// Busca de dados no servidor
export async function getServerSideProps(context) {
  // Verificar autenticação do usuário
  const authResult = await requireAuth(context);
  
  // Redirecionar se o usuário não estiver autenticado
  if (authResult.redirect) {
    console.log('[Perfil] Redirecionando usuário não autenticado');
    return authResult;
  }
  
  const session = authResult.props.session;
  
  if (!session?.user?.discord_id) {
    console.error('[Perfil] Sessão sem discord_id!', { session });
    return {
      redirect: {
        destination: '/api/auth/signin?error=missing_discord_id',
        permanent: false,
      },
    };
  }
  
  try {
    const discordId = session.user.discord_id.toString();
    
    console.log('[Perfil] Buscando perfil para discord_id:', discordId);
    
    // Obter dados do usuário via função auxiliar
    const userData = await getUserByDiscordId(discordId);
    
    if (!userData) {
      console.error('[Perfil] Usuário não encontrado no banco de dados');
      
      // Tentar sincronizar dados novamente
      const syncResult = await syncUserData({
        id: discordId,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image
      });
      
      if (!syncResult) {
        console.error('[Perfil] Falha ao sincronizar dados do usuário');
        
        // Em vez de mostrar um erro, retornar dados parciais
        return {
          props: {
            // Criar um objeto userData parcial com dados da sessão
            userData: {
              discord_id: discordId,
              name: session.user.name,
              email: session.user.email,
              discord_avatar: session.user.image,
              steam_id: null // Explicitamente nulo para indicar necessidade de configuração
            },
            subscriptionData: null,
            subscriptionHistory: [],
            newUser: true // Adicionar flag para indicar usuário novo
          },
        };
      }
      
      // Buscar novamente após sincronização
      const syncedUserData = await getUserByDiscordId(discordId);
      
      if (!syncedUserData) {
        console.error('[Perfil] Usuário ainda não encontrado após sincronização');
        
        // Mesmo tratamento que acima
        return {
          props: {
            userData: {
              discord_id: discordId,
              name: session.user.name,
              email: session.user.email,
              discord_avatar: session.user.image,
              steam_id: null
            },
            subscriptionData: null,
            subscriptionHistory: [],
            newUser: true
          },
        };
      }
      
      console.log('[Perfil] Usuário sincronizado com sucesso:', syncedUserData.id);
      
      // Buscar dados de assinatura ativa usando o UUID correto
      const subscriptionData = await getUserSubscription(syncedUserData.id);
      
      // Buscar histórico de assinaturas
      const { data: subscriptionHistory, error: historyError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', syncedUserData.id)
        .order('created_at', { ascending: false });
      
      if (historyError) {
        console.error('[Perfil] Erro ao buscar histórico de assinaturas:', historyError);
      }
      
      // Processar dados para garantir serialização
      const processedSubscription = subscriptionData ? {
        ...subscriptionData,
        created_at: subscriptionData.created_at ? new Date(subscriptionData.created_at).toISOString() : null,
        updated_at: subscriptionData.updated_at ? new Date(subscriptionData.updated_at).toISOString() : null,
        expires_at: subscriptionData.expires_at ? new Date(subscriptionData.expires_at).toISOString() : null
      } : null;
      
      // Processar histórico para garantir serialização
      const processedHistory = subscriptionHistory ? subscriptionHistory.map(sub => ({
        ...sub,
        created_at: sub.created_at ? new Date(sub.created_at).toISOString() : null,
        updated_at: sub.updated_at ? new Date(sub.updated_at).toISOString() : null,
        expires_at: sub.expires_at ? new Date(sub.expires_at).toISOString() : null
      })) : [];
      
      return {
        props: {
          userData: syncedUserData || null,
          subscriptionData: processedSubscription,
          subscriptionHistory: processedHistory,
        },
      };
    }
    
    console.log('[Perfil] Usuário encontrado, id:', userData.id);
    
    // Buscar dados de assinatura ativa usando o UUID correto
    const subscriptionData = await getUserSubscription(userData.id);
    
    // Buscar histórico de assinaturas
    const { data: subscriptionHistory, error: historyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });
    
    if (historyError) {
      console.error('[Perfil] Erro ao buscar histórico de assinaturas:', historyError);
    }
    
    // Processar dados para garantir serialização
    const processedSubscription = subscriptionData ? {
      ...subscriptionData,
      created_at: subscriptionData.created_at ? new Date(subscriptionData.created_at).toISOString() : null,
      updated_at: subscriptionData.updated_at ? new Date(subscriptionData.updated_at).toISOString() : null,
      expires_at: subscriptionData.expires_at ? new Date(subscriptionData.expires_at).toISOString() : null
    } : null;
    
    // Processar histórico para garantir serialização
    const processedHistory = subscriptionHistory ? subscriptionHistory.map(sub => ({
      ...sub,
      created_at: sub.created_at ? new Date(sub.created_at).toISOString() : null,
      updated_at: sub.updated_at ? new Date(sub.updated_at).toISOString() : null,
      expires_at: sub.expires_at ? new Date(sub.expires_at).toISOString() : null
    })) : [];
    
    // Aqui poderíamos buscar dados do servidor, se necessário
    // Por enquanto, retornamos null para serverData
    
    return {
      props: {
        userData: userData || null,
        subscriptionData: processedSubscription,
        subscriptionHistory: processedHistory,
        serverData: null,
      },
    };
  } catch (error) {
    console.error('[Perfil] Erro ao buscar dados do perfil:', error);
    
    return {
      props: {
        userData: {
          discord_id: session.user.discord_id.toString(),
          name: session.user.name,
          email: session.user.email,
          discord_avatar: session.user.image,
          steam_id: null
        },
        subscriptionData: null,
        subscriptionHistory: [],
        errorMessage: 'Ocorreu um erro ao carregar seus dados. Você pode continuar configurando seu perfil.'
      },
    };
  }
}