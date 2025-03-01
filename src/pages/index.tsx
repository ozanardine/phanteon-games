import React from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { FaServer, FaGamepad, FaUsers, FaDiscord } from 'react-icons/fa';

export default function HomePage() {
  return (
    <Layout>
      <section className="relative bg-phanteon-dark">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-phanteon-dark to-phanteon-gray opacity-50"></div>
        
        {/* Hero Section */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Bem-vindo à <span className="text-phanteon-orange">Phanteon Games</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Junte-se a nossa comunidade de jogos e desfrute de servidores de alta qualidade, 
              eventos exclusivos e uma comunidade incrível.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/servers">
                <Button size="lg" className="px-8">
                  <FaServer className="mr-2" />
                  Ver Servidores
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="px-8">
                  <FaUsers className="mr-2" />
                  Criar Conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-phanteon-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Por que escolher a Phanteon Games?</h2>
            <p className="mt-4 text-lg text-gray-300">
              Uma experiência de jogo de qualidade com recursos exclusivos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-phanteon-dark p-6 rounded-lg border border-phanteon-light">
              <div className="w-12 h-12 bg-phanteon-orange/20 rounded-lg flex items-center justify-center mb-4">
                <FaServer className="w-6 h-6 text-phanteon-orange" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Servidores de Alta Performance</h3>
              <p className="text-gray-400">
                Nossos servidores são otimizados para oferecer uma experiência de jogo suave e sem lag.
              </p>
            </div>
            
            <div className="bg-phanteon-dark p-6 rounded-lg border border-phanteon-light">
              <div className="w-12 h-12 bg-phanteon-orange/20 rounded-lg flex items-center justify-center mb-4">
                <FaGamepad className="w-6 h-6 text-phanteon-orange" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Experiência VIP</h3>
              <p className="text-gray-400">
                Benefícios exclusivos para membros VIP, incluindo itens especiais e acesso antecipado a eventos.
              </p>
            </div>
            
            <div className="bg-phanteon-dark p-6 rounded-lg border border-phanteon-light">
              <div className="w-12 h-12 bg-phanteon-orange/20 rounded-lg flex items-center justify-center mb-4">
                <FaUsers className="w-6 h-6 text-phanteon-orange" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Comunidade Ativa</h3>
              <p className="text-gray-400">
                Faça parte de uma comunidade amigável e apaixonada por jogos.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Community Section */}
      <section className="py-16 bg-phanteon-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold text-white mb-4">
                Junte-se à nossa comunidade
              </h2>
              <p className="text-gray-300 mb-6">
                Conecte-se com outros jogadores, participe de eventos e fique por dentro de todas as novidades.
                Nossa comunidade é ativa e acolhedora, sempre pronta para receber novos membros.
              </p>
              <a 
                href="https://discord.gg/phanteongames" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center bg-[#5865F2] text-white px-6 py-3 rounded-md hover:bg-[#5865F2]/90 transition"
              >
                <FaDiscord className="mr-2 w-5 h-5" />
                Entrar no Discord
              </a>
            </div>
            
            <div className="md:w-1/2 md:pl-12">
              <div className="bg-phanteon-gray rounded-lg p-6 border border-phanteon-light">
                <h3 className="text-xl font-medium text-white mb-4">Próximos Eventos</h3>
                
                <div className="space-y-4">
                  <div className="bg-phanteon-dark p-4 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white">Torneio Semanal</h4>
                        <p className="text-sm text-gray-400 mt-1">Competição com premiação especial para os vencedores</p>
                      </div>
                      <span className="text-sm text-phanteon-orange">Sábado, 20:00</span>
                    </div>
                  </div>
                  
                  <div className="bg-phanteon-dark p-4 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white">Maratona de Jogos</h4>
                        <p className="text-sm text-gray-400 mt-1">24 horas de gameplay com drop de itens raros</p>
                      </div>
                      <span className="text-sm text-phanteon-orange">Sexta, 18:00</span>
                    </div>
                  </div>
                  
                  <div className="bg-phanteon-dark p-4 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white">Inauguração Novo Servidor</h4>
                        <p className="text-sm text-gray-400 mt-1">Venha conhecer nosso novo servidor</p>
                      </div>
                      <span className="text-sm text-phanteon-orange">Domingo, 15:00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-phanteon-gray">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Pronto para começar sua aventura?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Crie sua conta agora e junte-se a milhares de jogadores na Phanteon Games.
            A diversão está apenas a um clique de distância!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Criar Conta Grátis
              </Button>
            </Link>
            <Link href="/vip">
              <Button variant="outline" size="lg" className="px-8">
                Ver Planos VIP
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}