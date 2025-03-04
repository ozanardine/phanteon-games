import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SubscriptionStatus from '../components/subscriptions/SubscriptionStatus';
import Modal from '../components/ui/Modal';
import { FaDiscord, FaSteam, FaUser, FaHistory } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { updateSteamId } from '../lib/auth';
import { requireAuth } from '../lib/auth';

export default function PerfilPage({ userData, subscriptionData }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [steamId, setSteamId] = useState(userData?.steam_id || '');
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    if (userData?.steam_id) {
      setSteamId(userData.steam_id);
    }

    // Carregar histórico de assinaturas
    const loadSubscriptionHistory = async () => {
      if (!session?.user?.discord_id) return;
    
      try {
        // Primeiro, obtenha o UUID do usuário a partir do discord_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('discord_id', session.user.discord_id)
          .single();
    
        if (userError) throw userError;
        
        if (!userData || !userData.id) {
          console.error('Usuário não encontrado');
          return;
        }
    
        // Agora use o UUID correto para consultar as assinaturas
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(10);
    
        if (error) throw error;
        setSubscriptionHistory(data || []);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        toast.error('Não foi possível carregar o histórico de assinaturas');
      }
    };

    loadSubscriptionHistory();
  }, [session, userData]);

  const handleSaveSteamId = async () => {
    if (!steamId) {
      toast.error('Por favor, insira seu Steam ID');
      return;
    }
  
    if (!steamId.match(/^[0-9]{17}$/)) {
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
  
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Steam ID atualizado com sucesso!');
        setIsEditModalOpen(false);
      } else {
        throw new Error(data.message || 'Erro ao atualizar Steam ID');
      }
    } catch (error) {
      console.error('Erro ao atualizar Steam ID:', error);
      toast.error(error.message || 'Erro ao atualizar Steam ID');
    } finally {
      setLoading(false);
    }
  };

  const handleRenewSubscription = () => {
    if (subscriptionData?.plan_id) {
      router.push(`/checkout/${subscriptionData.plan_id}`);
    } else {
      router.push('/planos');
    }
  };

  return (
    <>
      <Head>
        <title>Meu Perfil | Phanteon Games</title>
      </Head>

      <div className="container-custom mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Meu Perfil</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna 1: Perfil do Usuário */}
          <div className="lg:col-span-1">
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
                        onClick={() => setIsEditModalOpen(true)}
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
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="flex items-center"
                >
                  <FaHistory className="mr-2" />
                  Histórico
                </Button>
              </Card.Footer>
            </Card>
          </div>

          {/* Coluna 2: Status da Assinatura */}
          <div className="lg:col-span-2">
            <SubscriptionStatus 
              subscription={subscriptionData} 
              onRenew={handleRenewSubscription}
            />

            {/* Instruções para VIP */}
            {subscriptionData?.status === 'active' && (
              <Card className="mt-8">
                <Card.Header>
                  <Card.Title>Como usar seu VIP</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Kits VIP</h3>
                      <p className="text-gray-300 mb-2">
                        Para resgatar seus kits VIP, utilize os seguintes comandos no servidor:
                      </p>
                      <div className="bg-dark-400 p-3 rounded font-mono text-sm text-gray-300">
                        /kit {subscriptionData.plan_id.replace('vip-', '')}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Homes</h3>
                      <p className="text-gray-300 mb-2">
                        Para configurar e utilizar suas homes:
                      </p>
                      <div className="bg-dark-400 p-3 rounded font-mono text-sm text-gray-300">
                        <p>/sethome [nome] - Define uma home na sua localização atual</p>
                        <p>/home [nome] - Teleporta para a home escolhida</p>
                        <p>/homes - Lista todas as suas homes</p>
                        <p>/delhome [nome] - Remove uma home</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Teleporte</h3>
                      <p className="text-gray-300 mb-2">
                        Para se teleportar a outros jogadores:
                      </p>
                      <div className="bg-dark-400 p-3 rounded font-mono text-sm text-gray-300">
                        <p>/tpr [jogador] - Solicita teleporte a um jogador</p>
                        <p>/tpa - Aceita solicitação de teleporte</p>
                        <p>/tpd - Recusa solicitação de teleporte</p>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal para editar Steam ID */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Steam ID"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveSteamId}
              loading={loading}
            >
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Insira seu Steam ID de 17 dígitos para vincular sua conta.
          </p>
          <p className="text-gray-400 text-sm">
            Para encontrar seu Steam ID, acesse{' '}
            <a
              href="https://steamid.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              steamid.io
            </a>{' '}
            e insira o link do seu perfil.
          </p>
          <div>
            <label htmlFor="steamId" className="block text-gray-300 mb-1">
              Steam ID (17 dígitos)
            </label>
            <input
              id="steamId"
              type="text"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              className="input w-full"
              placeholder="76561198xxxxxxxxx"
            />
          </div>
        </div>
      </Modal>

      {/* Modal de histórico de assinaturas */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Histórico de Assinaturas"
        size="lg"
      >
        {subscriptionHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-200">
                  <th className="py-2 px-4 text-left text-gray-300">Plano</th>
                  <th className="py-2 px-4 text-left text-gray-300">Data</th>
                  <th className="py-2 px-4 text-left text-gray-300">Valor</th>
                  <th className="py-2 px-4 text-left text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionHistory.map((sub) => (
                  <tr key={sub.id} className="border-b border-dark-200">
                    <td className="py-3 px-4 text-white">{sub.plan_name}</td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      R$ {parseFloat(sub.amount).toFixed(2)}
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
    </>
  );
}

// Função para buscar dados do servidor
export async function getServerSideProps(context) {
  // Verifica se o usuário está autenticado
  const authResult = await requireAuth(context);
  
  // Se o resultado contiver um redirecionamento, retorna-o
  if (authResult.redirect) {
    return authResult;
  }
  
  const session = authResult.props.session;
  
  try {
    // Busca dados do usuário no Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', session.user.discord_id)
      .single();
    
    if (userError) throw userError;
    
    // Busca dados da assinatura ativa
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.discord_id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Não lançamos erro aqui pois o usuário pode não ter assinatura
    
    return {
      props: {
        userData: userData || null,
        subscriptionData: subscriptionData || null,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar dados do perfil:', error);
    
    return {
      props: {
        userData: null,
        subscriptionData: null,
        error: 'Falha ao carregar dados do perfil',
      },
    };
  }
}