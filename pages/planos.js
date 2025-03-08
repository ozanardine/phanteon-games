import React from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import { FaCheck, FaGamepad, FaInfoCircle, FaServer, FaTimes } from 'react-icons/fa';
import { TabSelector } from '../components/ui/TabSelector';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// ==========================================
// DADOS ESTÁTICOS - Separados da lógica de componentes
// ==========================================

const GAMES = [
  { 
    id: 'rust', 
    name: 'Rust', 
    icon: <div className="w-4 h-4 flex items-center justify-center">
            <Image src="/images/logos/rust.svg" alt="Rust" width={16} height={16} />
          </div>
  },
];

// Constantes para IDs de planos
const PLAN_IDS = {
  BASIC: '0b81cf06-ed81-49ce-8680-8f9d9edc932e',
  PLUS: '3994ff53-f110-4c8f-a492-ad988528006f',
};

// Dados de planos por jogo
const GAME_PLANS = {
  rust: [
    {
      id: 'vip-basic',
      databaseId: PLAN_IDS.BASIC,
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
      badgeIcon: '/badges/badge_basic.svg', // Atualizado para o novo caminho
    },
    {
      id: 'vip-plus',
      databaseId: PLAN_IDS.PLUS,
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
      badgeIcon: '/badges/badge_plus.svg', // Atualizado para o novo caminho
    },
  ],
};

// Descrições de jogos
const GAME_DESCRIPTIONS = {
  rust: 'Obtenha vantagens exclusivas, kits especiais e comandos adicionais para melhorar sua experiência no servidor Rust.'
};

