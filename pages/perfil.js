// pages/perfil.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SubscriptionStatus from '../components/subscriptions/SubscriptionStatus';
import Modal from '../components/ui/Modal';
import { FaDiscord, FaSteam, FaUser, FaHistory, FiClock, FiCalendar, FiGift, FiPackage, FiChevronRight } from 'react-icons/fa';
import { getUserByDiscordId, getUserSubscription, supabase } from '../lib/supabase';
import { requireAuth, syncUserData } from '../lib/auth';

// ==========================================
// UTILITY FUNCTIONS - Separated from component logic
// ==========================================

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

// Validates SteamID format: must be 17 digits
const validateSteamId = (steamId) => {
  return steamId && steamId.match(/^[0-9]{17}$/);
};

// ==========================================
// MODULAR COMPONENTS - Separated for better maintainability
// ==========================================

// Novo componente para exibir recompensas diárias
const DailyRewards = () => {
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
      <Card>
        <Card.Body>
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Recompensas Diárias</Card.Title>
        </Card.Header>
        <Card.Body>
          <p className="text-center text-red-400">{error}</p>
          <Button 
            variant="primary" 
            onClick={fetchDailyRewards} 
            className="mt-4 mx-auto block"
          >
            Tentar Novamente
          </Button>
        </Card.Body>
      </Card>
    );
  }

  if (!rewardsData || !rewardsData.rewards) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Recompensas Diárias</Card.Title>
        </Card.Header>
        <Card.Body>
          <p className="text-center text-gray-400">Nenhuma recompensa disponível no momento.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <Card.Header>
        <Card.Title>Recompensas Diárias</Card.Title>
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
        <div className="grid grid-cols-7 gap-2">
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

        {/* Histórico de recompensas */}
        {rewardsData.history && rewardsData.history.length > 0 && (
          <div className="mt-6">
            <h4 className="text-white font-medium mb-3">Histórico de Recompensas</h4>
            <div className="bg-dark-400/50 p-3 rounded-lg border border-dark-300 max-h-40 overflow-y-auto">
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
          </div>
        )}
        
        {/* Recompensas pendentes */}
        <div className="mt-6 text-center p-3 bg-dark-400/70 rounded-lg border border-dark-300">
          <p className="text-gray-300 text-sm">
            Entre no servidor para receber suas recompensas pendentes. Use o comando:
          </p>
          <div className="bg-dark-300 p-2 mt-2 rounded font-mono text-primary text-sm">
            /recompensas
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// User Profile Card Component
const UserProfileCard = ({ userData, session, steamId, onEditSteamId, onViewHistory }) => {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Informações Pessoais</Card.Title>
      </Card.Header>
      <Card.Body>
        <div className="flex flex-col items-center mb-6">
          {session?.user?.image ? (
            <div className="relative h-24 w-24 rounded-full overflow-hidden mb-4">
              <Image 
                src={session.user.image} 
                alt={session.user.name} 
                fill 
                className="object-cover"
              />
            </div>
          ) : (
            <div className="bg-dark-200 h-24 w-24 rounded-full flex items-center justify-center mb-4">
              <FaUser className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <h2 className="text-xl font-bold text-white">{session?.user?.name}</h2>
          <p className="text-gray-400 text-sm">{session?.user?.email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center mb-2">
              <FaDiscord className="text-primary mr-2" />
              <span className="text-gray-300 font-medium">Discord ID</span>
            </div>
            <p className="bg-dark-400 p-2 rounded text-gray-400 text-sm break-all">
              {session?.user?.discord_id || 'Não disponível'}
            </p>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <FaSteam className="text-primary mr-2" />
              <span className="text-gray-300 font-medium">Steam ID</span>
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
        </div>
      </Card.Body>
      <Card.Footer className="flex justify-between">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onViewHistory}
          className="flex items-center"
        >
          <FaHistory className="mr-2" />
          Histórico
        </Button>
      </Card.Footer>
    </Card>
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
                
                  href="https://steamid.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                <a>
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

// Subscription History Modal Component
const HistoryModal = ({ isOpen, onClose, history, loading }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Histórico de Assinaturas"
      size="lg"
    >
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : history.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200">
                <th className="py-2 px-4 text-left text-gray-300">Plano</th>
                <th className="py-2 px-4 text-left text-gray-300">Data</th>
                <th className="py-2 px-4 text-left text-gray-300">Expiração</th>
                <th className="py-2 px-4 text-left text-gray-300">Valor</th>
                <th className="py-2 px-4 text-left text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((sub) => (
                <tr key={sub.id} className="border-b border-dark-200">
                  <td className="py-3 px-4 text-white">{sub.plan_name}</td>
                  <td className="py-3 px-4 text-gray-400">
                    {formatDate(sub.created_at)}
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    {formatDate(sub.expires_at)}
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    R$ {parseFloat(sub.amount || sub.price || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
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
        <div className="text-center py-8">
          <p className="text-gray-400">
            Você ainda não possui histórico de assinaturas.
          </p>
        </div>
      )}
    </Modal>
  );
};

// VIP Instructions Component
const VipInstructions = () => {
  return (
    <Card className="mt-8">
      <Card.Header>
        <Card.Title>Como usar seu VIP</Card.Title>
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
        </div>
      </Card.Body>
    </Card>
  );
};

// ==========================================
// MAIN COMPONENT - Refactored with optimizations
// ==========================================

export default function PerfilPage({ userData, subscriptionData, errorMessage, newUser }) {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State management - kept minimal and focused
  const [steamId, setSteamId] = useState(userData?.steam_id || '');
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(newUser === true || !userData?.steam_id);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Memoize the state for whether the user has active subscription
  const hasActiveSubscription = useMemo(() => {
    return subscriptionData && subscriptionData.status === 'active';
  }, [subscriptionData]);

  // Effect for displaying error messages
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  // Effect for managing SteamID state and modal
  useEffect(() => {
    if (userData?.steam_id) {
      setSteamId(userData.steam_id);
    }
  
    // Safely handle modal opening - only if component is mounted
    const shouldOpenModal = newUser === true || !userData?.steam_id;
    if (shouldOpenModal) {
      setIsEditModalOpen(true);
    }
  }, [userData, newUser]);

  // Effect for loading subscription history
  useEffect(() => {
    // Only load history if we have the necessary data
    const loadSubscriptionHistory = async () => {
      if (!session?.user?.discord_id || !userData?.id) return;
    
      try {
        setIsHistoryLoading(true);
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false });
    
        if (error) throw error;
        
        const processedData = data.map(subscription => ({
          ...subscription,
          amount: subscription.amount || subscription.price || 0,
          created_at_formatted: new Date(subscription.created_at).toLocaleDateString('pt-BR'),
          expires_at_formatted: new Date(subscription.expires_at).toLocaleDateString('pt-BR'),
          status_text: subscription.status === 'active' ? 'Ativo' : 
                      subscription.status === 'pending' ? 'Pendente' : 'Expirado'
        }));
        
        setSubscriptionHistory(processedData || []);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        toast.error('Não foi possível carregar o histórico de assinaturas');
      } finally {
        setIsHistoryLoading(false);
      }
    };
  
    loadSubscriptionHistory();
  }, [session, userData]);

  // Optimized event handlers with useCallback
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
        
        // Use router.replace instead of window.location.reload to avoid full page reload
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

  const handleRenewSubscription = useCallback(() => {
    if (subscriptionData?.plan_id) {
      router.push(`/checkout/${subscriptionData.plan_id}`);
    } else {
      router.push('/planos');
    }
  }, [subscriptionData, router]);

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

  const handleOpenHistoryModal = useCallback(() => {
    setIsHistoryModalOpen(true);
  }, []);

  const handleCloseHistoryModal = useCallback(() => {
    setIsHistoryModalOpen(false);
  }, []);

  return (
    <>
      <Head>
        <title>Meu Perfil | Phanteon Games</title>
      </Head>

      <div className="container-custom mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Meu Perfil</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna 1: Perfil do Usuário - Componentizado */}
          <div className="lg:col-span-1">
            <UserProfileCard 
              userData={userData}
              session={session}
              steamId={steamId}
              onEditSteamId={handleOpenEditModal}
              onViewHistory={handleOpenHistoryModal}
            />
          </div>

          {/* Coluna 2: Status da Assinatura */}
          <div className="lg:col-span-2">
            <SubscriptionStatus 
              subscription={subscriptionData} 
              onRenew={handleRenewSubscription}
            />

            {/* Instruções para VIP - Componentizado */}
            {hasActiveSubscription && <VipInstructions />}
            
            {/* Adicionar seção de recompensas diárias */}
            {userData?.steam_id && <DailyRewards />}
          </div>
        </div>
      </div>

      {/* Steam ID Modal - Componentizado */}
      <SteamIdModal 
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        steamId={steamId}
        setSteamId={setSteamId}
        onSave={handleSaveSteamId}
        loading={loading}
        isNewUser={newUser}
      />

      {/* History Modal - Componentizado */}
      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistoryModal}
        history={subscriptionHistory}
        loading={isHistoryLoading}
      />
    </>
  );
}

