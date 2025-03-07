import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { FaGamepad, FaQuestionCircle, FaServer, FaRocket } from 'react-icons/fa';
import { SiRust } from 'react-icons/si';
import { TabSelector } from '../components/ui/TabSelector';
import PlanCard from '../components/subscriptions/PlanCard';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Mapeamento de planos para IDs no banco de dados
const planIdMapping = {
  'vip-basic': '0b81cf06-ed81-49ce-8680-8f9d9edc932e',
  'vip-plus': '3994ff53-f110-4c8f-a492-ad988528006f',
};

// Definição dos planos específicos por jogo
const gameSpecificPlans = {
  rust: [
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
  ],
};

// Lista de jogos disponíveis
const availableGames = [
  { id: 'rust', name: 'Rust', icon: <SiRust /> },
  // Aqui podem ser adicionados outros jogos no futuro
];

export default function PlanosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { game: initialGame } = router.query;
  
  const [activeGame, setActiveGame] = useState('rust');
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);

  // Define o jogo ativo com base na query ou padrão
  useEffect(() => {
    if (initialGame && availableGames.some(g => g.id === initialGame)) {
      setActiveGame(initialGame);
    }
  }, [initialGame]);

  // Buscar planos do banco de dados ou usar os definidos localmente
  useEffect(() => {
    async function fetchPlanos() {
      try {
        setLoading(true);
        
        // Tenta buscar planos da API
        const response = await fetch('/api/plans');
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.plans) {
            // Filtrar planos para o jogo selecionado
            const gameFilteredPlans = data.plans.filter(plan => 
              plan.id === 'vip-basic' || plan.id === 'vip-plus'
            );
            
            // Se houver planos, atualize-os com os recursos específicos do jogo
            if (gameFilteredPlans.length > 0) {
              const updatedPlans = gameFilteredPlans.map(plan => {
                const localPlan = gameSpecificPlans[activeGame].find(p => p.id === plan.id);
                if (localPlan) {
                  return {
                    ...plan,
                    features: localPlan.features,
                    isPopular: localPlan.isPopular
                  };
                }
                return plan;
              });
              
              setPlanos(updatedPlans);
            } else {
              // Fallback para planos locais
              setPlanos(gameSpecificPlans[activeGame] || []);
            }
          } else {
            // Fallback para planos locais
            setPlanos(gameSpecificPlans[activeGame] || []);
          }
        } else {
          // Fallback para planos locais
          setPlanos(gameSpecificPlans[activeGame] || []);
        }
      } catch (error) {
        console.error('Erro ao buscar planos:', error);
        // Fallback para planos locais
        setPlanos(gameSpecificPlans[activeGame] || []);
      } finally {
        setLoading(false);
      }
    }

    fetchPlanos();
  }, [activeGame]);

  // Atualiza a URL quando o jogo ativo muda
  useEffect(() => {
    router.push(`/planos?game=${activeGame}`, undefined, { shallow: true });
  }, [activeGame, router]);

  const handleSelectPlan = (planId) => {
    if (!session) {
      router.push('/?login=true');
      return;
    }
    
    router.push(`/checkout/${planId}`);
  };

  const handleGameChange = (gameId) => {
    setActiveGame(gameId);
  };

  // Dados de FAQ específicos para cada jogo
  const faqItems = {
    rust: [
      {
        question: 'Por quanto tempo dura o VIP?',
        answer: 'Todos os planos VIP têm duração de 30 dias a partir da data de ativação. Você pode renovar seu plano a qualquer momento através do seu perfil.'
      },
      {
        question: 'O que acontece quando o servidor tem wipe?',
        answer: 'Após cada wipe do servidor, você poderá resgatar novamente seus kits exclusivos. Suas vantagens VIP permanecem ativas independentemente dos wipes.'
      },
      {
        question: 'Como funciona o pagamento?',
        answer: 'Todos os pagamentos são processados de forma segura através do Mercado Pago. Aceitamos cartões de crédito, boleto bancário e PIX.'
      },
      {
        question: 'Como recebo meu VIP após o pagamento?',
        answer: 'Após a confirmação do pagamento, seu VIP será ativado automaticamente. Você receberá o cargo no Discord e as permissões no servidor Rust em até 5 minutos.'
      },
      {
        question: 'Posso mudar de plano?',
        answer: 'Sim! Você pode fazer upgrade do seu plano a qualquer momento. O novo plano substituirá o anterior e terá duração de 30 dias a partir da data de ativação.'
      }
    ]
  };

  // Renderização do título específico para cada jogo
  const renderGameTitle = () => {
    switch (activeGame) {
      case 'rust':
        return (
          <div className="flex items-center">
            <SiRust className="text-3xl mr-3 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Planos VIP <span className="text-primary">Rust</span>
            </h1>
          </div>
        );
      default:
        return (
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Escolha seu Plano VIP
          </h1>
        );
    }
  };

  // Descrição específica para cada jogo
  const getGameDescription = () => {
    switch (activeGame) {
      case 'rust':
        return 'Obtenha vantagens exclusivas, kits especiais e comandos adicionais para melhorar sua experiência no servidor Rust.';
      default:
        return 'Obtenha vantagens exclusivas, kits especiais e comandos adicionais para melhorar sua experiência no servidor.';
    }
  };

  if (loading) {
    return (
      <div className="container-custom mx-auto py-12 flex justify-center items-center">
        <div className="text-center">
          <LoadingSpinner color="primary" size="lg" text="Carregando planos..." />
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
        {/* Tabs de jogos */}
        <div className="mb-8">
          <TabSelector
            tabs={availableGames.map(game => ({
              id: game.id,
              label: game.name,
              icon: game.icon
            }))}
            activeTab={activeGame}
            onChange={handleGameChange}
            className="mb-12"
          />

          {/* Header específico para o jogo selecionado */}
          <div className="text-center mb-12">
            {renderGameTitle()}
            <p className="text-gray-400 max-w-2xl mx-auto mt-4">
              {getGameDescription()}
            </p>
          </div>
        </div>

        {/* Banner do servidor */}
        <div className="mb-12 bg-gradient-to-r from-dark-400 to-dark-300 rounded-lg p-6 border border-dark-200">
          <div className="flex flex-col md:flex-row items-center">
            <div className="mb-6 md:mb-0 md:mr-8">
              <FaServer className="text-5xl text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Servidor Phanteon Rust</h3>
              <p className="text-gray-300 mb-3">
                O melhor servidor Rust com comunidade ativa, eventos diários e uma experiência de jogo única.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <FaGamepad className="mr-1 text-primary" /> 100 Slots
                </span>
                <span className="flex items-center">
                  <FaRocket className="mr-1 text-primary" /> Wipe Mensal
                </span>
                <span className="flex items-center">
                  <FaServer className="mr-1 text-primary" /> 82.29.62.21:28015
                </span>
              </div>
            </div>
          </div>
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

        {/* Comparativo de planos (opcional) */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Comparativo de Planos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-400">
                  <th className="p-4 text-left text-gray-300">Recursos</th>
                  <th className="p-4 text-center text-white">VIP Basic</th>
                  <th className="p-4 text-center text-white">VIP Plus</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-dark-300">
                  <td className="p-4 text-gray-300">Furnace Splitter</td>
                  <td className="p-4 text-center text-green-500">✓</td>
                  <td className="p-4 text-center text-green-500">✓</td>
                </tr>
                <tr className="border-b border-dark-300">
                  <td className="p-4 text-gray-300">QuickSmelt</td>
                  <td className="p-4 text-center text-red-500">✗</td>
                  <td className="p-4 text-center text-green-500">✓</td>
                </tr>
                <tr className="border-b border-dark-300">
                  <td className="p-4 text-gray-300">Prioridade na fila</td>
                  <td className="p-4 text-center text-green-500">Normal</td>
                  <td className="p-4 text-center text-green-500">Máxima</td>
                </tr>
                <tr className="border-b border-dark-300">
                  <td className="p-4 text-gray-300">Acesso a eventos exclusivos</td>
                  <td className="p-4 text-center text-green-500">Básicos</td>
                  <td className="p-4 text-center text-green-500">Todos</td>
                </tr>
                <tr className="border-b border-dark-300">
                  <td className="p-4 text-gray-300">Sorteios mensais de skins</td>
                  <td className="p-4 text-center text-red-500">✗</td>
                  <td className="p-4 text-center text-green-500">✓</td>
                </tr>
                <tr className="border-b border-dark-300">
                  <td className="p-4 text-gray-300">Kit ao iniciar</td>
                  <td className="p-4 text-center text-green-500">Básico</td>
                  <td className="p-4 text-center text-green-500">Avançado</td>
                </tr>
                <tr className="border-b border-dark-300">
                  <td className="p-4 text-gray-300">Salas exclusivas no Discord</td>
                  <td className="p-4 text-center text-red-500">✗</td>
                  <td className="p-4 text-center text-green-500">✓</td>
                </tr>
                <tr className="border-b border-dark-300">
                  <td className="p-4 text-gray-300">Suporte prioritário</td>
                  <td className="p-4 text-center text-red-500">✗</td>
                  <td className="p-4 text-center text-green-500">✓</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-300">Preço</td>
                  <td className="p-4 text-center text-primary font-bold">R$ 19,90/mês</td>
                  <td className="p-4 text-center text-primary font-bold">R$ 29,90/mês</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section com Accordion */}
        <div className="bg-dark-300 rounded-lg p-8 border border-dark-200">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
            <FaQuestionCircle className="text-primary mr-2" />
            Perguntas Frequentes
          </h2>

          <div className="space-y-4">
            {faqItems[activeGame]?.map((faq, index) => (
              <div 
                key={index} 
                className="border border-dark-200 rounded-lg overflow-hidden"
              >
                <button
                  className="w-full p-4 flex justify-between items-center text-left focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  <h3 className="text-lg font-semibold text-white">
                    {faq.question}
                  </h3>
                  <span className={`transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
                <div 
                  className={`transition-all duration-300 ${
                    activeFaq === index 
                      ? 'max-h-96 opacity-100' 
                      : 'max-h-0 opacity-0 overflow-hidden'
                  }`}
                >
                  <p className="p-4 text-gray-400 border-t border-dark-200">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}