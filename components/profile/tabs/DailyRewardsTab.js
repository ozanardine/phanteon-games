// components/profile/tabs/DailyRewardsTab.js
import React, { useState, useEffect, useCallback } from 'react';
import { FaGift, FaHistory, FaExclamationTriangle, FaInbox, FaClipboard, FaCrown, FaLock, FaCheck, FaCalendarAlt } from 'react-icons/fa';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import VipBadge from '../../ui/VipBadge';
import { useRouter } from 'next/router';
import Modal from '../../ui/Modal';

const DailyRewardsTab = ({ userData, onEditSteamId }) => {
  const [rewardsData, setRewardsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingDay, setClaimingDay] = useState(null);
  const [pendingRewards, setPendingRewards] = useState([]);
  const [isShowingClaimModal, setIsShowingClaimModal] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState(null);
  const [isFetchingPending, setIsFetchingPending] = useState(false);
  const router = useRouter();

  // Função para carregar recompensas diárias
  const fetchDailyRewards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fazer requisição para API de recompensas diárias
      const response = await fetch('/api/rewards/daily');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validar e normalizar os dados recebidos
      if (data.success) {
        // Garantir que rewards seja um array
        if (!Array.isArray(data.rewards)) {
          console.warn('API retornou rewards em formato incorreto. Convertendo para array vazio.');
          data.rewards = [];
        }
        
        // Garantir que cada reward tenha items como array
        data.rewards = data.rewards.map(reward => {
          if (!Array.isArray(reward.items)) {
            reward.items = [];
          }
          return reward;
        });
        
        setRewardsData(data);
      } else {
        throw new Error(data.message || 'Falha ao carregar recompensas diárias');
      }
    } catch (err) {
      console.error('Erro ao buscar recompensas diárias:', err);
      setError(err.message || 'Falha ao buscar recompensas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para buscar recompensas pendentes
  const fetchPendingRewards = useCallback(async () => {
    try {
      setIsFetchingPending(true);
      const response = await fetch('/api/rewards/pending');
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar recompensas pendentes (${response.status})`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPendingRewards(data.pendingRewards || []);
      } else {
        console.warn('Falha ao buscar recompensas pendentes:', data.message);
        setPendingRewards([]);
      }
    } catch (err) {
      console.error('Erro ao buscar recompensas pendentes:', err);
      // Não mostrar erro para o usuário, apenas log para debug
    } finally {
      setIsFetchingPending(false);
    }
  }, []);

  // Efeito para carregar dados na montagem do componente
  useEffect(() => {
    fetchDailyRewards();
    fetchPendingRewards();
    
    // Configurar intervalo para atualizar recompensas pendentes a cada 30s
    const pendingInterval = setInterval(() => {
      fetchPendingRewards();
    }, 30000);
    
    return () => clearInterval(pendingInterval);
  }, [fetchDailyRewards, fetchPendingRewards]);

  // Função para reivindicar recompensa
  const handleClaimReward = async (day) => {
    if (claimingDay) return; // Evitar cliques duplos
    
    try {
      setClaimingDay(day);
      
      // Requisição para API de reivindicação
      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          day,
          timestamp: new Date().toISOString() // Adicionar timestamp para tracking
        }),
      });
      
      // Processar resposta
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao reivindicar recompensa (${response.status})`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Mostrar modal com recompensas reivindicadas
        setClaimedRewards(data.rewards);
        setIsShowingClaimModal(true);
        
        // Atualizar os dados locais
        setRewardsData(prevData => {
          if (!prevData || !Array.isArray(prevData.rewards)) return prevData;
          
          // Atualizar status e dados do jogador
          const updatedStatus = data.status || prevData.status;
          
          // Atualizar array de recompensas
          const updatedRewards = prevData.rewards.map(reward => {
            if (reward.day === day) {
              return { ...reward, claimed: true, available: false };
            } else if (reward.day === day + 1) {
              // Tornar o próximo dia disponível
              return { ...reward, available: true };
            }
            return reward;
          });
          
          return {
            ...prevData,
            status: updatedStatus,
            rewards: updatedRewards
          };
        });
        
        // Buscar recompensas pendentes após reivindicação
        setTimeout(() => {
          fetchPendingRewards();
        }, 1000);
      } else {
        throw new Error(data.message || 'Falha desconhecida ao reivindicar recompensa');
      }
    } catch (err) {
      console.error('Erro ao reivindicar recompensa:', err);
      toast.error(err.message || 'Falha ao reivindicar recompensa');
    } finally {
      setClaimingDay(null);
    }
  };

  // Verificar se o usuário é VIP PLUS
  const isVipPlus = rewardsData?.status?.vip_status === 'vip-plus';
  
  // Formatar data para exibição
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Renderização condicional para estados de loading e erro
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

  // Verificar se o usuário tem Steam ID configurado
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
                onClick={onEditSteamId}
              >
                Configurar Steam ID
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Exibir bloqueio para usuários não-VIP Plus
  if (!isVipPlus) {
    return (
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaGift className="text-primary mr-2" />
            Recompensas Diárias
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-8">
            <div className="relative inline-block mb-6">
              <FaLock className="text-gray-600 text-6xl" />
              <div className="absolute -top-2 -right-2">
                <VipBadge plan="vip-plus" size={28} />
              </div>
            </div>
            
            <h3 className="text-xl font-medium text-white mb-3">
              Recurso Exclusivo para VIP PLUS
            </h3>
            
            <div className="max-w-lg mx-auto">
              <p className="text-gray-300 mb-4">
                As recompensas diárias pelo site são um benefício exclusivo para assinantes VIP PLUS.
              </p>
              
              <div className="bg-dark-400/50 p-4 rounded-lg border border-primary/30 mb-6">
                <h4 className="text-primary font-medium mb-2 flex items-center">
                  <FaCrown className="mr-2" /> Vantagens do VIP PLUS:
                </h4>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>• Resgate suas recompensas diárias diretamente pelo site</li>
                  <li>• Não precisa esperar 30 minutos dentro do jogo</li>
                  <li>• Recompensas exclusivas e em maior quantidade</li>
                  <li>• Acesso a todos os outros benefícios VIP</li>
                </ul>
              </div>
            </div>
            
            <Button 
              variant="primary"
              size="lg"
              onClick={() => router.push('/planos')}
              className="mt-2"
            >
              Adquirir VIP PLUS
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Garantir que rewards seja sempre um array
  const rewards = Array.isArray(rewardsData.rewards) ? rewardsData.rewards : [];

  // Componente principal para usuários VIP Plus
  return (
    <div className="space-y-8">
      {/* Status e progresso do jogador */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaGift className="text-primary mr-2" />
            Recompensas Diárias <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">Exclusivo VIP PLUS</span>
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {/* Status do jogador */}
          <div className="mb-6 bg-dark-400/50 p-4 rounded-lg border border-dark-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <h4 className="text-white font-medium">Progresso Diário</h4>
                <div className="flex items-center mt-1">
                  <p className="text-gray-400 text-sm">
                    Dias consecutivos: <span className="text-primary font-bold">{rewardsData.status.consecutive_days}</span>
                  </p>
                  <div className="ml-3 px-3 py-1 bg-dark-400 rounded-full flex items-center">
                    <FaCalendarAlt className="text-primary mr-1" />
                    <span className="text-gray-300 text-xs">
                      Último resgate: {
                        rewardsData.status.last_claim_date 
                          ? formatDate(rewardsData.status.last_claim_date)
                          : 'Nunca'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-2 md:mt-0 flex items-center">
                <VipBadge plan={rewardsData.status.vip_status} size={24} className="mr-2" />
                <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                  Status VIP: {rewardsData.status.vip_status === 'vip-plus' ? 'VIP PLUS' : 'VIP Básico'}
                </div>
              </div>
            </div>
            
            {/* Barra de progresso */}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Dia 1</span>
                <span>Dia 7</span>
              </div>
              <div className="relative">
                <div className="bg-dark-300 h-2 rounded-full">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (rewardsData.status.consecutive_days / 7) * 100)}%` }}
                  ></div>
                </div>
                
                {/* Marcadores de dias */}
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <div 
                    key={day}
                    className={`absolute w-3 h-3 rounded-full -mt-2.5 transform -translate-x-1/2 ${
                      rewardsData.status.consecutive_days >= day 
                        ? 'bg-primary' 
                        : day === rewardsData.status.consecutive_days + 1
                        ? 'bg-primary animate-pulse' 
                        : 'bg-dark-200'
                    }`}
                    style={{ left: `${((day - 1) / 6) * 100}%` }}
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Explicação e Reset */}
            <div className="flex flex-col md:flex-row justify-between mt-4 text-xs text-gray-400">
              <div>
                Mantenha seus dias consecutivos entrando diariamente para desbloquear recompensas melhores.
              </div>
              <div>
                Próximo reset: {rewardsData.status.next_reset_time ? formatDate(rewardsData.status.next_reset_time) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Cards de recompensas */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
            {rewards.map((reward, idx) => (
              <div 
                key={idx} 
                className={`relative border rounded-lg overflow-hidden ${
                  reward.claimed 
                    ? 'border-green-500 bg-green-500/10' 
                    : reward.available 
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 pulse-animation' 
                    : 'border-dark-300 bg-dark-400/50'
                }`}
              >
                {/* Tag do dia */}
                <div className="absolute top-0 left-0 bg-dark-300 px-2 py-0.5 text-xs font-medium rounded-br">
                  Dia {reward.day}
                </div>
                
                <div className="p-3 pt-5 text-center">
                  {/* Itens da recompensa */}
                  <div className="space-y-2 min-h-[80px]">
                    {Array.isArray(reward.items) && reward.items.length > 0 ? (
                      reward.items.map((item, itemIdx) => (
                        <div 
                          key={itemIdx}
                          className={`text-sm ${item.isVip ? 'text-primary' : 'text-gray-300'}`}
                        >
                          {item.name} <span className="font-bold">x{item.amount}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-400">Sem itens definidos</div>
                    )}
                  </div>
                  
                  {/* Botão de resgate */}
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
                  
                  {/* Status de resgatado */}
                  {reward.claimed && (
                    <div className="flex items-center justify-center mt-4 text-green-500 font-medium text-sm">
                      <FaCheck className="mr-1" /> Resgatado
                    </div>
                  )}
                  
                  {/* Indisponível */}
                  {!reward.available && !reward.claimed && (
                    <div className="mt-4 text-gray-500 font-medium text-sm px-2 py-1 bg-dark-400 rounded-full">
                      {rewardsData.status.consecutive_days < reward.day - 1
                        ? 'Bloqueado'
                        : 'Aguardando'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Recompensas Pendentes */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaInbox className="text-primary mr-2" />
            Recompensas Pendentes
            {pendingRewards.length > 0 && (
              <span className="ml-2 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {pendingRewards.length}
              </span>
            )}
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {isFetchingPending ? (
            <div className="flex justify-center p-4">
              <LoadingSpinner size="sm" text="Verificando recompensas pendentes..." />
            </div>
          ) : pendingRewards.length > 0 ? (
            <div>
              <div className="bg-primary/10 border border-primary/30 p-4 mb-4 rounded-lg">
                <p className="text-white flex items-start">
                  <FaGift className="text-primary mt-1 mr-2 flex-shrink-0" />
                  <span>
                    Você tem <strong>{pendingRewards.length}</strong> recompensa(s) pendente(s) para receber no jogo.
                    Entre no servidor para recebê-las automaticamente.
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingRewards.map((reward, idx) => (
                  <div key={idx} className="bg-dark-400/70 p-3 rounded-lg border border-dark-300 flex justify-between">
                    <div>
                      <div className="text-white font-medium">Recompensa do Dia {reward.day}</div>
                      <div className="text-gray-400 text-sm">
                        Resgatada em: {formatDate(reward.requested_at)}
                      </div>
                    </div>
                    <div className="bg-yellow-500/20 text-yellow-500 px-2 py-1 h-fit rounded-full text-xs">
                      Pendente
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-4 bg-dark-400/70 rounded-lg border border-dark-300">
              <p className="text-gray-300 mb-3">
                Nenhuma recompensa pendente. Entre no servidor para receber futuras recompensas com o comando:
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
          )}
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
                    {reward.reward_item} <span className="font-bold">x{reward.reward_amount}</span>
                    <span className="text-xs ml-2 text-gray-400">Dia {reward.day}</span>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {formatDate(reward.claimed_at)}
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

      {/* Modal de confirmação de resgate */}
      <Modal
        isOpen={isShowingClaimModal}
        onClose={() => setIsShowingClaimModal(false)}
        title="Recompensa Resgatada com Sucesso!"
        footer={
          <Button
            variant="primary"
            onClick={() => setIsShowingClaimModal(false)}
          >
            Entendi
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <FaGift className="text-primary text-3xl" />
            </div>
          </div>
          
          <p className="text-center text-white">
            Parabéns! Você resgatou as seguintes recompensas:
          </p>
          
          <div className="bg-dark-400/70 p-4 rounded-lg">
            <h4 className="text-primary font-medium mb-2">Itens Resgatados:</h4>
            <div className="space-y-2">
              {claimedRewards && claimedRewards.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-300">{item.name}</span>
                  <span className="text-white font-bold">x{item.amount}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-yellow-500/20 text-yellow-500 p-3 rounded-lg text-sm">
            <p className="flex items-start">
              <FaExclamationTriangle className="mt-1 mr-2 flex-shrink-0" />
              <span>
                Para receber estes itens, você precisa entrar no servidor de Rust. 
                Os itens serão entregues automaticamente quando você conectar.
              </span>
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DailyRewardsTab;