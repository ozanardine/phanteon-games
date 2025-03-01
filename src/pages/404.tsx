import React from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <Layout title="Página não encontrada | Phanteon Games">
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
        <h1 className="text-phanteon-orange text-7xl md:text-9xl font-bold mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Página não encontrada</h2>
        <p className="text-gray-300 text-center max-w-md mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link href="/">
          <Button size="lg">
            Voltar para o Início
          </Button>
        </Link>
      </div>
    </Layout>
  );
}