// Server-side data fetching
export async function getServerSideProps(context) {
  // Verify user authentication
  const authResult = await requireAuth(context);
  
  // Return redirect if user is not authenticated
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
    
    // Obtain user data via helper function
    const userData = await getUserByDiscordId(discordId);
    
    if (!userData) {
      console.error('[Perfil] Usuário não encontrado no banco de dados');
      
      // Try to synchronize data again
      const syncResult = await syncUserData({
        id: discordId,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image
      });
      
      if (!syncResult) {
        console.error('[Perfil] Falha ao sincronizar dados do usuário');
        
        // Instead of showing an error, return partial data
        return {
          props: {
            // Create a partial userData object with session data
            userData: {
              discord_id: discordId,
              name: session.user.name,
              email: session.user.email,
              discord_avatar: session.user.image,
              steam_id: null // Explicitly null to signal it needs to be configured
            },
            subscriptionData: null,
            subscriptionHistory: [],
            newUser: true // Add a flag to indicate a new user
          },
        };
      }
      
      // Fetch again after synchronization
      const syncedUserData = await getUserByDiscordId(discordId);
      
      if (!syncedUserData) {
        console.error('[Perfil] Usuário ainda não encontrado após sincronização');
        
        // Same handling as above
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
      
      // Fetch active subscription data using the correct UUID
      const subscriptionData = await getUserSubscription(syncedUserData.id);
      
      // Process data to ensure serialization
      const processedSubscription = subscriptionData ? {
        ...subscriptionData,
        created_at: subscriptionData.created_at ? new Date(subscriptionData.created_at).toISOString() : null,
        updated_at: subscriptionData.updated_at ? new Date(subscriptionData.updated_at).toISOString() : null,
        expires_at: subscriptionData.expires_at ? new Date(subscriptionData.expires_at).toISOString() : null
      } : null;
      
      return {
        props: {
          userData: syncedUserData || null,
          subscriptionData: processedSubscription,
        },
      };
    }
    
    console.log('[Perfil] Usuário encontrado, id:', userData.id);
    
    // Fetch active subscription data using the correct UUID
    const subscriptionData = await getUserSubscription(userData.id);
    
    // Process data to ensure serialization
    const processedSubscription = subscriptionData ? {
      ...subscriptionData,
      created_at: subscriptionData.created_at ? new Date(subscriptionData.created_at).toISOString() : null,
      updated_at: subscriptionData.updated_at ? new Date(subscriptionData.updated_at).toISOString() : null,
      expires_at: subscriptionData.expires_at ? new Date(subscriptionData.expires_at).toISOString() : null
    } : null;
    
    return {
      props: {
        userData: userData || null,
        subscriptionData: processedSubscription,
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
        errorMessage: 'Ocorreu um erro ao carregar seus dados. Você pode continuar configurando seu perfil.'
      },
    };
  }
}