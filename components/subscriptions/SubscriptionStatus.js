import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { FaCheckCircle, FaTimesCircle, FaClock, FaExclamationCircle, FaGift } from 'react-icons/fa';
import RustItemIcon from '../ui/RustItemIcon';
import { useRouter } from 'next/router';

const formatDate = (dateString) => {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' };
  return new Date(dateString).toLocaleDateString('pt-BR', options);
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'active':
      return <FaCheckCircle className="h-6 w-6 text-green-500" />;
    case 'expired':
      return <FaTimesCircle className="h-6 w-6 text-red-500" />;
    case 'pending':
      return <FaClock className="h-6 w-6 text-yellow-500" />;
    default:
      return <FaExclamationCircle className="h-6 w-6 text-gray-500" />;
  }
};

const getStatusText = (status, expiresAt) => {
  switch (status) {
    case 'active':
      return `Ativo até ${formatDate(expiresAt)}`;
    case 'expired':
      return `Expirou em ${formatDate(expiresAt)}`;
    case 'pending':
      return 'Pagamento em processamento';
    default:
      return 'Status desconhecido';
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'active':
      return 'bg-green-900/20 border-green-700 text-green-500';
    case 'expired':
      return 'bg-red-900/20 border-red-700 text-red-500';
    case 'pending':
      return 'bg-yellow-900/20 border-yellow-700 text-yellow-500';
    default:
      return 'bg-gray-800 border-gray-700 text-gray-500';
  }
};

const vipItems = {
  'vip-basic': [
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
  ],
  'vip-plus': [
    { shortName: 'largebackpack', amount: 1, name: 'Mochila Grande' },
    { shortName: 'lowgradefuel', amount: 200, name: 'Combustível' },
    { shortName: 'jackhammer', amount: 1, name: 'Britadeira' },
    { shortName: 'wood', amount: 15000, name: 'Madeira' },
    { shortName: 'stones', amount: 15000, name: 'Pedras' },
    { shortName: 'metal_fragments', amount: 1000, name: 'Fragmentos de Metal' },
    { shortName: 'lock.code', amount: 2, name: 'Cadeado com Código' },
    { shortName: 'syringe.medical', amount: 2, name: 'Seringa Médica' },
    { shortName: 'woodtea.advanced', amount: 10, name: 'Chá de Madeira Avançado' },
    { shortName: 'oretea.advanced', amount: 10, name: 'Chá de Minério Avançado' },
    { shortName: 'scraptea.advanced', amount: 6, name: 'Chá de Sucata Avançado' },
    { shortName: 'pumpkin', amount: 15, name: 'Abóbora' }
  ]
};

const vipBenefits = {
  'vip-basic': [
    'Acesso ao plugin Furnace Splitter',
    'Prioridade na fila do servidor',
    'Acesso a eventos exclusivos para VIP Basic',
    'Badge exclusiva no Discord',
    'Cargo exclusivo no Discord'
  ],
  'vip-plus': [
    'Acesso ao plugin Furnace Splitter',
    'Acesso ao plugin QuickSmelt',
    'Prioridade máxima na fila do servidor',
    'Acesso a eventos exclusivos para VIP Plus',
    'Sorteios mensais de skins do jogo',
    'Badge exclusiva no Discord',
    'Cargo exclusivo no Discord',
    'Acesso a salas exclusivas no Discord',
    'Suporte prioritário'
  ]
};

const SubscriptionStatus = ({
  subscription,
  onRenew,
  loading = false,
}) => {
  const router = useRouter();
  
  // Se não tiver assinatura
  if (!subscription) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Status da Assinatura</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-col items-center py-4">
            <FaTimesCircle className="h-12 w-12 text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-white">Sem assinatura ativa</h3>
            <p className="text-gray-400 mt-2 text-center">
              Você ainda não possui nenhum plano VIP ativo.
            </p>
          </div>
        </Card.Body>
        <Card.Footer className="flex justify-center">
          <Button
            variant="primary"
            onClick={() => router.push('/planos')}
          >
            Ver Planos VIP
          </Button>
        </Card.Footer>
      </Card>
    );
  }

  const { 
    status, 
    plan_name, 
    expires_at, 
    created_at, 
    payment_id, 
    price, 
    amount,
    plan_id
  } = subscription;
  
  const statusIcon = getStatusIcon(status);
  const statusText = getStatusText(status, expires_at);
  const statusClass = getStatusClass(status);
  const displayPrice = price || amount;
  // Map database UUID to VIP tier
  const planIdMapping = {
    '0b81cf06-ed81-49ce-8680-8f9d9edc932e': 'vip-basic',
    '3994ff53-f110-4c8f-a492-ad988528006f': 'vip-plus'
  };
  const vipTier = planIdMapping[plan_id] || 'vip-basic';
  const items = vipItems[vipTier] || [];
  const benefits = vipBenefits[vipTier] || [];

  return (
    <div className="space-y-8">
      <Card>
        <Card.Header>
          <Card.Title>Status da Assinatura</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className={`flex items-center p-4 rounded-lg border ${statusClass}`}>
            {statusIcon}
            <div className="ml-3">
              <h3 className="text-lg font-medium text-white">{plan_name}</h3>
              <p className="text-sm">{statusText}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Data de Ativação:</span>
              <span className="text-white">{formatDate(created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Data de Expiração:</span>
              <span className="text-white">{formatDate(expires_at)}</span>
            </div>
            {payment_id && (
              <div className="flex justify-between">
                <span className="text-gray-400">ID do Pagamento:</span>
                <span className="text-white font-mono text-sm">{payment_id}</span>
              </div>
            )}
            {displayPrice && (
              <div className="flex justify-between">
                <span className="text-gray-400">Valor:</span>
                <span className="text-white">R$ {parseFloat(displayPrice).toFixed(2)}</span>
              </div>
            )}
          </div>
        </Card.Body>
        
        {status === 'expired' && (
          <Card.Footer className="flex justify-center">
            <Button
              variant="primary"
              onClick={onRenew}
              loading={loading}
            >
              Renovar Assinatura
            </Button>
          </Card.Footer>
        )}
      </Card>

      {status === 'active' && (
        <>
          {/* Card de Itens do Kit */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <FaGift className="text-primary" />
                Itens do seu Kit VIP
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center p-3 bg-dark-400/30 rounded-lg">
                    <RustItemIcon shortName={item.shortName} size={36} className="mr-3" />
                    <div className="flex-1">
                      <div className="text-white font-medium">{item.name}</div>
                      <div className="text-gray-400 text-sm">Quantidade: {item.amount}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Card de Benefícios */}
          <Card>
            <Card.Header>
              <Card.Title>Seus Benefícios VIP</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <FaCheckCircle className="text-primary flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default SubscriptionStatus;