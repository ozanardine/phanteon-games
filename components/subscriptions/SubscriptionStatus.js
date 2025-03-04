import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { FaCheckCircle, FaTimesCircle, FaClock, FaExclamationCircle } from 'react-icons/fa';
import { useRouter } from 'next/router';

const formatDate = (dateString) => {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
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

  const { status, plan_name, expires_at, created_at } = subscription;
  const statusIcon = getStatusIcon(status);
  const statusText = getStatusText(status, expires_at);
  const statusClass = getStatusClass(status);

  return (
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
  );
};

export default SubscriptionStatus;