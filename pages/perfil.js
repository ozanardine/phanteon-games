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
import { getUserByDiscordId, getUserSubscription, supabase } from '../lib/supabase';
import { requireAuth, syncUserData } from '../lib/auth';

export default function PerfilPage({ userData, subscriptionData, errorMessage, newUser }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [steamId, setSteamId] = useState(userData?.steam_id || '');
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(newUser === true || !userData?.steam_id);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
    
    if (userData?.steam_id) {
      setSteamId(userData.steam_id);
    }
  
    // Safely handle modal opening - only if component is mounted
    const shouldOpenModal = newUser === true || !userData?.steam_id;
    if (shouldOpenModal) {
      setIsEditModalOpen(true);
    }
  
    // Load subscription history
    const loadSubscriptionHistory = async () => {
      if (!session?.user?.discord_id || !userData?.id) return;
    
      try {
        setLoading(true);
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
        // Only update state if component is still mounted
        setLoading(false);
      }
    };
  
    loadSubscriptionHistory();
  }, [session, userData, errorMessage, newUser]);
  
  // Replace the handleSaveSteamId function with:
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
            )}
          </div>
        </div>
      </div>

      {/* Modal para editar Steam ID */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (userData?.steam_id) {
            setIsEditModalOpen(false);
          } else {
            toast.info('É necessário configurar seu Steam ID para acessar todas as funcionalidades do site.');
          }
        }}
        title={newUser ? "Seja bem-vindo! Configure seu Steam ID" : "Editar Steam ID"}
        closeOnOverlayClick={!!userData?.steam_id}
        footer={
          <>
            {userData?.steam_id && (
              <Button
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleSaveSteamId}
              loading={loading}
            >
              {newUser ? "Salvar e Continuar" : "Salvar"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {newUser && (
            <div className="bg-dark-400/50 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-white mb-2">Bem-vindo à Phanteon Games!</h3>
              <p className="text-gray-300">
                Para concluir seu cadastro e aproveitar todas as funcionalidades, precisamos que você configure seu Steam ID.
              </p>
            </div>
          )}
          <p className="text-gray-300">
            Para ativar seu VIP no servidor, precisamos do seu Steam ID de 17 dígitos.
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
              className="input w-full border-2 focus:border-primary focus:outline-none transition duration-200"
              placeholder="76561198xxxxxxxxx"
            />
            <p className="text-xs text-gray-500 mt-1">Certifique-se de que seu Steam ID tenha exatamente 17 dígitos.</p>
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
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : subscriptionHistory.length > 0 ? (
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
                {subscriptionHistory.map((sub) => (
                  <tr key={sub.id} className="border-b border-dark-200">
                    <td className="py-3 px-4 text-white">{sub.plan_name}</td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(sub.expires_at).toLocaleDateString('pt-BR')}
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
    </>
  );
}

export async function getServerSideProps(context) {
  // Verifica se o usuário está autenticado
  const authResult = await requireAuth(context);
  
  // Se o resultado contiver um redirecionamento, retorna-o
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
    
    // Obtém dados do usuário via função auxiliar
    const userData = await getUserByDiscordId(discordId);
    
    if (!userData) {
      console.error('[Perfil] Usuário não encontrado no banco de dados');
      
      // Tenta sincronizar dados novamente
      const syncResult = await syncUserData({
        id: discordId,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image
      });
      
      if (!syncResult) {
        console.error('[Perfil] Falha ao sincronizar dados do usuário');
        
        // AQUI ESTÁ A MUDANÇA IMPORTANTE: Em vez de mostrar erro, retornamos dados parciais
        return {
          props: {
            // Criamos um objeto userData parcial com os dados da sessão
            userData: {
              discord_id: discordId,
              name: session.user.name,
              email: session.user.email,
              discord_avatar: session.user.image,
              steam_id: null // Explicitamente null para sinalizar que precisa ser configurado
            },
            subscriptionData: null,
            subscriptionHistory: [],
            newUser: true // Adicionamos uma flag para indicar usuário novo
          },
        };
      }
      
      // Busca novamente após sincronização
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
      
      // Busca dados da assinatura ativa usando o UUID correto
      const subscriptionData = await getUserSubscription(syncedUserData.id);
      
      // Busca histórico de assinaturas
      const { data: subscriptionHistory, error: historyError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', syncedUserData.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (historyError) {
        console.warn('[Perfil] Erro ao buscar histórico de assinaturas:', historyError);
      }
      
      // Processar dados para garantir serialização
      const processedSubscription = subscriptionData ? {
        ...subscriptionData,
        created_at: subscriptionData.created_at ? new Date(subscriptionData.created_at).toISOString() : null,
        updated_at: subscriptionData.updated_at ? new Date(subscriptionData.updated_at).toISOString() : null,
        expires_at: subscriptionData.expires_at ? new Date(subscriptionData.expires_at).toISOString() : null
      } : null;
      
      // Processar histórico para garantir serialização
      const processedHistory = (subscriptionHistory || []).map(sub => ({
        id: sub.id,
        plan_id: sub.plan_id,
        plan_name: sub.plan_name || 'Desconhecido',
        status: sub.status || 'unknown',
        price: typeof sub.price === 'number' ? sub.price : parseFloat(sub.price || 0),
        amount: typeof sub.amount === 'number' ? sub.amount : parseFloat(sub.amount || 0),
        payment_id: sub.payment_id || null,
        created_at: sub.created_at ? new Date(sub.created_at).toISOString() : null,
        updated_at: sub.updated_at ? new Date(sub.updated_at).toISOString() : null,
        expires_at: sub.expires_at ? new Date(sub.expires_at).toISOString() : null
      }));
      
      return {
        props: {
          userData: syncedUserData || null,
          subscriptionData: processedSubscription,
          subscriptionHistory: processedHistory,
        },
      };
    }
    
    console.log('[Perfil] Usuário encontrado, id:', userData.id);
    
    // Busca dados da assinatura ativa usando o UUID correto
    const subscriptionData = await getUserSubscription(userData.id);
    
    // Busca histórico de assinaturas
    const { data: subscriptionHistory, error: historyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (historyError) {
      console.warn('[Perfil] Erro ao buscar histórico de assinaturas:', historyError);
    }
    
    // Processar dados para garantir serialização
    const processedSubscription = subscriptionData ? {
      ...subscriptionData,
      created_at: subscriptionData.created_at ? new Date(subscriptionData.created_at).toISOString() : null,
      updated_at: subscriptionData.updated_at ? new Date(subscriptionData.updated_at).toISOString() : null,
      expires_at: subscriptionData.expires_at ? new Date(subscriptionData.expires_at).toISOString() : null
    } : null;
    
    // Processar histórico para garantir serialização
    const processedHistory = (subscriptionHistory || []).map(sub => ({
      id: sub.id,
      plan_id: sub.plan_id,
      plan_name: sub.plan_name || 'Desconhecido',
      status: sub.status || 'unknown',
      price: typeof sub.price === 'number' ? sub.price : parseFloat(sub.price || 0),
      amount: typeof sub.amount === 'number' ? sub.amount : parseFloat(sub.amount || 0),
      payment_id: sub.payment_id || null,
      created_at: sub.created_at ? new Date(sub.created_at).toISOString() : null,
      updated_at: sub.updated_at ? new Date(sub.updated_at).toISOString() : null,
      expires_at: sub.expires_at ? new Date(sub.expires_at).toISOString() : null
    }));
    
    console.log(`[Perfil] Encontradas ${processedHistory.length} assinaturas no histórico`);
    
    return {
      props: {
        userData: userData || null,
        subscriptionData: processedSubscription,
        subscriptionHistory: processedHistory,
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