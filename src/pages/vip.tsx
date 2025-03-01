// src/pages/vip.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../lib/utils/formatUtils';
import { FaCheckCircle, FaTimesCircle, FaCrown, FaRocket, FaGift, FaServer, FaPaypal, FaCreditCard } from 'react-icons/fa';

const VipPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, hasActiveSubscription, loading } = useAuth();
  const [paymentProvider, setPaymentProvider] = useState<'mercadopago' | 'paypal'>('mercadopago');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Preço único do VIP
  const vipPrice = 29.90;
  
  // Benefícios do VIP
  const vipFeatures = [
    { name: 'Acesso prioritário à fila do servidor', included: true, highlight: true },
    { name: 'Tag exclusiva no jogo', included: true, highlight: true },
    { name: 'Acesso a eventos exclusivos VIP', included: true, highlight: true },
    { name: 'Kits diários de recursos', included: true },
    { name: 'Acesso ao chat VIP no Discord', included: true },
    { name: 'Capacidade de armazenamento aumentada', included: true },
    { name: 'Itens cosméticos exclusivos', included: true },
    { name: 'Privilégios de votação para seleção de mapa', included: true },
    { name: 'Estatísticas de jogo estendidas', included: true },
    { name: 'Acesso antecipado a novos recursos', included: true },
  ];

  // Processar pagamento da assinatura
  // Handle subscription checkout
  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      // Redirect to login page
      router.push('/auth/login?redirect=/vip');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Make API call to create checkout session
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
          customerEmail: user?.email,
          customerName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          provider: paymentProvider
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to checkout page
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('There was an error processing your request. Please try again later.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <Layout 
      title="Assinatura VIP - Phanteon Games"
      description="Junte-se ao nosso programa VIP e desfrute de benefícios exclusivos, acesso prioritário e vantagens especiais em nossa comunidade de jogos."
    >
      <div className="relative overflow-hidden">
        {/* Imagem de fundo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed opacity-20 z-0" 
          style={{ backgroundImage: "url('/images/vip-background.jpg')" }}
        ></div>
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <FaCrown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Assinatura VIP</h1>
            <p className="text-xl text-zinc-300">
              Melhore sua experiência com vantagens exclusivas, acesso prioritário e recursos premium.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" color="amber" text="Carregando informações de assinatura..." />
            </div>
          ) : hasActiveSubscription ? (
            <Card className="max-w-2xl mx-auto p-8 border-amber-500">
              <div className="text-center">
                <div className="inline-block p-3 rounded-full bg-amber-500/20 mb-4">
                  <FaCheckCircle className="w-12 h-12 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Você é um membro VIP!</h2>
                <p className="text-zinc-300 mb-6">
                  Sua assinatura VIP está ativa até {user?.subscription?.currentPeriodEnd.toLocaleDateString()}.
                  Aproveite seus benefícios exclusivos e obrigado por nos apoiar!
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/perfil')}
                  >
                    Gerenciar Assinatura
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard')}
                  >
                    Acessar Painel VIP
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Card do Plano VIP */}
              <Card className="max-w-4xl mx-auto border-amber-500 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-amber-800 p-4 text-center">
                  <h2 className="text-2xl font-bold text-white">Assinatura VIP</h2>
                </div>
                
                <div className="p-6 md:p-8">
                  <div className="text-center mb-8">
                    <div className="text-3xl font-bold text-amber-500 mb-2">
                      {formatCurrency(vipPrice)}
                    </div>
                    <p className="text-zinc-400">Pagamento único para 30 dias de acesso VIP</p>
                  </div>
                  
                  {/* Seleção de provedor de pagamento */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Escolha seu método de pagamento:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          paymentProvider === 'mercadopago' 
                            ? 'border-amber-500 bg-amber-500/10' 
                            : 'border-zinc-700 hover:border-zinc-500'
                        }`}
                        onClick={() => setPaymentProvider('mercadopago')}
                      >
                        <div className="text-center">
                          <FaCreditCard className="w-10 h-10 mx-auto text-amber-500 mb-3" />
                          <div className="font-bold mb-1">Mercado Pago</div>
                          <div className="text-sm text-zinc-400">Cartão de Crédito, PIX, Boleto</div>
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          paymentProvider === 'paypal' 
                            ? 'border-amber-500 bg-amber-500/10' 
                            : 'border-zinc-700 hover:border-zinc-500'
                        }`}
                        onClick={() => setPaymentProvider('paypal')}
                      >
                        <div className="text-center">
                          <FaPaypal className="w-10 h-10 mx-auto text-blue-500 mb-3" />
                          <div className="font-bold mb-1">PayPal</div>
                          <div className="text-sm text-zinc-400">Cartão de Crédito, Saldo PayPal</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Lista de benefícios */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Benefícios VIP:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {vipFeatures.map((feature, index) => (
                        <div 
                          key={index} 
                          className={`flex items-start p-3 border border-zinc-700 rounded-lg ${
                            feature.highlight ? 'bg-amber-500/10 border-amber-500/30' : ''
                          }`}
                        >
                          <FaCheckCircle className="text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                          <span>{feature.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Botão de pagamento */}
                  <div className="text-center">
                    <Button 
                      size="lg"
                      onClick={handleSubscribe}
                      isLoading={isProcessingPayment}
                      disabled={isProcessingPayment}
                    >
                      {isAuthenticated ? 'Assinar Agora' : 'Faça Login para Assinar'}
                    </Button>
                    {!isAuthenticated && (
                      <p className="mt-2 text-sm text-zinc-400">
                        Você precisa fazer login primeiro para completar sua assinatura.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
              
              {/* Seção de benefícios */}
              <div className="mt-16 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-10">Por que se tornar VIP?</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                        <FaRocket className="w-6 h-6 text-amber-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Acesso Prioritário</h3>
                      <p className="text-zinc-300">
                        Pule a fila e tenha acesso prioritário ao servidor, mesmo quando estiver cheio. Nunca mais espere para entrar!
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                        <FaGift className="w-6 h-6 text-amber-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Recompensas Exclusivas</h3>
                      <p className="text-zinc-300">
                        Receba kits diários de recursos e itens cosméticos exclusivos indisponíveis para jogadores regulares.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                        <FaCrown className="w-6 h-6 text-amber-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Status VIP Especial</h3>
                      <p className="text-zinc-300">
                        Destaque-se com uma tag VIP especial no jogo e em nossa comunidade do Discord.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                        <FaServer className="w-6 h-6 text-amber-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Apoie Nossos Servidores</h3>
                      <p className="text-zinc-300">
                        Sua assinatura nos ajuda a manter servidores de alta qualidade e desenvolver novos recursos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Seção de perguntas frequentes */}
              <div className="mt-16 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-10">Perguntas Frequentes</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Quanto tempo dura minha assinatura VIP?</h3>
                    <p className="text-zinc-300">
                      Sua assinatura VIP dura 30 dias. Após este período, você pode renovar sua assinatura para continuar desfrutando dos benefícios.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-2">Posso cancelar minha assinatura?</h3>
                    <p className="text-zinc-300">
                      Como o VIP é um pagamento único para 30 dias de acesso, ele não será renovado automaticamente. Você tem controle sobre quando deseja comprar o VIP novamente.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-2">Como acesso meus benefícios VIP?</h3>
                    <p className="text-zinc-300">
                      Assim que seu pagamento for processado, sua conta será automaticamente atualizada para o status VIP. 
                      Você receberá instruções sobre como reivindicar seus benefícios tanto no jogo quanto no Discord.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-2">Quais métodos de pagamento vocês aceitam?</h3>
                    <p className="text-zinc-300">
                      Aceitamos pagamentos através do Mercado Pago (Cartão de Crédito, PIX, Boleto) e PayPal. Todos os pagamentos são processados com segurança.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VipPage;