import React from 'react';
import { useRouter } from 'next/router';
import { FaClock } from 'react-icons/fa';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import Link from 'next/link';

export default function PaymentPendingPage() {
  const router = useRouter();
  const { subscription_id } = router.query;

  return (
    <ProtectedRoute>
      <MainLayout
        title="Pagamento Pendente"
        description="Seu pagamento está pendente de confirmação."
      >
        <div className="bg-phanteon-dark min-h-screen flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <Card className="border-yellow-600/30">
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-900/20 flex items-center justify-center mx-auto mb-4">
                  <FaClock className="text-yellow-500 text-4xl" />
                </div>
                <h1 className="text-2xl font-bold mb-4">Pagamento pendente</h1>
                <p className="text-gray-300 mb-6">
                  Seu pagamento foi recebido e está aguardando confirmação. Assim que for processado, sua assinatura será ativada automaticamente.
                </p>
                <div className="bg-phanteon-light/20 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-300">
                    Dependendo do método de pagamento escolhido, a confirmação pode levar até 3 dias úteis. Você receberá uma notificação assim que o pagamento for aprovado.
                  </p>
                </div>
                <div className="flex flex-col space-y-4">
                  <Link href="/subscriptions" legacyBehavior>
                    <a>
                      <Button variant="primary" fullWidth>
                        Ver minhas assinaturas
                      </Button>
                    </a>
                  </Link>
                  <Link href="/home" legacyBehavior>
                    <a>
                      <Button variant="outline" fullWidth>
                        Voltar para o início
                      </Button>
                    </a>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}