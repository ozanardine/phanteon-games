import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { toast } from 'react-hot-toast';
import { FaCheck, FaExclamationTriangle, FaCreditCard, FaBarcode, FaQrcode } from 'react-icons/fa';

// Dados dos planos VIP (os mesmos da página de planos)
const vipPlans = [
  {
    id: 'vip-basic',
    name: 'VIP Básico',
    price: '19.90',
    description: 'Ideal para jogadores casuais que querem algumas vantagens extras.',
    features: [
      'Kit básico a cada wipe',
      '1 home (/home)',
      'Acesso a /tpr (teleporte)',
      'Slot reservado no servidor',
      'Cargo exclusivo no Discord',
    ],
  },
  {
    id: 'vip-plus',
    name: 'VIP Plus',
    price: '29.90',
    description: 'Experiência aprimorada para jogadores regulares.',
    features: [
      'Kit intermediário a cada wipe',
      '3 homes (/home)',
      'Acesso a /tpr (teleporte)',
      'Slot reservado no servidor',
      'Prioridade na fila',
      'Cargo exclusivo no Discord',
      'Suporte prioritário',
    ],
  },
  {
    id: 'vip-premium',
    name: 'VIP Premium',
    price: '49.90',
    description: 'A melhor experiência para jogadores dedicados.',
    features: [
      'Kit premium a cada wipe',
      '5 homes (/home)',
      'Acesso a /tpr sem cooldown',
      'Slot reservado no servidor',
      'Prioridade máxima na fila',
      'Cargo exclusivo no Discord',
      'Suporte VIP dedicado',
      'Acesso antecipado a eventos',
      'Recompensas exclusivas mensais',
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
      console.log('[Checkout] Salvando Steam ID:', steamId);
      
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
      console.error('[Checkout] Erro ao atualizar Steam ID:', error);
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
      console.log(`[Checkout] Iniciando checkout para plano: ${selectedPlan.id}`);

      // Criar preferência de pagamento no Mercado Pago
      const paymentData = {
        title: `Plano ${selectedPlan.name} - Phanteon Games`,
        price: selectedPlan.price,
        quantity: 1,
        userId: session.user.discord_id,
        planId: selectedPlan.id,
        successUrl: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/perfil?success=true`,
        failureUrl: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/checkout/${selectedPlan.id}?error=true`,
      };

      console.log('[Checkout] Enviando solicitação para criar assinatura');

      const response = await fetch('/api/subscriptions/create', {
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
          console.error('[Checkout] Resposta de erro da API:', errorData);
        } catch (e) {
          console.error('[Checkout] Erro ao processar resposta de erro:', e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      console.log('[Checkout] Resposta recebida da API:', data);
      
      // Redireciona para a página de pagamento do Mercado Pago
      if (data.init_point) {
        console.log('[Checkout] Redirecionando para Mercado Pago:', data.init_point);
        setPaymentUrl(data.init_point);
      } else {
        throw new Error('URL de pagamento não encontrada na resposta');
      }
    } catch (error) {
      console.error('[Checkout] Erro ao processar checkout:', error);
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
        <title>Checkout | {selectedPlan.name} | Phanteon Games</title>
      </Head>

      <div className="container-custom mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Checkout</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Resumo do Pedido */}
            <div className="md:col-span-2">
              <Card>
                <Card.Header>
                  <Card.Title>Resumo do Pedido</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-dark-200">
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedPlan.name}</h3>
                      <p className="text-gray-400 text-sm">{selectedPlan.description}</p>
                    </div>
                    <span className="text-white font-bold text-xl">
                      R$ {selectedPlan.price}
                    </span>
                  </div>

                  <h4 className="font-medium text-white mb-3">Benefícios Incluídos:</h4>
                  <ul className="space-y-2 mb-6">
                    {selectedPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <FaCheck className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {activeSubscription && (
                    <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 flex items-start mt-4">
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
                </Card.Body>
              </Card>

              {paymentUrl && (
                <Card className="mt-6">
                  <Card.Header>
                    <Card.Title>Pagamento</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center">
                      <p className="text-gray-300 mb-4">
                        Prossiga para o Mercado Pago para finalizar seu pagamento:
                      </p>
                      <Button
                        variant="primary"
                        size="lg"
                        href={paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Pagar Agora
                      </Button>
                      <p className="text-gray-400 text-sm mt-4">
                        Você será redirecionado para o ambiente seguro do Mercado Pago.
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>

            {/* Formas de Pagamento e Resumo do Valor */}
            <div className="md:col-span-1">
              <Card>
                <Card.Header>
                  <Card.Title>Resumo</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="text-white">R$ {selectedPlan.price}</span>
                  </div>
                  <div className="flex justify-between mb-4 pb-4 border-b border-dark-200">
                    <span className="text-gray-400">Taxa de processamento:</span>
                    <span className="text-white">R$ 0,00</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-white">Total:</span>
                    <span className="text-primary text-xl">R$ {selectedPlan.price}</span>
                  </div>
                </Card.Body>
                <Card.Footer>
                  {!paymentUrl ? (
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={handleCheckout}
                      loading={loading}
                    >
                      Finalizar Compra
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      onClick={() => setPaymentUrl(null)}
                    >
                      Voltar
                    </Button>
                  )}
                </Card.Footer>
              </Card>

              {!paymentUrl && (
                <Card className="mt-6">
                  <Card.Header>
                    <Card.Title>Formas de Pagamento</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <FaCreditCard className="text-primary mr-3" />
                        <span className="text-gray-300">Cartão de Crédito</span>
                      </div>
                      <div className="flex items-center">
                        <FaBarcode className="text-primary mr-3" />
                        <span className="text-gray-300">Boleto Bancário</span>
                      </div>
                      <div className="flex items-center">
                        <FaQrcode className="text-primary mr-3" />
                        <span className="text-gray-300">PIX</span>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <Image 
                        src="/images/mercado-pago-logo.svg" 
                        alt="Mercado Pago" 
                        width={120} 
                        height={40} 
                        className="mx-auto"
                      />
                      <p className="text-gray-400 text-xs mt-2">
                        Pagamentos processados com segurança
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              )}
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
  const { getServerSession } = await import('next-auth/next');
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