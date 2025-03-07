import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCheck, FaExclamationTriangle, FaCreditCard, FaBarcode, FaQrcode, FaLock, FaShieldAlt } from 'react-icons/fa';
import { fetchWithBaseUrl } from '../../lib/api';
import VipBadge from '../../components/ui/VipBadge';

// Dados dos planos VIP (os mesmos da página de planos)
const vipPlans = [
  {
    id: 'vip-basic',
    name: 'VIP Basic',
    price: '19.90',
    description: 'Ideal para jogadores casuais que querem algumas vantagens extras.',
    features: [
      'Acesso ao plugin Furnace Splitter',
      'Prioridade na fila do servidor',
      'Acesso a eventos exclusivos para VIP Basic',
      'Badge exclusiva no Discord',
      'Cargo exclusivo no Discord',
    ],
  },
  {
    id: 'vip-plus',
    name: 'VIP Plus',
    price: '29.90',
    description: 'Experiência aprimorada para jogadores regulares com benefícios exclusivos.',
    features: [
      'Acesso ao plugin Furnace Splitter',
      'Acesso ao plugin QuickSmelt',
      'Prioridade máxima na fila do servidor',
      'Acesso a eventos exclusivos para VIP Plus',
      'Sorteios mensais de skins do jogo',
      'Badge exclusiva no Discord',
      'Cargo exclusivo no Discord',
      'Acesso a salas exclusivas no Discord',
      'Suporte prioritário',
    ],
  },
];

