import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import PlanCard from '../components/subscriptions/PlanCard';
import { FaQuestion } from 'react-icons/fa';

// Mapeamento de planos para IDs no banco de dados
const planIdMapping = {
  'vip-basic': '0b81cf06-ed81-49ce-8680-8f9d9edc932e',   // VIP Bronze
  'vip-plus': '3994ff53-f110-4c8f-a492-ad988528006f',    // VIP Prata
};

export default function PlanosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Buscar planos do banco de dados
  useEffect(() => {
    async function fetchPlanos() {
      try {
        const response = await fetch('/api/plans');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.plans) {
            // Filtrar apenas os planos que queremos exibir (basic e plus)
            const planosFiltered = data.plans.filter(plan => 
              plan.id === 'vip-basic' || plan.id === 'vip-plus'
            );
            setPlanos(planosFiltered);
          } else {
            // Se falhar, usamos os planos hardcoded abaixo
            setPlanos(vipPlans);
          }
        } else {
          // Se falhar, usamos os planos hardcoded abaixo
          setPlanos(vipPlans);
        }
      } catch (error) {
        console.error('Erro ao buscar planos:', error);
        // Se falhar, usamos os planos hardcoded abaixo
        setPlanos(vipPlans);
      } finally {
        setLoading(false);
      }
    }

    fetchPlanos();
  }, []);

  // Dados dos planos VIP hardcoded (fallback)
  const vipPlans = [
    {
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
    {
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
    },
  ];

  const handleSelectPlan = (planId) => {
    if (!session) {
      router.push('/?login=true');
      return;
    }
    
    router.push(`/checkout/${planId}`);
  };

  if (loading) {
    return (
      <div className="container-custom mx-auto py-12 flex justify-center items-center">
        <div className="animate-pulse text-center">
          <p className="text-gray-400">Carregando planos...</p>
        </div>
      </div>
    );
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {planos.map((plan) => (
            <PlanCard
              key={plan.id}
              id={plan.id}
              name={plan.name}
              price={plan.price}
              description={plan.description}
              features={plan.features instanceof Array ? plan.features : 
                (plan.features ? Object.entries(plan.features).map(([key, value]) => 
                  typeof value === 'boolean' && value 
                    ? key.replace(/_/g, ' ') 
                    : `${key.replace(/_/g, ' ')}: ${value}`
                ) : [])}
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