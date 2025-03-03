import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { checkPaymentStatus } from '@/lib/mercadopago';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { subscription_id, payment_id, collection_id, collection_status } = router.query;
  
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!payment_id && !collection_id) {
        return;
      }

      try {
        const paymentIdToCheck = payment_id || collection_id;
        const { status, error } = await checkPaymentStatus(paymentIdToCheck as string);
        
        if (error) {
          throw error;
        }
        
        setPaymentStatus(status);
      } catch (error: any) {
        console.error('Error verifying payment:', error);
        setError(error.message || 'Erro ao verificar status do pagamento.');
      } finally {
        setIsLoading(false);
      }
    };

    if (router.isReady) {
      verifyPayment();
    }
  }, [router.isReady, payment_id, collection_id]);

  // Redirecionar automaticamente após alguns segundos
  useEffect(() => {
    if (paymentStatus === 'completed') {
      const timer = setTimeout(() => {
        router.push('/vip?success=true');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, router]);

  return (
    <ProtectedRoute>
      <MainLayout
        title="Pagamento Concluído"
        description="Seu pagamento foi processado com sucesso."
      >
        <div className="bg-phanteon-dark min-h-screen flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <Card className="border-green-600/30">
              <div className="p-6 text-center">
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin text-5xl text-phanteon-orange mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-4">Verificando pagamento...</h1>
                    <p className="text-gray-300 mb-6">
                      Estamos confirmando os detalhes do seu pagamento. Por favor, aguarde.
                    </p>
                  </>
                ) : error ? (
                  <>
                    <Alert variant="error" className="mb-6">
                      {error}
                    </Alert>
                    <p className="text-gray-300 mb-6">
                      Ocorreu um erro ao verificar seu pagamento. Entre em contato com o suporte se o problema persistir.
                    </p>
                    <div className="flex flex-col space-y-4">
                      <Link href="/vip" legacyBehavior>
                        <a>
                          <Button variant="primary" fullWidth>
                            Voltar para Planos VIP
                          </Button>
                        </a>
                      </Link>
                    </div>
                  </>
                ) : paymentStatus === 'completed' ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                      <FaCheckCircle className="text-green-500 text-4xl" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Pagamento Aprovado!</h1>
                    <p className="text-gray-300 mb-6">
                      Seu pagamento foi processado com sucesso e sua assinatura VIP foi ativada.
                    </p>
                    <p className="text-gray-400 text-sm mb-6">
                      Redirecionando automaticamente em alguns segundos...
                    </p>
                    <div className="flex flex-col space-y-4">
                      <Link href="/vip" legacyBehavior>
                        <a>
                          <Button variant="primary" fullWidth>
                            Ir para Planos VIP
                          </Button>
                        </a>
                      </Link>
                      <Link href="/profile" legacyBehavior>
                        <a>
                          <Button variant="outline" fullWidth>
                            Ir para Meu Perfil
                          </Button>
                        </a>
                      </Link>
                    </div>
                  </>
                ) : paymentStatus === 'pending' ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-yellow-900/20 flex items-center justify-center mx-auto mb-4">
                      <FaSpinner className="text-yellow-500 text-4xl animate-spin" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Pagamento Pendente</h1>
                    <p className="text-gray-300 mb-6">
                      Seu pagamento foi recebido e está sendo processado. Assim que for confirmado, sua assinatura será ativada automaticamente.
                    </p>
                    <div className="flex flex-col space-y-4">
                      <Link href="/vip" legacyBehavior>
                        <a>
                          <Button variant="primary" fullWidth>
                            Voltar para Planos VIP
                          </Button>
                        </a>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <Alert variant="warning" className="mb-6">
                      Status do pagamento: {paymentStatus || 'Desconhecido'}
                    </Alert>
                    <p className="text-gray-300 mb-6">
                      Estamos com informações conflitantes sobre seu pagamento. Entre em contato com o suporte para verificar o status.
                    </p>
                    <div className="flex flex-col space-y-4">
                      <Link href="/vip" legacyBehavior>
                        <a>
                          <Button variant="primary" fullWidth>
                            Voltar para Planos VIP
                          </Button>
                        </a>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}