export default function CheckoutPage({ userData, activeSubscription, error }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { planoId, error: queryError } = router.query;
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [showSteamIdModal, setShowSteamIdModal] = useState(false);
  const [steamId, setSteamId] = useState(userData?.steam_id || '');

  // Verifica erros de query string
  useEffect(() => {
    if (queryError === 'true') {
      toast.error('Ocorreu um erro durante o processamento do pagamento.');
    }
  }, [queryError]);

  // Exibe mensagem de erro se houver
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  
  // Busca o plano selecionado
  useEffect(() => {
    if (planoId) {
      const plan = vipPlans.find(p => p.id === planoId);
      if (plan) {
        setSelectedPlan(plan);
      } else {
        toast.error('Plano não encontrado');
        router.push('/planos');
      }
    }
  }, [planoId, router]);

  // Verifica se o usuário tem SteamID configurado
  useEffect(() => {
    if (userData && !userData.steam_id) {
      setShowSteamIdModal(true);
    }
  }, [userData]);

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
        let errorMessage = 'Erro ao atualizar Steam ID';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Steam ID atualizado com sucesso!');
        setShowSteamIdModal(false);
        
        // Atualiza o estado local
        setSteamId(steamId);
        
        // Recarrega a página após um breve delay
        setTimeout(() => {
          router.reload();
        }, 1500);
      } else {
        throw new Error('Falha ao atualizar Steam ID');
      }
    } catch (error) {
      toast.error(error.message || 'Erro ao atualizar Steam ID');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlan) {
      toast.error('Selecione um plano para continuar');
      return;
    }

    if (!userData?.steam_id) {
      setShowSteamIdModal(true);
      return;
    }

    setLoading(true);
    try {
      // Garantir que o Discord ID seja uma string
      const discordId = session.user.discord_id.toString();

      // Criar preferência de pagamento no Mercado Pago
      const paymentData = {
        title: `Plano ${selectedPlan.name} - Phanteon Games`,
        price: selectedPlan.price,
        quantity: 1,
        userId: discordId,
        planId: selectedPlan.id,
        successUrl: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/perfil?success=true`,
        failureUrl: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/checkout/${selectedPlan.id}?error=true`,
      };

      // Usando a função auxiliar para suportar produção e desenvolvimento
      const response = await fetchWithBaseUrl('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        let errorMessage = 'Erro ao processar pagamento';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Erro (${response.status}): ${response.statusText}`;
        } catch (e) {
          // Error handling silently
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Redireciona para a página de pagamento do Mercado Pago
      if (data.init_point) {
        setPaymentUrl(data.init_point);
      } else {
        throw new Error('URL de pagamento não encontrada na resposta');
      }
    } catch (error) {
      toast.error(error.message || 'Erro ao processar pagamento. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Se não tiver plano selecionado, mostra carregando
  if (!selectedPlan) {
    return (
      <div className="container-custom mx-auto py-12 px-4 flex justify-center">
        <div className="animate-pulse text-center">
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout - Phanteon Games</title>
        <meta name="description" content="Checkout para assinatura VIP Phanteon Games" />
      </Head>
      
      <ToastContainer position="top-right" autoClose={5000} />

      <div className="container-custom mx-auto px-4 pt-16 pb-24">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-3 text-center">Finalizar Compra</h1>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Complete seu pedido para ativar seu plano VIP e aproveitar todas as vantagens exclusivas.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Resumo do Pedido - Coluna maior */}
            <div className="lg:col-span-2 space-y-8">
              {/* Card de Detalhes do Plano */}
              <Card 
                className="border-2 border-dark-200 overflow-hidden transform transition-all duration-300 hover:border-primary/30 hover:shadow-xl"
                shadow={true}
                padding="large"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-dark-200">
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className="mr-4">
                      <VipBadge plan={selectedPlan.id} size={64} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{selectedPlan.name}</h2>
                      <p className="text-gray-400">{selectedPlan.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-sm mb-1">Preço</div>
                    <div className="text-3xl font-bold text-white">
                      R$ {selectedPlan.price}
                      <span className="text-sm text-gray-400 font-normal ml-1">/mês</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-4">Benefícios Incluídos</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 mb-6">
                  {selectedPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white flex-shrink-0 mr-3">
                        <FaCheck className="h-3 w-3" />
                      </div>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {activeSubscription && (
                  <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 flex items-start mt-6">
                    <FaExclamationTriangle className="text-yellow-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-medium text-white mb-1">Você já possui um plano ativo</h4>
                      <p className="text-gray-300 text-sm">
                        Ao assinar um novo plano, seu plano atual será substituído pelo novo.
                        Seu plano atual ({activeSubscription.plan_name}) expira em{' '}
                        {new Date(activeSubscription.expires_at).toLocaleDateString('pt-BR')}.
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Card de Pagamento (quando disponível) */}
              {paymentUrl && (
                <Card 
                  className="border-2 border-primary/30 overflow-hidden transform transition-all duration-300 hover:shadow-xl"
                  shadow={true}
                  padding="large"
                >
                  <div className="text-center py-6">
                    <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <FaLock className="text-primary text-xl" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Pagamento Seguro</h3>
                    <p className="text-gray-300 mb-6 max-w-md mx-auto">
                      Você será redirecionado para o ambiente seguro do Mercado Pago para finalizar seu pagamento.
                    </p>
                    <Button
                      variant="gradient"
                      size="xl"
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-12"
                    >
                      Pagar Agora
                    </Button>
                    <p className="text-gray-400 text-sm mt-4 flex items-center justify-center">
                      <FaShieldAlt className="mr-2" />
                      Ambiente seguro e criptografado
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Coluna de resumo e pagamento */}
            <div className="lg:col-span-1 space-y-8">
              {/* Card de Resumo de Valores */}
              <Card 
                className="border-2 border-dark-200 overflow-hidden transform transition-all duration-300 hover:border-primary/30 hover:shadow-xl"
                shadow={true}
                padding="large"
              >
                <h3 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-dark-200">
                  Resumo do Pedido
                </h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="text-white font-medium">R$ {selectedPlan.price}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Taxa de processamento:</span>
                    <span className="text-white font-medium">R$ 0,00</span>
                  </div>
                  
                  <div className="h-px bg-dark-200 my-2"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Total:</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">R$ {selectedPlan.price}</span>
                      <div className="text-xs text-gray-400">Pagamento único</div>
                    </div>
                  </div>
                </div>
                
                {!paymentUrl ? (
                  <Button
                    variant="gradient"
                    size="lg"
                    fullWidth
                    onClick={handleCheckout}
                    loading={loading}
                    className="py-4"
                  >
                    Finalizar Compra
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    onClick={() => setPaymentUrl(null)}
                  >
                    Voltar
                  </Button>
                )}
              </Card>

              {/* Card de Métodos de Pagamento */}
              {!paymentUrl && (
                <Card 
                  className="border-2 border-dark-200 overflow-hidden transform transition-all duration-300 hover:border-primary/30 hover:shadow-xl"
                  shadow={true}
                  padding="large"
                >
                  <h3 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-dark-200">
                    Formas de Pagamento
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="p-3 rounded-lg bg-dark-400/50 flex items-center transition-all hover:bg-dark-400">
                      <FaCreditCard className="text-primary mr-4 text-xl" />
                      <span className="text-white">Cartão de Crédito</span>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-dark-400/50 flex items-center transition-all hover:bg-dark-400">
                      <FaBarcode className="text-primary mr-4 text-xl" />
                      <span className="text-white">Boleto Bancário</span>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-dark-400/50 flex items-center transition-all hover:bg-dark-400">
                      <FaQrcode className="text-primary mr-4 text-xl" />
                      <span className="text-white">PIX</span>
                    </div>
                  </div>
                  
                  <div className="text-center border-t border-dark-200 pt-6">
                    <Image 
                      src="/images/mercado-pago-logo.svg" 
                      alt="Mercado Pago" 
                      width={120} 
                      height={40}
                      className="mx-auto mb-2"
                    />
                    <p className="text-gray-400 text-xs flex items-center justify-center">
                      <FaLock className="mr-1" />
                      Pagamentos processados com segurança
                    </p>
                  </div>
                </Card>
              )}
              
              {/* Card de Suporte */}
              <Card 
                className="border-2 border-dark-200 overflow-hidden transform transition-all duration-300 hover:border-primary/30 hover:shadow-xl"
                shadow={true}
                padding="large"
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Precisa de ajuda?</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Entre em contato com nosso suporte pelo Discord
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    href="https://discord.gg/v8575VMgPW"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Discord
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para configurar Steam ID */}
      <Modal
        isOpen={showSteamIdModal}
        onClose={() => {
          if (userData?.steam_id) {
            setShowSteamIdModal(false);
          } else {
            router.push('/perfil');
          }
        }}
        title="Configure seu Steam ID"
        closeOnOverlayClick={!!userData?.steam_id}
        footer={
          <>
            {userData?.steam_id && (
              <Button
                variant="ghost"
                onClick={() => setShowSteamIdModal(false)}
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
              Salvar e Continuar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
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
              className="input w-full"
              placeholder="76561198xxxxxxxxx"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

// Função para buscar dados do servidor
export async function getServerSideProps(context) {
  // Para receber o objeto de sessão completo do servidor
  const { req, res } = context;
  
  // Importa as funções necessárias
  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('../api/auth/[...nextauth]');
  const { getUserByDiscordId, getUserSubscription } = await import('../../lib/supabase');
  
  try {
    // Verifica se o usuário está autenticado
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      console.log('[CheckoutSSR] Usuário não autenticado, redirecionando');
      return {
        redirect: {
          destination: '/?auth=required',
          permanent: false,
        },
      };
    }
    
    const { planoId } = context.params;
    
    // Verifica se o planoId é válido
    const validPlan = vipPlans.find(p => p.id === planoId);
    if (!validPlan) {
      console.log(`[CheckoutSSR] Plano inválido: ${planoId}, redirecionando`);
      return {
        redirect: {
          destination: '/planos',
          permanent: false,
        },
      };
    }
    
    // Busca dados do usuário pelo Discord ID
    const discordId = session.user.discord_id;
    console.log(`[CheckoutSSR] Buscando usuário para discord_id: ${discordId}`);
    
    const userData = await getUserByDiscordId(discordId);
    
    if (!userData) {
      console.log('[CheckoutSSR] Usuário não encontrado no banco de dados');
      return {
        props: {
          userData: null,
          activeSubscription: null,
          error: 'Não foi possível recuperar seus dados. Tente fazer login novamente.',
        },
      };
    }
    
    // Busca dados da assinatura ativa
    console.log(`[CheckoutSSR] Buscando assinatura para usuário: ${userData.id}`);
    const activeSubscription = await getUserSubscription(userData.id);
    
    return {
      props: {
        userData: userData || null,
        activeSubscription: activeSubscription || null,
      },
    };
  } catch (error) {
    console.error('[CheckoutSSR] Erro ao processar checkout:', error);
    
    return {
      props: {
        userData: null,
        activeSubscription: null,
        error: 'Erro ao carregar dados. Tente novamente mais tarde.',
      },
    };
  }
}