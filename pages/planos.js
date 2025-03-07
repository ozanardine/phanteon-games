import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { FaGamepad, FaQuestionCircle, FaServer, FaRocket, FaCheck, FaTimes, FaDiscord } from 'react-icons/fa';
import { SiRust } from 'react-icons/si';
import { TabSelector } from '../components/ui/TabSelector';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Dados estáticos movidos para fora do componente para evitar recriação a cada renderização
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

// Dados para a tabela de comparação
const comparisonData = [
  { feature: 'Furnace Splitter', basic: true, plus: true },
  { feature: 'QuickSmelt', basic: false, plus: true },
  { feature: 'Prioridade na fila', basic: 'Normal', plus: 'Máxima' },
  { feature: 'Acesso a eventos exclusivos', basic: 'Básicos', plus: 'Todos' },
  { feature: 'Sorteios mensais de skins', basic: false, plus: true },
  { feature: 'Kit ao iniciar', basic: 'Básico', plus: 'Avançado' },
  { feature: 'Salas exclusivas no Discord', basic: true, plus: true },
  { feature: 'Suporte prioritário', basic: false, plus: true },
  { feature: 'Preço', basic: 'R$ 19,90/mês', plus: 'R$ 29,90/mês' }
];

// Componente VIP Card
function VipCard({ plan, onSelectPlan }) {
  if (!plan) return null;
  
  // Garante que features seja um array para evitar erros no mapeamento
  const features = Array.isArray(plan.features) ? plan.features : [];
  
  return (
    <div 
      className={`relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-xl ${
        plan.isPopular 
          ? 'border-2 border-primary shadow-lg' 
          : 'border border-dark-200'
      }`}
    >
      {plan.isPopular && (
        <div className="absolute -right-10 top-6 bg-primary text-white py-1 px-10 transform rotate-45 text-sm font-bold z-10">
          Popular
        </div>
      )}
      
      <div className={`p-6 ${plan.isPopular ? 'bg-gradient-to-r from-primary/10 to-dark-300' : 'bg-dark-300'}`}>
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
          {plan.name}
        </h3>
        <div className="flex items-baseline mb-4">
          <span className="text-3xl font-extrabold text-white">R${plan.price}</span>
          <span className="text-gray-400 ml-1">/mês</span>
        </div>
        <p className="text-gray-400">{plan.description}</p>
      </div>
      
      <div className="bg-dark-400 p-6">
        <ul className="space-y-3 mb-6">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${plan.isPopular ? 'bg-primary' : 'bg-gray-600'} flex items-center justify-center mr-3 mt-0.5`}>
                <FaCheck className="h-3 w-3 text-white" />
              </div>
              <span className="text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button
          variant={plan.isPopular ? 'primary' : 'outline'}
          size="lg"
          fullWidth
          onClick={() => onSelectPlan(plan.id)}
          className="mt-2"
        >
          Assinar Agora
        </Button>
      </div>
    </div>
  );
}

// Componente de comparação de planos
function PlansComparison() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-dark-400 text-white">
            <th className="text-left p-4 font-medium">Recursos</th>
            <th className="text-center p-4 font-medium">VIP Basic</th>
            <th className="text-center p-4 font-medium">VIP Plus</th>
          </tr>
        </thead>
        <tbody>
          {comparisonData.map((row, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-dark-300' : 'bg-dark-400/60'}>
              <td className="p-4 text-gray-300">{row.feature}</td>
              <td className="p-4 text-center">
                {typeof row.basic === 'boolean' ? (
                  row.basic ? 
                    <FaCheck className="inline-block text-green-500" /> : 
                    <FaTimes className="inline-block text-red-500" />
                ) : (
                  <span className={row.feature === 'Preço' ? 'font-bold text-primary' : 'text-gray-300'}>
                    {row.basic}
                  </span>
                )}
              </td>
              <td className="p-4 text-center">
                {typeof row.plus === 'boolean' ? (
                  row.plus ? 
                    <FaCheck className="inline-block text-green-500" /> : 
                    <FaTimes className="inline-block text-red-500" />
                ) : (
                  <span className={row.feature === 'Preço' ? 'font-bold text-primary' : 
                    (row.basic !== row.plus ? 'text-primary font-medium' : 'text-gray-300')}>
                    {row.plus}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Item de FAQ individual
function FAQItem({ item, isOpen, toggleItem }) {
  return (
    <div className="border border-dark-200 rounded-lg overflow-hidden mb-4">
      <button
        className="w-full p-4 flex justify-between items-center text-left"
        onClick={toggleItem}
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold text-white">
          {item.question}
        </h3>
        <span className={`text-primary transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <div className="p-4 text-gray-400 border-t border-dark-200">
          {item.answer}
        </div>
      )}
    </div>
  );
}

