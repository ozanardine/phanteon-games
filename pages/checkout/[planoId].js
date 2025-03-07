import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  FaCheck, 
  FaArrowLeft, 
  FaCreditCard, 
  FaBarcode, 
  FaQrcode, 
  FaLock, 
  FaShieldAlt, 
  FaExclamationTriangle, 
  FaInfoCircle,
  FaDiscord,
  FaSteam
} from 'react-icons/fa';
import { SiRust } from 'react-icons/si';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import VipBadge from '../../components/ui/VipBadge';
import { fetchWithBaseUrl } from '../../lib/api';

// Estrutura de dados de planos VIP por jogo
const GAME_DATA = {
  rust: {
    id: 'rust',
    name: 'Rust',
    icon: <SiRust className="text-primary" />,
    plans: {
      'vip-basic': {
        id: 'vip-basic',
        databaseId: '0b81cf06-ed81-49ce-8680-8f9d9edc932e',
        name: 'VIP Basic',
        price: '19.90',
        description: 'Ideal para jogadores casuais que querem algumas vantagens extras.',
        features: [
          'Acesso ao plugin Furnace Splitter',
          'Prioridade na fila do servidor',
          'Acesso a eventos exclusivos para VIP Basic',
          'Badge exclusiva no Discord',
          'Cargo exclusivo no Discord',
          'Kit básico a cada wipe',
        ],
        isPopular: false,
      },
      'vip-plus': {
        id: 'vip-plus',
        databaseId: '3994ff53-f110-4c8f-a492-ad988528006f',
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
          'Kit avançado a cada wipe',
        ],
        isPopular: true,
      }
    }
  }
};

// Fluxo de detecção de jogo por ID de plano
const detectGameByPlanId = (planId) => {
  for (const gameKey in GAME_DATA) {
    const game = GAME_DATA[gameKey];
    if (game.plans && game.plans[planId]) {
      return gameKey;
    }
  }
  
  // Fallback para rust se não encontrar o jogo
  return 'rust';
};

const PlanFeatureList = ({ features }) => {
  if (!features || !features.length) return null;
  
  return (
    <ul className="space-y-2">
      {features.slice(0, 6).map((feature, index) => (
        <li key={index} className="flex items-start">
          <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 mt-0.5">
            <FaCheck className="h-3 w-3" />
          </div>
          <span className="text-gray-300 text-sm">{feature}</span>
        </li>
      ))}
      {features.length > 6 && (
        <li className="text-primary text-sm pl-8">
          +{features.length - 6} outros benefícios
        </li>
      )}
    </ul>
  );
};

const SteamIdSection = ({ steamId, setSteamId, onSave, loading }) => {
  return (
    <div className="space-y-4 pb-4 border-b border-dark-300 mb-4">
      <h3 className="flex items-center text-white font-medium">
        <FaSteam className="text-primary mr-2" /> Steam ID
      </h3>
      
      <div className="flex items-center">
        <input
          type="text"
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
          placeholder="76561198xxxxxxxxx"
          className="flex-grow bg-dark-300 border border-dark-200 rounded p-2 text-white focus:border-primary focus:outline-none"
        />
        <Button
          variant="primary"
          size="sm"
          className="ml-2"
          onClick={onSave}
          loading={loading}
        >
          Salvar
        </Button>
      </div>
      
      <div className="text-xs text-gray-400">
        <p>Steam ID deve conter 17 dígitos numéricos.</p>
        <p className="mt-1">
          Para encontrar seu Steam ID, acesse{' '}
          <a
            href="https://steamid.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            steamid.io
          </a>
        </p>
      </div>
    </div>
  );
};

