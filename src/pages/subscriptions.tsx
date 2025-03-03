// src/pages/subscriptions.tsx
import React, { useState, useEffect } from 'react';
import { FaCrown, FaHistory, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { FiArrowRight } from 'react-icons/fi';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cancelSubscription } from '@/lib/mercadopago';
import Link from 'next/link';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  // Carregar assinaturas e pagamentos do usuário
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Carregar assinaturas
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (subscriptionsError) {
        throw subscriptionsError;
      }

      setSubscriptions(subscriptionsData || []);

      // Carregar pagamentos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        throw paymentsError;
      }

      setPayments(paymentsData || []);
    } catch (error: any) {
      console.error('Error loading user data:', error);
      setError('Erro ao carregar dados do usuário. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: number) => {
    if (!confirm('Tem certeza que deseja cancelar esta assinatura? Você perderá todos os benefícios VIP.')) {
      return;
    }

    setCancelingId(subscriptionId);
    try {
      const { success, error } = await cancelSubscription(subscriptionId);

      if (error) {
        throw error;
      }

      if (success) {
        setSuccess('Assinatura cancelada com sucesso!');
        // Atualizar a lista de assinaturas
        loadUserData();
      }
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      setError('Erro ao cancelar assinatura. Tente novamente mais tarde.');
    } finally {
      setCancelingId(null);
    }
  };

  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Formatar valor
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Obter status da assinatura com ícone e cor
  const getSubscriptionStatus = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Ativa',
          icon: <FaCheckCircle className="text-green-500" />,
          color: 'text-green-500'
        };
      case 'canceled':
        return {
          label: 'Cancelada',
          icon: <FaTimesCircle className="text-red-500" />,
          color: 'text-red-500'
        };
      case 'pending':
        return {
          label: 'Pendente',
          icon: <FaClock className="text-yellow-500" />,
          color: 'text-yellow-500'
        };
      case 'expired':
        return {
          label: 'Expirada',
          icon: <FaExclamationTriangle className="text-gray-500" />,
          color: 'text-gray-500'
        };
      default:
        return {
          label: status,
          icon: <FaExclamationTriangle className="text-gray-500" />,
          color: 'text-gray-500'
        };
    }
  };

  // Obter status do pagamento com ícone e cor
  const getPaymentStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Concluído',
          icon: <FaCheckCircle className="text-green-500" />,
          color: 'text-green-500',
          bgColor: 'bg-green-900/20'
        };
      case 'failed':
        return {
          label: 'Falhou',
          icon: <FaTimesCircle className="text-red-500" />,
          color: 'text-red-500',
          bgColor: 'bg-red-900/20'
        };
      case 'pending':
        return {
          label: 'Pendente',
          icon: <FaClock className="text-yellow-500" />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-900/20'
        };
      case 'refunded':
        return {
          label: 'Reembolsado',
          icon: <FaHistory className="text-blue-500" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-900/20'
        };
      default:
        return {
          label: status,
          icon: <FaExclamationTriangle className="text-gray-500" />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-900/20'
        };
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout
        title="Minhas Assinaturas"
        description="Gerencie suas assinaturas e visualize seu histórico de pagamentos."
      >
        <div className="bg-phanteon-dark min-h-screen py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-10">
              <span className="text-phanteon-orange">Minhas</span> Assinaturas
            </h1>

            {error && (
              <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" className="mb-6" onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Assinaturas */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Assinaturas</h2>
                  <Link href="/vip" legacyBehavior>
                    <a>
                      <Button variant="outline" size="sm">
                        Ver Planos
                      </Button>
                    </a>
                  </Link>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-phanteon-orange"></div>
                  </div>
                ) : subscriptions.length === 0 ? (
                  <Card>
                    <div className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-phanteon-light/20 flex items-center justify-center mx-auto mb-4">
                        <FaCrown className="text-phanteon-orange text-3xl" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Nenhuma assinatura encontrada</h3>
                      <p className="text-gray-300 mb-6">
                        Você ainda não possui nenhuma assinatura ativa ou histórico de assinaturas.
                      </p>
                      <Link href="/vip" legacyBehavior>
                        <a>
                          <Button variant="primary">
                            Ver Planos VIP <FiArrowRight className="ml-2" />
                          </Button>
                        </a>
                      </Link>
                    </div>
                  </Card>
                ) : (
                  subscriptions.map((subscription) => {
                    const status = getSubscriptionStatus(subscription.status);
                    return (
                      <Card key={subscription.id} className={
                        subscription.status === 'active' 
                          ? 'border-phanteon-orange/30' 
                          : ''
                      }>
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                            <div className="flex items-center mb-4 md:mb-0">
                              <div className={`w-10 h-10 rounded-full ${
                                subscription.status === 'active' 
                                  ? 'bg-phanteon-orange/20' 
                                  : 'bg-phanteon-light/20'
                              } flex items-center justify-center mr-4`}>
                                <FaCrown className={
                                  subscription.status === 'active' 
                                    ? 'text-phanteon-orange' 
                                    : 'text-gray-400'
                                } />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold">
                                  {subscription.plan?.name || 'Plano VIP'}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                  ID: {subscription.id}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className={`flex items-center ${status.color} mr-4`}>
                                {status.icon}
                                <span className="ml-2">{status.label}</span>
                              </div>
                              <Badge variant={
                                subscription.status === 'active' 
                                  ? 'primary' 
                                  : 'secondary'
                              }>
                                {formatCurrency(subscription.plan?.price || 0)}/mês
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-phanteon-light/10 p-3 rounded-lg">
                              <p className="text-gray-400 text-sm mb-1">Data de início</p>
                              <p className="font-medium">
                                {formatDate(subscription.start_date)}
                              </p>
                            </div>
                            <div className="bg-phanteon-light/10 p-3 rounded-lg">
                              <p className="text-gray-400 text-sm mb-1">Validade</p>
                              <p className="font-medium">
                                {formatDate(subscription.end_date)}
                              </p>
                            </div>
                            <div className="bg-phanteon-light/10 p-3 rounded-lg">
                              <p className="text-gray-400 text-sm mb-1">Renovação automática</p>
                              <p className="font-medium">
                                {subscription.auto_renew ? 'Ativada' : 'Desativada'}
                              </p>
                            </div>
                          </div>

                          {subscription.status === 'active' && (
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                className="text-red-400 hover:text-red-300"
                                onClick={() => handleCancelSubscription(subscription.id)}
                                isLoading={cancelingId === subscription.id}
                              >
                                Cancelar Assinatura
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Pagamentos Recentes */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Pagamentos Recentes</h2>

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-phanteon-orange"></div>
                  </div>
                ) : payments.length === 0 ? (
                  <Card>
                    <div className="p-6 text-center">
                      <p className="text-gray-300">
                        Você ainda não possui histórico de pagamentos.
                      </p>
                    </div>
                  </Card>
                ) : (
                  <Card>
                    <div className="p-4">
                      <div className="space-y-3">
                        {payments.slice(0, 5).map((payment) => {
                          const status = getPaymentStatus(payment.status);
                          return (
                            <div 
                              key={payment.id}
                              className="p-3 border-b border-phanteon-light last:border-0"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center mb-1">
                                    <div className={`w-6 h-6 rounded-full ${status.bgColor} flex items-center justify-center mr-2`}>
                                      {status.icon}
                                    </div>
                                    <span className="font-medium">
                                      {formatCurrency(payment.amount)}
                                    </span>
                                  </div>
                                  <p className="text-gray-400 text-sm">
                                    {new Date(payment.created_at).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <div className={`text-sm ${status.color}`}>
                                  {status.label}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {payments.length > 5 && (
                        <div className="mt-4 text-center">
                          <Button variant="outline" size="sm">
                            Ver Todos
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Informações de Pagamento */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Informações de Pagamento</h3>
                    <p className="text-gray-300 mb-4">
                      Todos os pagamentos são processados de forma segura através do Mercado Pago.
                    </p>
                    <p className="text-sm text-gray-400">
                      Para qualquer dúvida sobre cobranças ou reembolsos, entre em contato com nosso suporte.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}