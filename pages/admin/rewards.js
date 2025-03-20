import React, { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaChartBar, FaSync } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import TabSelector from '../../components/ui/TabSelector';

export default function RewardsAdminPage({ user }) {
  // Estado para guarda os dados das recompensas
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('rewards');
  
  // Estado para edição e formulário
  const [editingReward, setEditingReward] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    day: 1,
    reward_type: 'item',
    item_name: '',
    item_shortname: '',
    amount: 1,
    vip_level: 'none',
    is_bonus: false
  });
  
  // Estados para estatísticas e logs
  const [statistics, setStatistics] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  
  const router = useRouter();
  
  // Verificar se usuário é admin
  useEffect(() => {
    if (!user) {
      return;
    }
    
    if (!user.role || user.role !== 'admin') {
      toast.error('Acesso restrito a administradores');
      router.push('/perfil');
    }
  }, [user, router]);
  
  // Carregar dados das recompensas
  useEffect(() => {
    // Só carregar se o usuário estiver presente e for admin
    if (!user || !user.role || user.role !== 'admin') return;
    
    const fetchRewards = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/admin/rewards');
        
        if (!res.ok) {
          throw new Error(`Erro ao buscar recompensas: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
          setRewards(data.rewards || []);
        } else {
          setError(data.message || 'Erro ao carregar recompensas');
        }
      } catch (err) {
        console.error('Erro ao buscar recompensas:', err);
        setError(err.message || 'Falha ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRewards();
  }, [user]);
  
  // Lidar com mudança de aba
  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    
    if (tab === 'statistics' && !statistics) {
      await fetchStatistics();
    } else if (tab === 'logs' && syncLogs.length === 0) {
      await fetchSyncLogs();
    }
  };
  
  // Buscar estatísticas
  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/admin/rewards/statistics');
      
      if (!res.ok) {
        throw new Error(`Erro ao buscar estatísticas: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setStatistics(data);
      } else {
        toast.error(data.message || 'Erro ao carregar estatísticas');
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      toast.error(err.message || 'Falha ao carregar estatísticas');
    } finally {
      setStatsLoading(false);
    }
  };
  
  // Buscar logs de sincronização
  const fetchSyncLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await fetch('/api/admin/rewards/logs');
      
      if (!res.ok) {
        throw new Error(`Erro ao buscar logs: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setSyncLogs(data.logs || []);
      } else {
        toast.error(data.message || 'Erro ao carregar logs');
      }
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
      toast.error(err.message || 'Falha ao carregar logs');
    } finally {
      setLogsLoading(false);
    }
  };
  
  // Abrir modal para adicionar nova recompensa
  const handleAddReward = () => {
    setEditingReward(null);
    setFormData({
      day: 1,
      reward_type: 'item',
      item_name: '',
      item_shortname: '',
      amount: 1,
      vip_level: 'none',
      is_bonus: false
    });
    setShowModal(true);
  };
  
  // Abrir modal para editar uma recompensa existente
  const handleEditReward = (reward) => {
    setEditingReward(reward);
    setFormData({
      day: reward.day,
      reward_type: reward.reward_type,
      item_name: reward.item_name,
      item_shortname: reward.item_shortname,
      amount: reward.amount,
      vip_level: reward.vip_level,
      is_bonus: reward.is_bonus
    });
    setShowModal(true);
  };
  
  // Salvar uma recompensa (criar ou atualizar)
  const handleSaveReward = async () => {
    try {
      // Validar dados do formulário
      if (!formData.item_name || !formData.item_shortname || formData.amount < 1) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
      
      const endpoint = editingReward 
        ? `/api/admin/rewards/${editingReward.id}` 
        : '/api/admin/rewards';
        
      const method = editingReward ? 'PUT' : 'POST';
      
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        throw new Error(`Erro ao ${editingReward ? 'atualizar' : 'criar'} recompensa: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Atualizar a lista de recompensas
        if (editingReward) {
          setRewards(rewards.map(r => r.id === editingReward.id ? data.reward : r));
          toast.success('Recompensa atualizada com sucesso');
        } else {
          setRewards([...rewards, data.reward]);
          toast.success('Recompensa criada com sucesso');
        }
        
        setShowModal(false);
      } else {
        toast.error(data.message || 'Operação falhou');
      }
    } catch (err) {
      console.error('Erro ao salvar recompensa:', err);
      toast.error(err.message || 'Falha na operação');
    }
  };
  
  // Excluir uma recompensa
  const handleDeleteReward = async (rewardId) => {
    if (!confirm('Tem certeza que deseja excluir esta recompensa?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/rewards/${rewardId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error(`Erro ao excluir recompensa: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setRewards(rewards.filter(r => r.id !== rewardId));
        toast.success('Recompensa excluída com sucesso');
      } else {
        toast.error(data.message || 'Falha ao excluir');
      }
    } catch (err) {
      console.error('Erro ao excluir recompensa:', err);
      toast.error(err.message || 'Falha na operação');
    }
  };
  
  // Agrupar recompensas por dia para facilitar a visualização
  const rewardsByDay = React.useMemo(() => {
    if (!rewards || !Array.isArray(rewards)) {
      return {};
    }
    
    return rewards.reduce((acc, reward) => {
      if (!reward) return acc;
      
      const day = reward.day;
      
      if (!acc[day]) {
        acc[day] = {
          standard: [],
          vipBasic: [],
          vipPlus: [],
          vipPremium: []
        };
      }
      
      if (reward.vip_level === 'none') {
        acc[day].standard.push(reward);
      } else if (reward.vip_level === 'vip-basic') {
        acc[day].vipBasic.push(reward);
      } else if (reward.vip_level === 'vip-plus') {
        acc[day].vipPlus.push(reward);
      } else if (reward.vip_level === 'vip-premium') {
        acc[day].vipPremium.push(reward);
      }
      
      return acc;
    }, {});
  }, [rewards]);
  
  if (!user) {
    return <LoadingSpinner />;
  }
  
  return (
    <>
      <Head>
        <title>Administração de Recompensas | Phanteon</title>
      </Head>
      
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-200 mb-4 md:mb-0">
            Administração de Recompensas
          </h1>
          
          {activeTab === 'rewards' && (
            <Button 
              color="success" 
              onClick={handleAddReward}
              className="flex items-center"
            >
              <FaPlus className="mr-2" /> Nova Recompensa
            </Button>
          )}
        </div>
        
        <TabSelector 
          tabs={[
            { id: 'rewards', label: 'Recompensas' },
            { id: 'statistics', label: 'Estatísticas' },
            { id: 'logs', label: 'Logs' }
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
        
        <div className="mt-6">
          {isLoading && <LoadingSpinner />}
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg text-red-200">
              {error}
            </div>
          )}
          
          {activeTab === 'rewards' && !isLoading && !error && (
            <div className="space-y-8">
              {Object.keys(rewardsByDay).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>Nenhuma recompensa configurada. Clique em "Nova Recompensa" para começar.</p>
                </div>
              ) : (
                Object.entries(rewardsByDay).map(([day, categories]) => (
                  <Card key={`day-${day}`} className="p-0 overflow-hidden">
                    <div className="bg-gray-800 p-4 border-b border-gray-700">
                      <h2 className="text-xl font-bold">Dia {day}</h2>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      {/* Recompensas padrão */}
                      <div>
                        <h3 className="font-semibold text-gray-300 mb-2">Padrão</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categories.standard.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nenhuma recompensa padrão</p>
                          ) : (
                            categories.standard.map(reward => (
                              <RewardCard 
                                key={reward.id}
                                reward={reward}
                                onEdit={() => handleEditReward(reward)}
                                onDelete={() => handleDeleteReward(reward.id)}
                              />
                            ))
                          )}
                        </div>
                      </div>
                      
                      {/* Recompensas VIP Basic */}
                      <div>
                        <h3 className="font-semibold text-orange-400 mb-2">VIP Básico</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categories.vipBasic.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nenhuma recompensa VIP Básico</p>
                          ) : (
                            categories.vipBasic.map(reward => (
                              <RewardCard 
                                key={reward.id}
                                reward={reward}
                                onEdit={() => handleEditReward(reward)}
                                onDelete={() => handleDeleteReward(reward.id)}
                              />
                            ))
                          )}
                        </div>
                      </div>
                      
                      {/* Recompensas VIP Plus */}
                      <div>
                        <h3 className="font-semibold text-amber-400 mb-2">VIP Plus</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categories.vipPlus.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nenhuma recompensa VIP Plus</p>
                          ) : (
                            categories.vipPlus.map(reward => (
                              <RewardCard 
                                key={reward.id}
                                reward={reward}
                                onEdit={() => handleEditReward(reward)}
                                onDelete={() => handleDeleteReward(reward.id)}
                              />
                            ))
                          )}
                        </div>
                      </div>
                      
                      {/* Recompensas VIP Premium */}
                      <div>
                        <h3 className="font-semibold text-red-400 mb-2">VIP Premium</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categories.vipPremium.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nenhuma recompensa VIP Premium</p>
                          ) : (
                            categories.vipPremium.map(reward => (
                              <RewardCard 
                                key={reward.id}
                                reward={reward}
                                onEdit={() => handleEditReward(reward)}
                                onDelete={() => handleDeleteReward(reward.id)}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              {statsLoading ? (
                <LoadingSpinner />
              ) : statistics && statistics.summary ? (
                <>
                  <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Resumo de Resgates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <StatsCard 
                        title="Total de Resgates" 
                        value={statistics.summary.total} 
                        icon={<FaChartBar className="text-blue-400" />} 
                      />
                      
                      <StatsCard 
                        title="Padrão" 
                        value={(statistics.summary.byVipLevel && statistics.summary.byVipLevel['none']) || 0} 
                        icon={<FaChartBar className="text-gray-400" />} 
                      />
                      
                      <StatsCard 
                        title="VIP Básico" 
                        value={(statistics.summary.byVipLevel && statistics.summary.byVipLevel['vip-basic']) || 0} 
                        icon={<FaChartBar className="text-orange-400" />} 
                      />
                      
                      <StatsCard 
                        title="VIP Plus" 
                        value={(statistics.summary.byVipLevel && statistics.summary.byVipLevel['vip-plus']) || 0}
                        icon={<FaChartBar className="text-amber-400" />} 
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h2 className="text-xl font-bold mb-6">Resgates por Dia</h2>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-800 text-left">
                            <th className="p-3 border-b border-gray-700">Dia</th>
                            <th className="p-3 border-b border-gray-700">Padrão</th>
                            <th className="p-3 border-b border-gray-700">VIP Básico</th>
                            <th className="p-3 border-b border-gray-700">VIP Plus</th>
                            <th className="p-3 border-b border-gray-700">VIP Premium</th>
                            <th className="p-3 border-b border-gray-700">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statistics.summary.byDay && Object.keys(statistics.summary.byDay)
                            .sort((a, b) => parseInt(a) - parseInt(b))
                            .map(day => {
                              // Encontrar estatísticas para este dia por nível VIP
                              const dayStats = statistics.statistics && Array.isArray(statistics.statistics) ? 
                                statistics.statistics.filter(s => s && s.day == day) : [];
                              const standard = dayStats.find(s => s && s.vip_level === 'none')?.claim_count || 0;
                              const vipBasic = dayStats.find(s => s && s.vip_level === 'vip-basic')?.claim_count || 0;
                              const vipPlus = dayStats.find(s => s && s.vip_level === 'vip-plus')?.claim_count || 0;
                              const vipPremium = dayStats.find(s => s && s.vip_level === 'vip-premium')?.claim_count || 0;
                              
                              return (
                                <tr key={`day-${day}`} className="border-b border-gray-700 hover:bg-gray-800/30">
                                  <td className="p-3">Dia {day}</td>
                                  <td className="p-3">{standard}</td>
                                  <td className="p-3">{vipBasic}</td>
                                  <td className="p-3">{vipPlus}</td>
                                  <td className="p-3">{vipPremium}</td>
                                  <td className="p-3 font-semibold">{statistics.summary.byDay[day]}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>Nenhuma estatística disponível.</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'logs' && (
            <div>
              {logsLoading ? (
                <LoadingSpinner />
              ) : syncLogs && syncLogs.length > 0 ? (
                <Card className="p-0 overflow-hidden">
                  <div className="flex justify-between items-center bg-gray-800 p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Logs de Sincronização</h2>
                    <Button 
                      color="secondary" 
                      onClick={fetchSyncLogs}
                      className="flex items-center"
                    >
                      <FaSync className="mr-2" /> Atualizar
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-800 text-left">
                          <th className="p-3 border-b border-gray-700">Data</th>
                          <th className="p-3 border-b border-gray-700">Origem</th>
                          <th className="p-3 border-b border-gray-700">Status</th>
                          <th className="p-3 border-b border-gray-700">Mensagem</th>
                          <th className="p-3 border-b border-gray-700">Servidor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncLogs.map(log => (
                          <tr key={log.id || Math.random()} className="border-b border-gray-700 hover:bg-gray-800/30">
                            <td className="p-3 whitespace-nowrap">
                              {log && log.created_at ? new Date(log.created_at).toLocaleString() : 'Data desconhecida'}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-lg text-xs ${
                                log && log.source === 'plugin' ? 'bg-blue-900/50 text-blue-300' :
                                log && log.source === 'website' ? 'bg-green-900/50 text-green-300' :
                                'bg-purple-900/50 text-purple-300'
                              }`}>
                                {log && log.source ? log.source : 'desconhecido'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-lg text-xs ${
                                log && log.status === 'success' ? 'bg-green-900/50 text-green-300' :
                                log && log.status === 'warning' ? 'bg-yellow-900/50 text-yellow-300' :
                                'bg-red-900/50 text-red-300'
                              }`}>
                                {log && log.status ? log.status : 'desconhecido'}
                              </span>
                            </td>
                            <td className="p-3">
                              {log && log.message ? log.message : 'Sem mensagem'}
                            </td>
                            <td className="p-3">
                              {log && log.server_id ? log.server_id : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>Nenhum log de sincronização disponível.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal para adicionar/editar recompensa */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingReward ? 'Editar Recompensa' : 'Nova Recompensa'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Dia
              </label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <option key={day} value={day}>
                    Dia {day}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nível VIP
              </label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.vip_level}
                onChange={(e) => setFormData({ ...formData, vip_level: e.target.value })}
              >
                <option value="none">Padrão</option>
                <option value="vip-basic">VIP Básico</option>
                <option value="vip-plus">VIP Plus</option>
                <option value="vip-premium">VIP Premium</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome do Item
            </label>
            <input
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              placeholder="Ex: Sucata"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Shortname
            </label>
            <input
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={formData.item_shortname}
              onChange={(e) => setFormData({ ...formData, item_shortname: e.target.value })}
              placeholder="Ex: scrap"
            />
            <p className="text-xs text-gray-500 mt-1">Nome interno do item usado no jogo</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Quantidade
            </label>
            <input
              type="number"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
              min="1"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_bonus"
              className="mr-2 h-5 w-5 rounded"
              checked={formData.is_bonus}
              onChange={(e) => setFormData({ ...formData, is_bonus: e.target.checked })}
            />
            <label htmlFor="is_bonus" className="text-sm font-medium text-gray-300">
              É um item bônus
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              color="secondary"
              onClick={() => setShowModal(false)}
              className="flex items-center"
            >
              <FaTimes className="mr-2" /> Cancelar
            </Button>
            
            <Button
              color="primary"
              onClick={handleSaveReward}
              className="flex items-center"
            >
              <FaSave className="mr-2" /> Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// Componente para exibir um cartão de recompensa
function RewardCard({ reward, onEdit, onDelete }) {
  if (!reward) {
    return null; // Não renderizar nada se a recompensa for undefined
  }
  
  return (
    <div className={`bg-gray-800 border ${reward.is_bonus ? 'border-amber-500/50' : 'border-gray-700'} rounded-lg p-3 relative`}>
      {reward.is_bonus && (
        <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">
          BÔNUS
        </div>
      )}
      
      <div className="mb-2">
        <h4 className="font-semibold text-lg">{reward.item_name || 'Sem nome'}</h4>
        <p className="text-gray-400 text-sm">Qtd: {reward.amount || 0}</p>
        <p className="text-gray-500 text-xs">ID: {reward.item_shortname || 'N/A'}</p>
      </div>
      
      <div className="flex justify-end space-x-2 mt-3">
        <button 
          onClick={onEdit}
          className="p-1.5 bg-blue-600 text-blue-100 rounded hover:bg-blue-700"
        >
          <FaEdit />
        </button>
        
        <button 
          onClick={onDelete}
          className="p-1.5 bg-red-600 text-red-100 rounded hover:bg-red-700"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
}

// Componente para exibir estatísticas
function StatsCard({ title, value, icon }) {
  if (value === undefined || value === null) {
    value = 0;
  }
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center">
      <div className="mr-4 text-xl">
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm">{title || 'Estatística'}</p>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  // Verificar explicitamente se o usuário tem a role admin antes de renderizar a página
  if (!session.user || !session.user.role || session.user.role !== 'admin') {
    return {
      redirect: {
        destination: '/perfil',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      user: session.user || null,
    },
  };
} 