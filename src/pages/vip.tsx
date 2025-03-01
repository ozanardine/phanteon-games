import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiCheck } from 'react-icons/fi';
import Link from 'next/link';
import { useAuth } from '@/components/contexts/AuthContext';

export default function VIPPage() {
  const { isAuthenticated } = useAuth();
  
  const plans = [
    {
      id: 'basic',
      name: 'VIP Básico',
      price: 'R$ 15,00',
      period: 'por mês',
      features: [
        'Kit VIP em todos os servidores',
        'Tag VIP no Discord',
        'Acesso a servidores VIP',
        'Suporte prioritário',
      ],
      popular: false,
      color: 'bg-phanteon-gray',
    },
    {
      id: 'premium',
      name: 'VIP Premium',
      price: 'R$ 25,00',
      period: 'por mês',
      features: [
        'Todos os benefícios do VIP Básico',
        'Kits exclusivos',
        'Comandos exclusivos',
        'Acesso antecipado a eventos',
        'Itens decorativos exclusivos',
      ],
      popular: true,
      color: 'bg-gradient-to-br from-phanteon-orange/20 to-phanteon-gray',
    },
    {
      id: 'ultimate',
      name: 'VIP Ultimate',
      price: 'R$ 40,00',
      period: 'por mês',
      features: [
        'Todos os benefícios do VIP Premium',
        'Kits Ultimate',
        'Voz nas decisões da comunidade',
        'Acesso aos servidores de teste',
        'Sorteios exclusivos mensais',
        'Poder de voto em novos recursos',
      ],
      popular: false,
      color: 'bg-phanteon-gray',
    },
  ];
  
  return (
    <Layout title="Planos VIP | Phanteon Games" description="Conheça os planos VIP da Phanteon Games">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Planos VIP</h1>
          <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
            Torne-se um membro VIP e desfrute de benefícios exclusivos em todos os nossos servidores.
            Escolha o plano que melhor se adapta às suas necessidades.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.id} className="flex flex-col">
              <Card className={`flex-1 ${plan.popular ? 'border-phanteon-orange' : ''}`}>
                {plan.popular && (
                  <div className="bg-phanteon-orange text-white text-center py-1 text-sm font-medium">
                    MAIS POPULAR
                  </div>
                )}
                
                <CardHeader className={`rounded-t-lg ${plan.color}`}>
                  <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-300 ml-1">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <ul className="space-y-3 mt-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <FiCheck className="text-phanteon-orange mt-1 mr-2 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  {isAuthenticated ? (
                    <Button fullWidth variant={plan.popular ? 'primary' : 'outline'}>
                      Adquirir {plan.name}
                    </Button>
                  ) : (
                    <Link href="/login" className="w-full">
                      <Button fullWidth variant={plan.popular ? 'primary' : 'outline'}>
                        Entrar para Adquirir
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
        
        <div className="mt-16">
          <div className="bg-phanteon-gray rounded-lg p-6 border border-phanteon-light">
            <h2 className="text-2xl font-bold text-white mb-4">Perguntas Frequentes</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Como funciona o pagamento?</h3>
                <p className="text-gray-300">
                  Aceitamos pagamentos via PIX, boleto bancário, cartão de crédito e PayPal.
                  Após a confirmação do pagamento, seu VIP é ativado automaticamente.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Posso mudar de plano?</h3>
                <p className="text-gray-300">
                  Sim, você pode fazer upgrade do seu plano a qualquer momento.
                  O valor proporcional do seu plano atual será descontado no novo plano.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Os benefícios funcionam em todos os servidores?</h3>
                <p className="text-gray-300">
                  Sim, os benefícios do VIP são válidos em todos os nossos servidores.
                  Alguns servidores podem ter benefícios específicos adicionais.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Posso cancelar minha assinatura?</h3>
                <p className="text-gray-300">
                  Sim, você pode cancelar sua assinatura a qualquer momento.
                  O VIP continuará ativo até o final do período contratado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}