const PaymentMethods = () => (
  <div className="space-y-3">
    <div className="p-3 rounded-lg bg-dark-300 flex items-center transition-all hover:bg-dark-200 cursor-pointer">
      <FaCreditCard className="text-primary mr-4 text-xl" />
      <span className="text-white">Cartão de Crédito</span>
    </div>
    
    <div className="p-3 rounded-lg bg-dark-300 flex items-center transition-all hover:bg-dark-200 cursor-pointer">
      <FaBarcode className="text-primary mr-4 text-xl" />
      <span className="text-white">Boleto Bancário</span>
    </div>
    
    <div className="p-3 rounded-lg bg-dark-300 flex items-center transition-all hover:bg-dark-200 cursor-pointer">
      <FaQrcode className="text-primary mr-4 text-xl" />
      <span className="text-white">PIX</span>
    </div>
    
    <div className="mt-4 text-center">
      <Image 
        src="/images/mercado-pago-logo.svg" 
        alt="Mercado Pago" 
        width={120} 
        height={30} 
        className="mx-auto mb-2"
      />
      <p className="text-gray-400 text-xs flex items-center justify-center">
        <FaLock className="mr-1" />
        Pagamentos processados com segurança
      </p>
    </div>
  </div>
);

export default function CheckoutPage({ userData, activeSubscription, error: serverError }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { planoId, error: queryError } = router.query;
  
  // Estados locais
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [steamId, setSteamId] = useState(userData?.steam_id || '');
  const [showSteamIdModal, setShowSteamIdModal] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);

  // Detectar automaticamente o jogo com base no plano
  const gameId = useMemo(() => detectGameByPlanId(planoId), [planoId]);
  const gameData = useMemo(() => GAME_DATA[gameId] || GAME_DATA.rust, [gameId]);

  useEffect(() => {
    // Verifica erros da query string ou do servidor
    if (queryError === 'true' || serverError) {
      toast.error(serverError || 'Ocorreu um erro durante o processamento do pagamento.');
    }
  }, [queryError, serverError]);
  
  useEffect(() => {
    // Busca o plano selecionado
    if (planoId && gameData.plans) {
      const plan = gameData.plans[planoId];
      if (plan) {
        setSelectedPlan(plan);
      } else {
        toast.error('Plano não encontrado');
        router.push('/planos');
      }
    }
  }, [planoId, gameData, router]);

  useEffect(() => {
    // Verifica se o usuário tem SteamID configurado
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

    setProcessingOrder(true);
    try {
      // Garantir que o Discord ID seja uma string
      const discordId = session.user.discord_id.toString();

      // Criar preferência de pagamento no Mercado Pago
      const paymentData = {
        title: `${selectedPlan.name} - ${gameData.name} - Phanteon Games`,
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
      setProcessingOrder(false);
    }
  };

  // Se não tiver plano selecionado, mostra carregando
  if (!selectedPlan) {
    return (
      <div className="container-custom mx-auto py-12 px-4 flex justify-center">
        <LoadingSpinner size="lg" text="Carregando detalhes do plano..." />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout - {selectedPlan.name} | Phanteon Games</title>
        <meta name="description" content={`Checkout para assinatura ${selectedPlan.name} no servidor de ${gameData.name} da Phanteon Games`} />
      </Head>

      <div className="container-custom mx-auto px-4 pt-12 pb-20">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Link href="/planos" className="flex items-center text-gray-400 hover:text-primary transition-colors">
            <FaArrowLeft className="mr-2" /> Voltar para Planos
          </Link>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-3 text-center">Finalizar Compra</h1>
          <p className="text-gray-400 text-center mb-10 max-w-2xl mx-auto">
            Complete seu pedido para ativar seu plano VIP e aproveitar todas as vantagens exclusivas.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Resumo do Pedido - Coluna maior */}
            <div className="lg:col-span-2 space-y-8">
              {/* Card de Detalhes do Plano */}
              <Card 
                className="border border-dark-200 overflow-hidden transform transition-all duration-300 hover:shadow-lg"
                shadow={true}
                padding="none"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gradient-to-r from-dark-300 to-dark-400 border-b border-dark-200">
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className="mr-4 flex">
                      {gameData.icon}
                      <VipBadge plan={selectedPlan.id} size={40} className="ml-2" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1 flex items-center">
                        {selectedPlan.name}
                        <span className="ml-2 px-3 py-0.5 text-xs bg-dark-200 rounded-full text-gray-300">
                          {gameData.name}
                        </span>
                      </h2>
                      <p className="text-gray-400 text-sm">{selectedPlan.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-sm">Preço</div>
                    <div className="text-2xl font-bold text-primary">
                      R$ {selectedPlan.price}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Benefícios Incluídos</h3>
                  <PlanFeatureList features={selectedPlan.features} />
                  
                  {userData && !userData.steam_id && (
                    <div className="mt-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex">
                        <FaInfoCircle className="text-primary mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-white mb-1">Configure seu Steam ID</h4>
                          <p className="text-gray-300 text-sm">
                            Para ativar seu VIP no servidor, precisamos do seu Steam ID de 17 dígitos.
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => setShowSteamIdModal(true)}
                      >
                        Configurar Steam ID
                      </Button>
                    </div>
                  )}

                  {activeSubscription && (
                    <div className="mt-6 p-4 rounded-lg border border-yellow-600/20 bg-yellow-900/10">
                      <div className="flex">
                        <FaExclamationTriangle className="text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-white mb-1">Você já possui um plano ativo</h4>
                          <p className="text-gray-300 text-sm">
                            Ao assinar um novo plano, seu plano atual ({activeSubscription.plan_name}) será substituído. 
                            Seu plano atual expira em{' '}
                            {new Date(activeSubscription.expires_at).toLocaleDateString('pt-BR')}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
                      variant="primary"
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
              
              {/* Configuração Steam ID (para usuários com Steam ID não configurado) */}
              {userData && !userData.steam_id && !paymentUrl && (
                <Card className="border border-dark-200">
                  <SteamIdSection 
                    steamId={steamId}
                    setSteamId={setSteamId}
                    onSave={handleSaveSteamId}
                    loading={loading}
                  />
                </Card>
              )}
            </div>

            {/* Coluna de resumo e pagamento */}
            <div className="lg:col-span-1 space-y-8">
              {/* Card de Resumo de Valores */}
              <Card 
                className="border border-dark-200 overflow-hidden"
                shadow={true}
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
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleCheckout}
                    loading={processingOrder}
                    disabled={processingOrder || !userData?.steam_id}
                    className="py-4"
                  >
                    {!userData?.steam_id 
                      ? "Configure seu Steam ID primeiro" 
                      : "Finalizar Compra"}
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
                <Card className="border border-dark-200">
                  <h3 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-dark-200">
                    Formas de Pagamento
                  </h3>
                  <PaymentMethods />
                </Card>
              )}
              
              {/* Card de Suporte */}
              <Card className="border border-dark-200 text-center">
                <div className="flex flex-col items-center">
                  <FaDiscord className="text-primary text-3xl mb-3" />
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
            toast.info('É necessário configurar seu Steam ID para continuar o processo de compra.');
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
              className="w-full bg-dark-300 border border-dark-200 rounded-md p-2.5 text-white focus:border-primary focus:outline-none"
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
      return {
        redirect: {
          destination: '/?auth=required',
          permanent: false,
        },
      };
    }
    
    const { planoId } = context.params;
    
    // Verifica se o planoId é válido buscando em todos os jogos
    let validPlan = false;
    for (const gameId in GAME_DATA) {
      if (GAME_DATA[gameId].plans && GAME_DATA[gameId].plans[planoId]) {
        validPlan = true;
        break;
      }
    }
    
    if (!validPlan) {
      return {
        redirect: {
          destination: '/planos',
          permanent: false,
        },
      };
    }
    
    // Busca dados do usuário pelo Discord ID
    const discordId = session.user.discord_id;
    const userData = await getUserByDiscordId(discordId);
    
    if (!userData) {
      return {
        props: {
          userData: null,
          activeSubscription: null,
          error: 'Não foi possível recuperar seus dados. Tente fazer login novamente.',
        },
      };
    }
    
    // Busca dados da assinatura ativa
    const activeSubscription = await getUserSubscription(userData.id);
    
    return {
      props: {
        userData: userData || null,
        activeSubscription: activeSubscription || null,
      },
    };
  } catch (error) {
    return {
      props: {
        userData: null,
        activeSubscription: null,
        error: 'Erro ao carregar dados. Tente novamente mais tarde.',
      },
    };
  }
}