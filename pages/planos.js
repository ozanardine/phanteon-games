import React, { useEffect, useState, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Importações estáticas apenas para ícones essenciais, o resto será carregado dinamicamente
import { FaServer } from 'react-icons/fa';
import { SiRust } from 'react-icons/si';

// Importação de componentes base
const TabSelector = dynamic(() => import('../components/ui/TabSelector'), { ssr: true });
const Card = dynamic(() => import('../components/ui/Card'), { ssr: true });
const Button = dynamic(() => import('../components/ui/Button'), { ssr: true });
const LoadingSpinner = dynamic(() => import('../components/ui/LoadingSpinner'), { ssr: true });

// Dados estáticos - estes nunca mudam e são mantidos fora dos ciclos de renderização
const GAME_DATA = {
  rust: {
    id: 'rust',
    name: 'Rust',
    icon: <SiRust />,
    description: 'Obtenha vantagens exclusivas, kits especiais e comandos adicionais para melhorar sua experiência no servidor Rust.',
    plans: [
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
    faq: [
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
    ],
    comparison: [
      { feature: 'Furnace Splitter', basic: true, plus: true },
      { feature: 'QuickSmelt', basic: false, plus: true },
      { feature: 'Prioridade na fila', basic: 'Normal', plus: 'Máxima' },
      { feature: 'Acesso a eventos exclusivos', basic: 'Básicos', plus: 'Todos' },
      { feature: 'Sorteios mensais de skins', basic: false, plus: true },
      { feature: 'Kit ao iniciar', basic: 'Básico', plus: 'Avançado' },
      { feature: 'Salas exclusivas no Discord', basic: true, plus: true },
      { feature: 'Suporte prioritário', basic: false, plus: true },
      { feature: 'Preço', basic: 'R$ 19,90/mês', plus: 'R$ 29,90/mês' }
    ]
  }
};

// Lista de todos os jogos disponíveis
const GAMES = [
  { id: 'rust', name: 'Rust', icon: <SiRust /> }
];

// Componente VIP Card otimizado e memoizado
const VipCard = memo(({ plan, onSelectPlan }) => {
  if (!plan) return null;
  
  return (
    <div 
      className={`relative overflow-hidden rounded-xl ${
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
        <h3 className="text-2xl font-bold text-white mb-2">
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
          {plan.features.slice(0, 8).map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full ${plan.isPopular ? 'bg-primary' : 'bg-gray-600'} flex items-center justify-center mr-3 mt-0.5`}>
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="3" fill="none" className="text-white">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
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
        >
          Assinar Agora
        </Button>
      </div>
    </div>
  );
});

VipCard.displayName = 'VipCard';

// Componente de FAQ otimizado com carregamento sob demanda
const FAQItem = memo(({ item, isOpen, toggleItem }) => {
  return (
    <div className="border border-dark-200 rounded-lg overflow-hidden">
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
});

FAQItem.displayName = 'FAQItem';

// Seção de FAQ otimizada
const FAQSection = memo(({ items }) => {
  const [openItemIndex, setOpenItemIndex] = useState(null);

  const handleToggle = useCallback((index) => {
    setOpenItemIndex(prev => prev === index ? null : index);
  }, []);

  return (
    <div className="bg-dark-300 rounded-lg p-6 border border-dark-200 mt-8">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary mr-2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        Perguntas Frequentes
      </h2>

      <div className="space-y-4">
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
});

FAQSection.displayName = 'FAQSection';

// Componente de comparação de planos completamente otimizado
// Este componente usa uma renderização simplificada ao invés do grid complexo
const ComparisonTable = memo(({ data }) => {
  if (!data || !data.length) return null;
  
  return (
    <div className="mt-12 mb-12">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Comparativo de Planos
      </h2>
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
            {data.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-dark-300' : 'bg-dark-400/60'}>
                <td className="p-4 text-gray-300">{row.feature}</td>
                <td className="p-4 text-center">
                  {typeof row.basic === 'boolean' ? (
                    row.basic ? 
                      <span className="text-green-500">✓</span> : 
                      <span className="text-red-500">✗</span>
                  ) : (
                    <span className={row.feature === 'Preço' ? 'font-bold text-primary' : 'text-gray-300'}>
                      {row.basic}
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {typeof row.plus === 'boolean' ? (
                    row.plus ? 
                      <span className="text-green-500">✓</span> : 
                      <span className="text-red-500">✗</span>
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
    </div>
  );
});

ComparisonTable.displayName = 'ComparisonTable';

// Componente principal da página completamente reconstruído
export default function PlanosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { game: urlGame } = router.query;
  
  // Estado único minimalista
  const [activeGameId, setActiveGameId] = useState('rust');
  
  // Configurar o jogo ativo com base na URL, apenas uma vez na montagem
  useEffect(() => {
    if (urlGame && GAME_DATA[urlGame]) {
      setActiveGameId(urlGame);
    }
  }, [urlGame]);
  
  // Memoize o jogo ativo para evitar recálculos
  const activeGame = useMemo(() => GAME_DATA[activeGameId] || GAME_DATA.rust, [activeGameId]);

  // Manipulador de seleção de plano memoizado
  const handleSelectPlan = useCallback((planId) => {
    if (!session) {
      router.push('/?login=true');
      return;
    }
    
    router.push(`/checkout/${planId}`);
  }, [session, router]);

  // Manipulador de mudança de jogo memoizado
  const handleGameChange = useCallback((gameId) => {
    setActiveGameId(gameId);
    router.push(`/planos?game=${gameId}`, undefined, { shallow: true });
  }, [router]);

  // Se não tivermos dados do jogo, mostre carregamento
  if (!activeGame) {
    return (
      <div className="container-custom mx-auto py-12 flex justify-center items-center">
        <LoadingSpinner color="primary" size="lg" text="Carregando planos..." />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Planos VIP | Phanteon Games</title>
        <meta name="description" content={`Planos VIP para ${activeGame.name}. Obtenha vantagens exclusivas em nossos servidores.`} />
      </Head>

      <div className="container-custom mx-auto py-12 px-4">
        {/* Tabs simplificadas */}
        <div className="mb-8">
          <TabSelector
            tabs={GAMES.map(game => ({
              id: game.id,
              label: game.name,
              icon: game.icon
            }))}
            activeTab={activeGameId}
            onChange={handleGameChange}
            className="mb-12"
          />

          {/* Header do jogo */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center">
              {activeGame.icon && <span className="text-3xl mr-3 text-primary">{activeGame.icon}</span>}
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Planos VIP <span className="text-primary">{activeGame.name}</span>
              </h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto mt-4">
              {activeGame.description}
            </p>
          </div>
        </div>

        {/* Banner do servidor simplificado */}
        <div className="mb-12 bg-dark-300 rounded-lg p-6 border border-dark-200">
          <div className="flex flex-col md:flex-row items-center">
            <div className="mb-6 md:mb-0 md:mr-8">
              <FaServer className="text-5xl text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Servidor Phanteon {activeGame.name}</h3>
              <p className="text-gray-300 mb-3">
                O melhor servidor {activeGame.name} com comunidade ativa, eventos diários e uma experiência de jogo única.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary">
                    <path d="M17 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"></path>
                    <path d="m5 13 4 4 10-10"></path>
                  </svg>
                  60 Slots
                </span>
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary">
                    <path d="m5 9 14 12"></path>
                    <path d="M5 9V1h14v8"></path>
                    <path d="m5 9 4 2"></path>
                    <path d="m19 9-4 2"></path>
                  </svg>
                  Wipe Mensal
                </span>
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                    <line x1="6" y1="6" x2="6.01" y2="6"></line>
                    <line x1="6" y1="18" x2="6.01" y2="18"></line>
                  </svg>
                  82.29.62.21:28015
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de planos otimizados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {activeGame.plans.map((plan) => (
            <VipCard 
              key={plan.id} 
              plan={plan} 
              onSelectPlan={handleSelectPlan} 
            />
          ))}
        </div>

        {/* Tabela de comparação de planos simplificada */}
        <ComparisonTable data={activeGame.comparison} />

        {/* FAQ Section simplificada */}
        <FAQSection items={activeGame.faq} />
      </div>
    </>
  );
}