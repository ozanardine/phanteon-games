import React from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import PlanCard from '../components/subscriptions/PlanCard';
import { FaQuestion } from 'react-icons/fa';

// Dados dos planos VIP
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
    isPopular: false,
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
    isPopular: true,
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
    isPopular: false,
  },
];

export default function PlanosPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSelectPlan = (planId) => {
    if (!session) {
      router.push('/?login=true');
      return;
    }
    
    router.push(`/checkout/${planId}`);
  };

  return (
    <>
      <Head>
        <title>Planos VIP | Phanteon Games</title>
      </Head>

      <div className="container-custom mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Escolha seu Plano VIP
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Obtenha vantagens exclusivas, kits especiais e comandos adicionais para melhorar sua experiência no servidor.
          </p>
        </div>

        {/* Planos VIP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {vipPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              id={plan.id}
              name={plan.name}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              isPopular={plan.isPopular}
              onClick={() => handleSelectPlan(plan.id)}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-dark-300 rounded-lg p-8 border border-dark-200">
          <h2 className="text-2xl font-bold text-white mb-6">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                <FaQuestion className="text-primary mr-2" />
                Por quanto tempo dura o VIP?
              </h3>
              <p className="text-gray-400">
                Todos os planos VIP têm duração de 30 dias a partir da data de ativação. Você pode renovar seu plano a qualquer momento através do seu perfil.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                <FaQuestion className="text-primary mr-2" />
                O que acontece quando o servidor tem wipe?
              </h3>
              <p className="text-gray-400">
                Após cada wipe do servidor, você poderá resgatar novamente seus kits exclusivos. Suas vantagens VIP permanecem ativas independentemente dos wipes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                <FaQuestion className="text-primary mr-2" />
                Como funciona o pagamento?
              </h3>
              <p className="text-gray-400">
                Todos os pagamentos são processados de forma segura através do Mercado Pago. Aceitamos cartões de crédito, boleto bancário e PIX.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                <FaQuestion className="text-primary mr-2" />
                Como recebo meu VIP após o pagamento?
              </h3>
              <p className="text-gray-400">
                Após a confirmação do pagamento, seu VIP será ativado automaticamente. Você receberá o cargo no Discord e as permissões no servidor Rust em até 5 minutos.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                <FaQuestion className="text-primary mr-2" />
                Posso mudar de plano?
              </h3>
              <p className="text-gray-400">
                Sim! Você pode fazer upgrade do seu plano a qualquer momento. O novo plano substituirá o anterior e terá duração de 30 dias a partir da data de ativação.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}