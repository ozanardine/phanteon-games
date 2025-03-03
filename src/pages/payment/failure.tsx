import React from 'react';
import { useRouter } from 'next/router';
import { FaTimesCircle } from 'react-icons/fa';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button, Card } from '@/components/ui/Button';
import { ProtectedRoute } from '@/components/layout/MainLayout';
import Link from 'next/link';

export default function PaymentFailurePage() {
  const router = useRouter();
  const { subscription_id } = router.query;

  return (
    <ProtectedRoute>
      <MainLayout
        title="Pagamento Falhou"
        description="Seu pagamento não foi concluído."
      >
        <div className="bg-phanteon-dark min-h-screen flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <Card className="border-red-600/30">
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                  <FaTimesCircle className="text-red-500 text-4xl" />
                </div>
                <h1 className="text-2xl font-bold mb-4">Pagamento não concluído</h1>
                <p className="text-gray-300 mb-6">
                  Seu pagamento não pôde ser processado ou foi recusado. Nenhum valor foi cobrado.
                </p>
                <div className="flex flex-col space-y-4">
                  <Link href={`/vip?plan=${subscription_id}`} legacyBehavior>
                    <a>
                      <Button variant="primary" fullWidth>
                        Tentar novamente
                      </Button>
                    </a>
                  </Link>
                  <Link href="/vip" legacyBehavior>
                    <a>
                      <Button variant="outline" fullWidth>
                        Voltar para Planos VIP
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