// Seção de FAQ
function FAQSection({ items }) {
  const [openItemIndex, setOpenItemIndex] = useState(null);

  const handleToggle = useCallback((index) => {
    setOpenItemIndex(prev => prev === index ? null : index);
  }, []);

  return (
    <div className="bg-dark-300 rounded-lg p-6 border border-dark-200 mt-8">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <FaQuestionCircle className="text-primary mr-2" />
        Perguntas Frequentes
      </h2>

      <div>
        {items.map((item, index) => (
          <FAQItem 
            key={index} 
            item={item} 
            isOpen={openItemIndex === index} 
            toggleItem={() => handleToggle(index)} 
          />
        ))}
      </div>
    </div>
  );
}

// Componente do banner do servidor
function ServerBanner({ gameName }) {
  return (
    <div className="mb-12 bg-dark-300 rounded-lg p-6 border border-dark-200">
      <div className="flex flex-col md:flex-row items-center">
        <div className="mb-6 md:mb-0 md:mr-8">
          <FaServer className="text-5xl text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">Servidor Phanteon {gameName}</h3>
          <p className="text-gray-300 mb-3">
            O melhor servidor {gameName} com comunidade ativa, eventos diários e uma experiência de jogo única.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span className="flex items-center">
              <FaGamepad className="mr-1 text-primary" /> 60 Slots
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
  );
}

export default function PlanosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { game: initialGame } = router.query;
  
  const [activeGame, setActiveGame] = useState('rust');
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define o jogo ativo com base na query ou padrão
  useEffect(() => {
    if (initialGame && availableGames.some(g => g.id === initialGame)) {
      setActiveGame(initialGame);
    }
  }, [initialGame]);

  // Carrega os planos do jogo ativo
  useEffect(() => {
    setPlanos(gameSpecificPlans[activeGame] || []);
    setLoading(false);
  }, [activeGame]);

  // Atualiza a URL quando o jogo ativo muda
  useEffect(() => {
    if (typeof window !== 'undefined') {
      router.push(`/planos?game=${activeGame}`, undefined, { shallow: true });
    }
  }, [activeGame, router]);

  // Handler para seleção de plano
  const handleSelectPlan = useCallback((planId) => {
    if (!session) {
      router.push('/?login=true');
      return;
    }
    
    router.push(`/checkout/${planId}`);
  }, [session, router]);

  // Handler para troca de jogo
  const handleGameChange = useCallback((gameId) => {
    setActiveGame(gameId);
  }, []);

  // Descrição do jogo ativo
  const gameDescription = useMemo(() => {
    switch (activeGame) {
      case 'rust':
        return 'Obtenha vantagens exclusivas, kits especiais e comandos adicionais para melhorar sua experiência no servidor Rust.';
      default:
        return 'Obtenha vantagens exclusivas, kits especiais e comandos adicionais para melhorar sua experiência no servidor.';
    }
  }, [activeGame]);

  // Renderização do loading state
  if (loading) {
    return (
      <div className="container-custom mx-auto py-12 flex justify-center items-center">
        <div className="text-center">
          <LoadingSpinner color="primary" size="lg" text="Carregando planos..." />
        </div>
      </div>
    );
  }

  // Configuração das tabs de jogo
  const tabsConfig = availableGames.map(game => ({
    id: game.id,
    label: game.name,
    icon: game.icon
  }));

  return (
    <>
      <Head>
        <title>Planos VIP | Phanteon Games</title>
        <meta name="description" content="Escolha seu plano VIP para Rust e outros jogos na Phanteon Games." />
      </Head>

      <div className="container-custom mx-auto py-12 px-4">
        {/* Tabs de jogos */}
        <div className="mb-8">
          <TabSelector
            tabs={tabsConfig}
            activeTab={activeGame}
            onChange={handleGameChange}
            className="mb-12"
          />

          {/* Header específico para o jogo selecionado */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center">
              <SiRust className="text-3xl mr-3 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Planos VIP <span className="text-primary">{activeGame.charAt(0).toUpperCase() + activeGame.slice(1)}</span>
              </h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto mt-4">
              {gameDescription}
            </p>
          </div>
        </div>

        {/* Banner do servidor */}
        <ServerBanner gameName={activeGame.charAt(0).toUpperCase() + activeGame.slice(1)} />

        {/* Planos VIP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {planos.map((plan) => (
            <VipCard 
              key={plan.id} 
              plan={plan} 
              onSelectPlan={handleSelectPlan} 
            />
          ))}
        </div>

        {/* Comparativo de planos */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Comparativo de Planos
          </h2>
          <PlansComparison />
        </div>

        {/* FAQ Section */}
        <FAQSection items={faqItems[activeGame] || []} />
      </div>
    </>
  );
}