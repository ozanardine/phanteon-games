import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FaDiscord, FaPaypal, FaCreditCard } from 'react-icons/fa';
import { FaPix } from "react-icons/fa6";

export default function SupportPage() {
  return (
    <Layout title="Apoie a Comunidade | Phanteon Games" description="Apoie a comunidade Phanteon Games">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Apoie a Comunidade</h1>
          <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
            A Phanteon Games é mantida com muito carinho e dedicação.
            Seu apoio é fundamental para continuarmos crescendo e oferecendo a melhor experiência possível.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-phanteon-orange/20 rounded-full mb-4">
                <FaDiscord className="w-8 h-8 text-phanteon-orange" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Torne-se VIP</h2>
              <p className="text-gray-300 mb-6">
                Ao adquirir qualquer plano VIP, você não só ganha benefícios exclusivos,
                mas também ajuda a manter nossos servidores online e de alta qualidade.
              </p>
              <Button variant="primary" className="w-full">
                Ver Planos VIP
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-phanteon-orange/20 rounded-full mb-4">
                <FaCreditCard className="w-8 h-8 text-phanteon-orange" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Faça uma Doação</h2>
              <p className="text-gray-300 mb-6">
                Mesmo uma pequena doação faz uma grande diferença.
                Todo valor arrecadado é utilizado para melhorar a infraestrutura da comunidade.
              </p>
              <Button variant="primary" className="w-full">
                Doar Agora
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-phanteon-gray rounded-lg p-8 border border-phanteon-light">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Formas de Pagamento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-phanteon-dark p-6 rounded-lg text-center">
              <FaPix className="w-12 h-12 text-phanteon-orange mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">PIX</h3>
              <p className="text-gray-400 mb-4">
                Pagamento instantâneo via PIX.
              </p>
              <Button variant="outline" className="w-full">
                Pagar com PIX
              </Button>
            </div>
            
            <div className="bg-phanteon-dark p-6 rounded-lg text-center">
              <FaCreditCard className="w-12 h-12 text-phanteon-orange mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Cartão</h3>
              <p className="text-gray-400 mb-4">
                Crédito ou débito, parcele em até 12x.
              </p>
              <Button variant="outline" className="w-full">
                Pagar com Cartão
              </Button>
            </div>
            
            <div className="bg-phanteon-dark p-6 rounded-lg text-center">
              <FaPaypal className="w-12 h-12 text-phanteon-orange mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">PayPal</h3>
              <p className="text-gray-400 mb-4">
                Pagamento seguro via PayPal.
              </p>
              <Button variant="outline" className="w-full">
                Pagar com PayPal
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Outras Formas de Apoio</h2>
          <p className="text-gray-300 mb-8 max-w-3xl mx-auto">
            Você também pode apoiar a Phanteon Games de outras maneiras:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-phanteon-gray p-6 rounded-lg">
              <h3 className="text-xl font-medium text-white mb-3">Compartilhe</h3>
              <p className="text-gray-400">
                Compartilhe nossos servidores com seus amigos e ajude nossa comunidade a crescer.
              </p>
            </div>
            
            <div className="bg-phanteon-gray p-6 rounded-lg">
              <h3 className="text-xl font-medium text-white mb-3">Participe Ativamente</h3>
              <p className="text-gray-400">
                Participe dos eventos, ajude novos jogadores e contribua para um ambiente positivo.
              </p>
            </div>
            
            <div className="bg-phanteon-gray p-6 rounded-lg">
              <h3 className="text-xl font-medium text-white mb-3">Envie Sugestões</h3>
              <p className="text-gray-400">
                Suas ideias são valiosas! Envie sugestões para melhorarmos ainda mais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}