// Perguntas frequentes por jogo
const GAME_FAQS = {
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

// Dados de comparação de planos - estáticos para evitar cálculos repetidos
const COMPARISON_DATA = {
  rust: [
    { feature: 'Furnace Splitter', basic: true, plus: true },
    { feature: 'QuickSmelt', basic: false, plus: true },
    { feature: 'Prioridade na fila', basic: 'Normal', plus: 'Máxima' },
    { feature: 'Acesso a eventos exclusivos', basic: 'Básicos', plus: 'Todos' },
    { feature: 'Sorteios mensais de skins', basic: false, plus: true },
    { feature: 'Kit ao iniciar', basic: 'Básico', plus: 'Avançado' },
    { feature: 'Salas exclusivas no Discord', basic: true, plus: true },
    { feature: 'Suporte prioritário', basic: false, plus: true },
  ]
};

// ==========================================
// COMPONENTES INDIVIDUAIS - Com renderização otimizada
// ==========================================

// Cartão de Plano VIP - Componente otimizado
function PlanCard({ plan, onSelect }) {
  if (!plan) return null;
  
  return (
    <div 
      className={`relative overflow-hidden rounded-xl transition-all duration-300 h-full flex flex-col ${
        plan.isPopular 
          ? 'shadow-lg border-2 border-primary' 
          : 'shadow border border-dark-200'
      }`}
    >
      {/* Badge "Popular" */}
      {plan.isPopular && (
        <div className="absolute -right-12 top-5 bg-primary text-white py-1 px-10 transform rotate-45 text-sm font-bold">
          Popular
        </div>
      )}
      
      {/* Cabeçalho */}
      <div className={`p-6 ${plan.isPopular ? 'bg-gradient-to-br from-primary/10 to-dark-300' : 'bg-dark-300'}`}>
        <h3 className="text-2xl font-bold text-white mb-2">
          {plan.name}
        </h3>
        <div className="flex items-baseline mb-4">
          <span className="text-3xl font-extrabold text-white">R${plan.price}</span>
          <span className="text-gray-400 ml-1">/mês</span>
        </div>
        <p className="text-gray-400">{plan.description}</p>
      </div>
      
      {/* Conteúdo */}
      <div className="bg-dark-400 p-6 flex-grow flex flex-col">
        <ul className="space-y-3 mb-6 flex-grow">
          {plan.features.map((feature, idx) => (
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
          onClick={() => onSelect(plan.id)}
          className="mt-auto"
        >
          Assinar Agora
        </Button>
      </div>
    </div>
  );
}

// Componente de comparação de planos - usando tabela HTML semântica e otimizada
function PlanComparisonTable({ data }) {
  if (!data || !data.length) {
    return null;
  }
  
  return (
    <div className="rounded-lg overflow-hidden border border-dark-300 bg-dark-400">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left p-4 font-medium text-gray-300 border-b border-dark-300">Recursos</th>
              <th className="text-center p-4 font-medium text-white border-b border-dark-300">VIP Basic</th>
              <th className="text-center p-4 font-medium text-white border-b border-dark-300">VIP Plus</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-dark-300' : 'bg-dark-400'}>
                <td className="p-4 text-gray-300 border-b border-dark-500">{row.feature}</td>
                <td className="p-4 text-center border-b border-dark-500">
                  {typeof row.basic === 'boolean' ? (
                    row.basic ? 
                      <FaCheck className="inline text-green-500" /> : 
                      <FaTimes className="inline text-red-500" />
                  ) : (
                    <span className="text-gray-300">{row.basic}</span>
                  )}
                </td>
                <td className="p-4 text-center border-b border-dark-500">
                  {typeof row.plus === 'boolean' ? (
                    row.plus ? 
                      <FaCheck className="inline text-green-500" /> : 
                      <FaTimes className="inline text-red-500" />
                  ) : (
                    <span className={row.basic !== row.plus ? 'text-primary font-medium' : 'text-gray-300'}>
                      {row.plus}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-dark-300">
              <td className="p-4 text-white font-bold">Preço</td>
              <td className="p-4 text-center font-bold text-primary">R$ 19,90/mês</td>
              <td className="p-4 text-center font-bold text-primary">R$ 29,90/mês</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente item de FAQ - simples e direto
function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border border-dark-300 rounded-lg overflow-hidden mb-3">
      <button
        className="w-full p-4 flex justify-between items-center text-left focus:outline-none focus:ring-1 focus:ring-primary"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold text-white">
          {question}
        </h3>
        <span className={`text-primary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 text-gray-400 border-t border-dark-300">
          {answer}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL - Página de Planos
// ==========================================

export default function PlanosPage() {
  // Hooks do Next.js
  const router = useRouter();
  const { data: session } = useSession();
  
  // Extrai o jogo da URL ou usa o padrão
  const activeGameId = router.query.game || 'rust';
  
  // Estado mínimo utilizando Hook API do React - menos reativa e mais leve
  const [openFaqIndex, setOpenFaqIndex] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Acessa os dados estáticos com segurança
  const game = GAMES.find(g => g.id === activeGameId) || GAMES[0];
  const plans = GAME_PLANS[game.id] || [];
  const description = GAME_DESCRIPTIONS[game.id] || '';
  const faqs = GAME_FAQS[game.id] || [];
  const comparisonData = COMPARISON_DATA[game.id] || [];
  
  // Manipuladores de eventos otimizados
  const handleTabChange = React.useCallback((gameId) => {
    setIsLoading(true);
    router.push(`/planos?game=${gameId}`, undefined, { shallow: true })
      .then(() => setIsLoading(false));
  }, [router]);
  
  const handleSelectPlan = React.useCallback((planId) => {
    if (!session) {
      router.push('/?login=true');
      return;
    }
    router.push(`/checkout/${planId}`);
  }, [session, router]);
  
  const toggleFaq = React.useCallback((index) => {
    setOpenFaqIndex(prev => prev === index ? null : index);
  }, []);
  
  // Montar tabs para seleção de jogos
  const tabs = React.useMemo(() => {
    return GAMES.map(g => ({
      id: g.id,
      label: g.name,
      icon: g.icon
    }));
  }, []);
  
  // Estados de Loading
  if (isLoading) {
    return (
      <div className="container-custom mx-auto py-16 flex justify-center items-center">
        <LoadingSpinner size="lg" text="Carregando planos..." />
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Planos VIP | Phanteon Games</title>
        <meta name="description" content={`Planos VIP para ${game.name} - Obtenha vantagens exclusivas no servidor Phanteon Games.`} />
      </Head>
      
      <div className="container-custom mx-auto py-12">
        {/* Seleção de jogo simplificada */}
        <div className="mb-12">
          <TabSelector
            tabs={tabs}
            activeTab={game.id}
            onChange={handleTabChange}
          />
          
          {/* Título e descrição do jogo */}
          <div className="text-center mt-10">
            <div className="flex items-center justify-center">
              <span className="text-3xl mr-3 text-primary">{game.icon}</span>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Planos VIP <span className="text-primary">{game.name}</span>
              </h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto mt-4">
              {description}
            </p>
          </div>
        </div>
        
        {/* Banner de servidor com gradiente sutil */}
        <div className="mb-12 bg-gradient-to-br from-dark-400 to-dark-300 rounded-lg p-6 border border-dark-200">
          <div className="flex flex-col md:flex-row items-center">
            <div className="mb-6 md:mb-0 md:mr-8">
              <FaServer className="text-5xl text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">Servidor Phanteon {game.name}</h2>
              <p className="text-gray-300 mb-3">
                O melhor servidor {game.name} com comunidade ativa, eventos diários e uma experiência de jogo única.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <FaGamepad className="mr-1 text-primary" /> 60 Slots
                </span>
                <span className="flex items-center">
                  <FaInfoCircle className="mr-1 text-primary" /> Wipe Mensal
                </span>
                <span className="flex items-center">
                  <FaServer className="mr-1 text-primary" /> 82.29.62.21:28015
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Cartões de plano com layout responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {plans.map((plan) => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              onSelect={handleSelectPlan} 
            />
          ))}
        </div>
        
        {/* Explicação de benefícios principais */}
        <div className="mb-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-8">
            O que você ganha ao assinar VIP
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Benefício 1 */}
            <div className="bg-dark-300 p-6 rounded-lg text-center hover:bg-dark-200 transition-colors duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                <FaServer className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Vantagens no Servidor</h3>
              <p className="text-gray-400">Acesso a kits exclusivos e comandos especiais para melhorar sua jogabilidade.</p>
            </div>
            
            {/* Benefício 2 */}
            <div className="bg-dark-300 p-6 rounded-lg text-center hover:bg-dark-200 transition-colors duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                <FaGamepad className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Prioridade na Fila</h3>
              <p className="text-gray-400">Entre no servidor mais rápido, mesmo quando estiver lotado. Nunca perca a ação!</p>
            </div>
            
            {/* Benefício 3 */}
            <div className="bg-dark-300 p-6 rounded-lg text-center hover:bg-dark-200 transition-colors duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                  className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Suporte Prioritário</h3>
              <p className="text-gray-400">Tenha suas dúvidas e problemas resolvidos com prioridade pela nossa equipe.</p>
            </div>
            
            {/* Benefício 4 */}
            <div className="bg-dark-300 p-6 rounded-lg text-center hover:bg-dark-200 transition-colors duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                  className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Eventos Exclusivos</h3>
              <p className="text-gray-400">Participe de eventos especiais apenas para membros VIP com prêmios incríveis.</p>
            </div>
          </div>
        </div>
        
        {/* Tabela comparativa de planos */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Comparativo Detalhado de Planos
          </h2>
          <PlanComparisonTable data={comparisonData} />
        </div>
        
        {/* Seção de FAQs */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
              className="text-primary mr-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Perguntas Frequentes
          </h2>
          
          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaqIndex === index}
                onToggle={() => toggleFaq(index)}
              />
            ))}
          </div>
        </div>
        
        {/* CTA final */}
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/20 to-dark-300 p-8 rounded-xl border border-primary/30">
          <h2 className="text-2xl font-bold text-white mb-4">
            Pronto para elevar sua experiência?
          </h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            Junte-se aos jogadores que já aproveitam todas as vantagens VIP. Assine agora e comece a aproveitar imediatamente todos os benefícios.
          </p>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => handleSelectPlan(plans[0]?.id)} 
            className="px-8 py-3"
          >
            Assinar VIP Agora
          </Button>
        </div>
      </div>
    </>
  );
}