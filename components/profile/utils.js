// components/profile/utils.js

/**
 * Formata uma data para o formato brasileiro
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

/**
 * Valida o formato do SteamID: deve ter 17 dígitos
 */
export const validateSteamId = (steamId) => {
  return steamId && steamId.match(/^[0-9]{17}$/);
};

/**
 * Calcula o tempo até a expiração da assinatura
 */
export const calculateTimeUntilExpiration = (expirationDate) => {
  if (!expirationDate) return null;
  
  try {
    const now = new Date();
    const expDate = new Date(expirationDate);
    const diff = expDate - now;
    
    if (diff <= 0) return { expired: true, text: 'Expirado' };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return { 
        expired: false, 
        text: `${days} dia${days > 1 ? 's' : ''} ${hours} hora${hours > 1 ? 's' : ''}`,
        days,
        hours
      };
    } else {
      return { 
        expired: false, 
        text: `${hours} hora${hours > 1 ? 's' : ''} restante${hours > 1 ? 's' : ''}`,
        days: 0,
        hours
      };
    }
  } catch (error) {
    console.error('Erro ao calcular tempo restante:', error);
    return { expired: false, text: 'Indeterminado' };
  }
};

/**
 * Gera a lista de benefícios com base no ID do plano
 */
export const generateBenefitsList = (planId) => {
  // VIP Básico
  const basicBenefits = [
    'Acesso ao plugin Furnace Splitter',
    'Prioridade na fila do servidor',
    'Acesso a eventos exclusivos para vip (em breve)',
    'Badge exclusiva no Discord',
    'Cargo exclusivo no Discord',
    'Kit básico a cada wipe',
    'Coleta 1.5x de dia e 1.8x de noite'
  ];
  
  // VIP Plus (lista independente, sem repetição direta do Basic)
  const plusBenefits = [
    'Acesso ao plugin Furnace Splitter',
    'Acesso ao plugin QuickSmelt',
    'Prioridade máxima na fila do servidor',
    'Acesso a eventos exclusivos para vip (em breve)',
    'Sorteios mensais de skins do jogo (em breve)',
    'Badge exclusiva no Discord',
    'Cargo exclusivo no Discord',
    'Acesso a salas exclusivas no Discord',
    'Suporte prioritário',
    'Kit avançado a cada wipe',
    'Coleta 1.8x de dia e 2.1x de noite'
  ];
  
  // Mapeamento de UUIDs para identificadores de planos
  const planIdToType = {
    '0b81cf06-ed81-49ce-8680-8f9d9edc932e': 'basic', // VIP Basic
    '3994ff53-f110-4c8f-a492-ad988528006f': 'plus',  // VIP Plus
    'vip-basic': 'basic',
    'vip-plus': 'plus'
  };
  
  const planType = planIdToType[planId] || 'basic';
  
  return planType === 'plus' ? plusBenefits : basicBenefits;
};

/**
 * Gera a lista de itens resgatáveis com base no ID do plano
 */
export const generateItemsList = (planId) => {
  // VIP Básico
  const basicItems = [
    { shortName: 'hatchet', amount: 1, name: 'Machado' },
    { shortName: 'pickaxe', amount: 1, name: 'Picareta' },
    { shortName: 'wood', amount: 5000, name: 'Madeira' },
    { shortName: 'stones', amount: 5000, name: 'Pedras' },
    { shortName: 'smallbackpack', amount: 1, name: 'Mochila Pequena' },
    { shortName: 'lowgradefuel', amount: 100, name: 'Combustível' },
    { shortName: 'furnace', amount: 1, name: 'Fornalha' },
    { shortName: 'bearmeat.cooked', amount: 10, name: 'Carne de Urso Cozida' },
    { shortName: 'woodtea.advanced', amount: 5, name: 'Chá de Madeira Avançado' },
    { shortName: 'oretea.advanced', amount: 5, name: 'Chá de Minério Avançado' },
    { shortName: 'scraptea.advanced', amount: 3, name: 'Chá de Sucata Avançado' }
  ];
  
  // VIP Plus (inclui itens diferentes e melhores)
  const plusItems = [
    { shortName: 'largebackpack', amount: 1, name: 'Mochila Grande' },
    { shortName: 'lowgradefuel', amount: 200, name: 'Combustível' },
    { shortName: 'jackhammer', amount: 1, name: 'Britadeira' },
    { shortName: 'wood', amount: 15000, name: 'Madeira' },
    { shortName: 'stones', amount: 15000, name: 'Pedras' },
    { shortName: 'metal.fragments', amount: 1000, name: 'Fragmentos de Metal' },
    { shortName: 'lock.code', amount: 2, name: 'Cadeado com Código' },
    { shortName: 'syringe.medical', amount: 2, name: 'Seringa Médica' },
    { shortName: 'woodtea.advanced', amount: 10, name: 'Chá de Madeira Avançado' },
    { shortName: 'oretea.advanced', amount: 10, name: 'Chá de Minério Avançado' },
    { shortName: 'scraptea.advanced', amount: 6, name: 'Chá de Sucata Avançado' },
    { shortName: 'pumpkin', amount: 15, name: 'Abóbora' }
  ];
  
  // Mapeamento de UUIDs para identificadores de planos
  const planIdToType = {
    '0b81cf06-ed81-49ce-8680-8f9d9edc932e': 'basic', // VIP Basic
    '3994ff53-f110-4c8f-a492-ad988528006f': 'plus',  // VIP Plus
    'vip-basic': 'basic',
    'vip-plus': 'plus'
  };
  
  const planType = planIdToType[planId] || 'basic';
  
  return planType === 'plus' ? plusItems : basicItems;
};

// Componentes de ícones SVG
export const FaCheck = ({ className }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
    </svg>
  );
};

export const FaInbox = ({ className }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd"></path>
    </svg>
  );
};

export const FaLink = ({ className }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"></path>
    </svg>
  );
};

export const FaClipboard = ({ className }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
    </svg>
  );
};