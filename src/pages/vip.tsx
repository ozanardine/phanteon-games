// src/pages/vip.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaCheck, FaTimes, FaArrowRight, FaDiscord, FaCrown } from 'react-icons/fa';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { SubscriptionPlan, getSubscriptionPlans, createSubscription, getCurrentSubscription } from '@/lib/supabase';
import { createPaymentPreference } from '@/lib/mercadopago';
import { checkDiscordConnection, initiateDiscordAuth } from '@/lib/discord';

export default function VIPPage() {
  const { user, profile } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [paymentOptions, setPaymentOptions] = useState(false);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState<number | null>(null);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  
  const router = useRouter();
  const { plan: planIdFromUrl, success, canceled } = router.query;

  // Carregar planos disponíveis
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const { data, error } = await getSubscriptionPlans();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setPlans(data);
          
          // Pré-selecionar plano da URL, se houver
          if (planIdFromUrl) {
            const planId = parseInt(planIdFromUrl as string, 10);
            if (!isNaN(planId)) {
              setSelectedPlan(planId);
            }
          }
        }
      } catch (error) {
        console.error('Error loading plans:', error);
        setError('Erro ao carregar os planos disponíveis.');
      }
    };
    
    loadPlans();
  }, [planIdFromUrl]);

  // Verificar assinatura atual e conexão com Discord
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          // Verificar assinatura atual
          const { subscription, error: subError } = await getCurrentSubscription();
          
          if (subError) {
            console.error('Error loading current subscription:', subError);
          } else {
            setCurrentSubscription(subscription);
          }
          
          // Verificar conexão com Discord
          const { connected, error: discordError } = await checkDiscordConnection();
          
          if (discordError) {
            console.error('Error checking Discord connection:', discordError);
          } else {
            setDiscordConnected(connected);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user]);

  // Mostrar resposta após o pagamento
  useEffect(() => {
    if (success && currentSubscription) {
      setError(null);
      window.scrollTo(0, 0);
    } else if (canceled) {
      setError('O pagamento foi cancelado ou não foi concluído. Tente novamente quando desejar.');
      window.scrollTo(0, 0);
    }
  }, [success, canceled, currentSubscription]);

  const handleSubscribe = async (planId: number) => {
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/vip?plan=${planId}`)}`);
      return;
    }
    
    setSelectedPlan(planId);
    window.scrollTo(0, 0);
  };

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    
    setCheckoutLoading(true);
    setError(null);
    
    try {
      // Verificar se existe conexão com Discord
      if (!discordConnected) {
        // Prompt para conectar com Discord primeiro
        if (window.confirm('Recomendamos conectar sua conta do Discord antes de prosseguir para receber automaticamente seu cargo VIP. Deseja conectar agora?')) {
          initiateDiscordAuth();
          return;
        }
      }
      
      // Criar assinatura
      const { data: subscription, error: subError } = await createSubscription(selectedPlan);
      
      if (subError) {
        throw subError;
      }
      
      if (!subscription) {
        throw new Error('Erro ao criar assinatura.');
      }
      
      // Obter objeto do plano selecionado
      const selectedPlanObj = plans.find(p => p.id === selectedPlan);
      
      if (!selectedPlanObj || !profile) {
        throw new Error('Dados incompletos para checkout.');
      }
      
      // Mostrar opções de pagamento ao usuário
      setPaymentOptions(true);
      setCurrentSubscriptionId(subscription.id);
      
      // Armazenar dados no estado
      setCheckoutData({
        planObj: selectedPlanObj,
        subscriptionId: subscription.id,
        profile: profile
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      setError(error.message || 'Erro ao processar pagamento. Tente novamente.');
      setCheckoutLoading(false);
    }
  };
  
  // Adicionar nova função para processar pagamento único
  const processPayment = async () => {
    setCheckoutLoading(true);
    try {
      // Verificar se temos os dados necessários
      if (!checkoutData?.planObj || !checkoutData?.subscriptionId) {
        throw new Error('Dados de checkout incompletos');
      }
      
      // Criar preferência de pagamento
      const { preference, error: prefError } = await createPaymentPreference(
        checkoutData.planObj,
        profile!,
        checkoutData.subscriptionId
      );
      
      if (prefError || !preference) {
        throw prefError || new Error('Erro ao criar preferência de pagamento.');
      }
      
      // Redirecionar para a página de pagamento
      const paymentUrl = process.env.NODE_ENV === 'production' 
        ? preference.init_point 
        : preference.sandbox_init_point;
        
      window.location.href = paymentUrl;
      
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Erro ao processar pagamento. Tente novamente.');
      setCheckoutLoading(false);
    }
  };
  
  // Adicionar função para processar assinatura recorrente
  const processRecurringSubscription = async () => {
    setCheckoutLoading(true);
    try {
      // Verificar se temos os dados necessários
      if (!checkoutData?.planObj || !checkoutData?.subscriptionId) {
        throw new Error('Dados de checkout incompletos');
      }
      
      // Criar assinatura recorrente
      const { subscription, error } = await createRecurringSubscription(
        checkoutData.planObj,
        profile!,
        checkoutData.subscriptionId
      );
      
      if (error || !subscription) {
        throw error || new Error('Erro ao criar assinatura recorrente.');
      }
      
      // Redirecionar para a página de pagamento
      window.location.href = subscription.init_point;
      
    } catch (error: any) {
      console.error('Recurring subscription error:', error);
      setError(error.message || 'Erro ao criar assinatura recorrente. Tente novamente.');
      setCheckoutLoading(false);
    }
  };

  const connectDiscord = () => {
    initiateDiscordAuth();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função temporária criada para fazer o código compilar
  const createRecurringSubscription = async (plan: any, user: any, subscriptionId: number) => {
    // Esta é uma implementação fictícia usada para resolver temporariamente 
    // o erro de compilação. A função real deverá ser implementada em mercadopago.ts
    return { subscription: null, error: new Error('Não implementado ainda') };
  };

  return (
    <MainLayout 
      title="Planos VIP" 
      description="Adquira seu plano VIP e desfrute de vantagens exclusivas em nossos servidores."
    >
      <div className="bg-phanteon-dark min-h-screen">
        <div className="relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-phanteon-dark to-phanteon-gray/50"></div>
            <div className="absolute top-[-50%] left-[-10%] w-[70%] h-[200%] bg-phanteon-orange/5 rounded-full blur-3xl transform rotate-12"></div>
            <div className="absolute bottom-[-30%] right-[-5%] w-[50%] h-[90%] bg-phanteon-orange/10 rounded-full blur-3xl"></div>
          </div>
          
          {/* Header Section */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-phanteon-orange">Planos</span> VIP
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Adquira vantagens exclusivas e apoie o desenvolvimento dos nossos servidores
            </p>
            
            {error && (
              <Alert variant="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            {success && currentSubscription && (
              <Alert variant="success">
                <h3 className="font-medium">Assinatura ativada com sucesso!</h3>
                <p>
                  Agradecemos por apoiar a Phanteon Games. Suas vantagens VIP já estão disponíveis.
                  {!discordConnected && " Para receber seu cargo no Discord, conecte sua conta abaixo."}
                </p>
              </Alert>
            )}
            
            {/* Discord Connection */}
            {user && !loading && (
              <div className="max-w-md mx-auto mb-10">
                <Card className="bg-[#5865F2]/10 border-[#5865F2]/30">
                  <div className="p-5 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <FaDiscord className="text-[#5865F2] text-3xl mr-3" />
                      <h3 className="text-xl font-semibold">Conta Discord</h3>
                    </div>
                    
                    {discordConnected ? (
                      <div className="bg-green-900/20 text-green-300 p-3 rounded-lg mb-4">
                        <div className="flex items-center justify-center">
                          <FaCheck className="mr-2" />
                          <span>Conta Discord conectada</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-300 mb-4">
                          Conecte sua conta Discord para receber automaticamente os benefícios VIP no servidor.
                        </p>
                        <Button 
                          variant="outline" 
                          className="bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border-[#5865F2]/30"
                          onClick={connectDiscord}
                        >
                          <FaDiscord className="mr-2" /> Conectar Discord
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
        
        {/* Current Subscription */}
        {user && currentSubscription && !loading && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
            <Card className="bg-phanteon-light/20 border-phanteon-orange/30">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div className="flex items-center mb-4 md:mb-0">
                    <FaCrown className="text-phanteon-orange text-3xl mr-4" />
                    <div>
                      <h2 className="text-2xl font-bold">Sua Assinatura Atual</h2>
                      <p className="text-gray-300">
                        {currentSubscription.plan?.name || "Plano VIP"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-phanteon-orange/10 rounded-lg px-4 py-2">
                    <p className="text-lg font-bold text-phanteon-orange">
                      {currentSubscription.status === 'active' ? 'Ativo' : 
                       currentSubscription.status === 'pending' ? 'Pendente' : 
                       currentSubscription.status === 'canceled' ? 'Cancelado' : 'Expirado'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-phanteon-dark/40 rounded-lg p-4">
                    <p className="text-gray-400 mb-1">Data de início</p>
                    <p className="text-white font-medium">
                      {currentSubscription.start_date 
                        ? new Date(currentSubscription.start_date).toLocaleDateString('pt-BR')
                        : 'Pendente'}
                    </p>
                  </div>
                  <div className="bg-phanteon-dark/40 rounded-lg p-4">
                    <p className="text-gray-400 mb-1">Validade</p>
                    <p className="text-white font-medium">
                      {currentSubscription.end_date 
                        ? new Date(currentSubscription.end_date).toLocaleDateString('pt-BR')
                        : 'Pendente'}
                    </p>
                  </div>
                  <div className="bg-phanteon-dark/40 rounded-lg p-4">
                    <p className="text-gray-400 mb-1">Renovação automática</p>
                    <p className="text-white font-medium">
                      {currentSubscription.auto_renew ? 'Ativada' : 'Desativada'}
                    </p>
                  </div>
                </div>
                
                {currentSubscription.status === 'active' && (
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja cancelar sua assinatura? Você perderá todos os benefícios VIP.')) {
                          // Lógica para cancelar assinatura
                        }
                      }}
                    >
                      Cancelar Assinatura
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
        
        {/* Checkout for Selected Plan */}
        {user && selectedPlan && !currentSubscription?.status === 'active' && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
            <Card className="border-phanteon-orange/30">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Finalizar Assinatura</h2>
                
                {plans.filter(p => p.id === selectedPlan).map(plan => (
                  <div key={plan.id} className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{plan.name}</h3>
                        <p className="text-gray-300">{plan.description}</p>
                      </div>
                      <p className="text-2xl font-bold text-phanteon-orange">
                        {formatCurrency(plan.price)}<span className="text-gray-400 text-sm">/mês</span>
                      </p>
                    </div>
                    
                    <div className="bg-phanteon-dark/40 rounded-lg p-4 mb-6">
                      <h4 className="font-medium mb-3">Vantagens incluídas:</h4>
                      <ul className="space-y-2">
                        {(plan.features as string[]).map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-blue-900/10 text-blue-300 p-4 rounded-lg mb-6">
                      <p className="flex items-start">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                        </svg>
                        Você será redirecionado para o Mercado Pago para concluir o pagamento seguro.
                      </p>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedPlan(null)}
                      >
                        Voltar
                      </Button>
                      
                      <Button 
                        variant="primary" 
                        onClick={handleCheckout}
                        isLoading={checkoutLoading}
                      >
                        Pagar com Mercado Pago {!checkoutLoading && <FaArrowRight className="ml-2" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
        
        {/* Pricing Card */}
        {(!selectedPlan || !user) && (
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-phanteon-orange"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {plans.map((plan) => (
                  <Card key={plan.id} className={`border-phanteon-light overflow-hidden ${
                    plan.name.includes('Gold') ? 'border-yellow-600/30 bg-gradient-to-br from-phanteon-gray to-yellow-900/10' : ''
                  }`}>
                    <div className="p-6">
                      {plan.name.includes('Gold') && (
                        <div className="bg-yellow-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full mb-4 inline-block">
                          Mais Popular
                        </div>
                      )}
                      
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-gray-300 mb-4">{plan.description}</p>
                      
                      <div className="mb-6">
                        <p className="text-3xl font-bold text-phanteon-orange">
                          {formatCurrency(plan.price)}
                          <span className="text-gray-400 text-base font-normal">/mês</span>
                        </p>
                      </div>
                      
                      <div className="space-y-3 mb-8">
                        {(plan.features as string[]).map((feature, index) => (
                          <div key={index} className="flex items-start">
                            <div className="flex-shrink-0">
                              <FaCheck className="text-green-500 mt-1" />
                            </div>
                            <p className="ml-3 text-gray-300">{feature}</p>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        variant={plan.name.includes('Gold') ? "primary" : "outline"}
                        fullWidth
                        onClick={() => handleSubscribe(plan.id)}
                        className={plan.name.includes('Gold') ? "" : "hover:bg-phanteon-orange/10"}
                      >
                        {currentSubscription?.status === 'active' && currentSubscription?.plan?.id === plan.id
                          ? 'Assinatura Ativa'
                          : 'Assinar'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* FAQ Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center mb-10">
            <span className="text-phanteon-orange">Perguntas</span> Frequentes
          </h2>
          
          <div className="space-y-6">
            <Card>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-3">O que são os planos VIP?</h3>
                <p className="text-gray-300">
                  Os planos VIP oferecem vantagens exclusivas nos nossos servidores, como cargos especiais no Discord, acesso a canais exclusivos, skins exclusivas, kits especiais e muito mais.
                </p>
              </div>
            </Card>
            
            <Card>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-3">Qual a diferença entre os planos?</h3>
                <p className="text-gray-300">
                  O plano Gold oferece todos os benefícios do plano Prata, além de vantagens adicionais como kits semanais mais poderosos, prioridade na fila e skins exclusivas avançadas.
                </p>
              </div>
            </Card>
            
            <Card>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-3">Como funciona o pagamento?</h3>
                <p className="text-gray-300">
                  O pagamento é processado de forma 100% segura através do Mercado Pago. Aceitamos cartões de crédito, débito e outros métodos disponíveis na plataforma.
                </p>
              </div>
            </Card>
            
            <Card>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-3">Posso cancelar minha assinatura?</h3>
                <p className="text-gray-300">
                  Sim, você pode cancelar sua assinatura a qualquer momento através do seu painel de usuário. Os benefícios permanecerão ativos até o fim do período pago.
                </p>
              </div>
            </Card>
            
            <Card>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-3">Como recebo meus benefícios?</h3>
                <p className="text-gray-300">
                  Após a confirmação do pagamento, seus benefícios são ativados automaticamente. Para receber o cargo VIP no Discord, é necessário conectar sua conta do Discord ao nosso site.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}