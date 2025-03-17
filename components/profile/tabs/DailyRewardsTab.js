// components/profile/tabs/DailyRewardsTab.js
import React, { useState, useEffect } from 'react';
import { FaGift, FaHistory, FaExclamationTriangle, FaInbox, FaClipboard, FaCrown, FaLock } from 'react-icons/fa';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import VipBadge from '../../ui/VipBadge';
import { useRouter } from 'next/router';

const DailyRewardsTab = ({ userData, onEditSteamId }) => {
  const [rewardsData, setRewardsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingDay, setClaimingDay] = useState(null);
  const router = useRouter();

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

  // Verificar se o usuário é VIP PLUS
  const isVipPlus = rewardsData?.status?.vip_status === 'vip-plus';

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

  // Exibir mensagem promocional para usuários que não são VIP PLUS
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

  // Exibir recompensas para usuários VIP PLUS
  return (
    <div className="space-y-8">
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
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className="text-white font-medium">Progresso Diário</h4>
                <p className="text-gray-400 text-sm">
                  Dias consecutivos: <span className="text-primary font-bold">{rewardsData.status.consecutive_days}</span>
                </p>
              </div>
              {rewardsData.status.vip_status !== 'none' && (
                <div className="flex items-center">
                  <VipBadge plan={rewardsData.status.vip_status} size={24} className="mr-2" />
                  <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                    Status VIP: {rewardsData.status.vip_status}
                  </div>
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

export default DailyRewardsTab;