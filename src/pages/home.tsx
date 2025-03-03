// src/pages/home.tsx
import React, { useState, useEffect } from 'react';
import { FaGamepad, FaUsers, FaServer, FaStar, FaDiscord } from 'react-icons/fa';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ServerStatusBox } from '@/components/ServerStatus';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const [serverStatus, setServerStatus] = useState<{
    name: string;
    status: string;
    players: number;
    maxPlayers: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [latestNewsItems, setLatestNewsItems] = useState<any[]>([]);

  useEffect(() => {
    // Buscar status do servidor
    const fetchServerStatus = async () => {
      try {
        const response = await fetch('/api/server-status');
        if (response.ok) {
          const data = await response.json();
          setServerStatus(data);
        } else {
          console.error('Erro ao buscar status do servidor');
        }
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServerStatus();

    // Exemplo de busca de notícias (substitua por uma API real quando disponível)
    setLatestNewsItems([
      {
        id: 1,
        title: 'Wipe Semanal - Novidades e Atualizações',
        summary: 'Prepare-se para o wipe! Confira as novidades e atualizações que chegam ao servidor esta semana.',
        date: '2025-03-05',
        image: 'https://i.imgur.com/PFUYbUz.png'
      },
      {
        id: 2,
        title: 'Novo Sistema VIP - Benefícios Exclusivos',
        summary: 'Lançamos nosso novo sistema VIP com vantagens incríveis! Adquira já o seu e desfrute de recursos exclusivos.',
        date: '2025-03-03',
        image: 'https://i.imgur.com/PFUYbUz.png'
      },
      {
        id: 3,
        title: 'Evento de Loot Especial - Este Final de Semana',
        summary: 'Participe do nosso evento especial com loot dobrado e chances aumentadas de itens raros.',
        date: '2025-03-01',
        image: 'https://i.imgur.com/PFUYbUz.png'
      }
    ]);
  }, []);

  return (
    <MainLayout 
      title="Início" 
      description="Phanteon Games - Sua nova experiência em servidores de Rust. Conheça nossa comunidade e servidores de alto desempenho."
    >
      {/* Hero Section */}
      <section className="relative bg-phanteon-dark">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-phanteon-dark to-phanteon-gray/50"></div>
          <div className="absolute top-[-50%] left-[-10%] w-[70%] h-[200%] bg-phanteon-orange/5 rounded-full blur-3xl transform rotate-12"></div>
          <div className="absolute bottom-[-30%] right-[-5%] w-[50%] h-[90%] bg-phanteon-orange/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-phanteon-orange">Bem-vindo</span> ao Phanteon Games
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                A melhor experiência para jogadores de Rust. Servidores otimizados, comunidade ativa e eventos exclusivos.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/servers" legacyBehavior>
                  <a>
                    <Button size="lg" variant="primary">
                      <FaServer className="mr-2" /> Nossos Servidores
                    </Button>
                  </a>
                </Link>
                <Link href="/vip" legacyBehavior>
                  <a>
                    <Button size="lg" variant="outline">
                      <FaStar className="mr-2" /> Planos VIP
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <ServerStatusBox />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-phanteon-gray py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">
              <span className="text-phanteon-orange">Por que</span> escolher a Phanteon Games?
            </h2>
            <p className="mt-4 text-gray-300 max-w-3xl mx-auto">
              Oferecemos a melhor infraestrutura e experiência de jogo para todos os jogadores
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-phanteon-dark/60 hover:bg-phanteon-dark transition-colors">
              <div className="text-center p-4">
                <div className="bg-phanteon-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaServer className="text-phanteon-orange text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Servidores Otimizados</h3>
                <p className="text-gray-400">
                  Hardware de última geração e configurações otimizadas para garantir a melhor performance sem lag.
                </p>
              </div>
            </Card>

            <Card className="bg-phanteon-dark/60 hover:bg-phanteon-dark transition-colors">
              <div className="text-center p-4">
                <div className="bg-phanteon-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUsers className="text-phanteon-orange text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Comunidade Ativa</h3>
                <p className="text-gray-400">
                  Jogadores amigáveis e administração presente para garantir uma experiência justa e divertida.
                </p>
              </div>
            </Card>

            <Card className="bg-phanteon-dark/60 hover:bg-phanteon-dark transition-colors">
              <div className="text-center p-4">
                <div className="bg-phanteon-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaGamepad className="text-phanteon-orange text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Eventos Exclusivos</h3>
                <p className="text-gray-400">
                  Eventos regulares com premiações especiais para manter o servidor dinâmico e divertido.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="bg-phanteon-dark py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">
              <span className="text-phanteon-orange">Últimas</span> Notícias
            </h2>
            <Link href="/news" legacyBehavior>
              <a className="text-phanteon-orange hover:text-phanteon-orange/80 font-medium transition-colors">
                Ver todas
              </a>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestNewsItems.map((news) => (
              <Card key={news.id} className="bg-phanteon-gray/60 hover:bg-phanteon-gray transition-colors overflow-hidden">
                <div className="aspect-video bg-phanteon-dark overflow-hidden">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <p className="text-gray-400 text-sm mb-2">{new Date(news.date).toLocaleDateString('pt-BR')}</p>
                  <h3 className="text-xl font-semibold mb-2">{news.title}</h3>
                  <p className="text-gray-300 mb-4 line-clamp-2">{news.summary}</p>
                  <Link href={`/news/${news.id}`} legacyBehavior>
                    <a className="text-phanteon-orange hover:text-phanteon-orange/80 font-medium transition-colors">
                      Ler mais
                    </a>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Discord CTA Section */}
      <section className="bg-[#5865F2]/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="mb-8 lg:mb-0 lg:pr-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Junte-se à nossa comunidade no Discord
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                Conecte-se com outros jogadores, participe de eventos exclusivos e fique por dentro de todas as novidades.
              </p>
              <a
                href="https://discord.gg/CFc9VrF2Xh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                <FaDiscord className="mr-2 text-2xl" />
                Entrar no Discord
              </a>
            </div>
            <div className="lg:w-1/3">
              <div className="bg-phanteon-dark rounded-lg p-6 border border-[#5865F2]/30">
                <div className="flex items-center mb-4">
                  <FaDiscord className="text-[#5865F2] text-4xl mr-4" />
                  <div>
                    <h3 className="text-xl font-bold">Phanteon Games</h3>
                    <p className="text-gray-400">Mais de 1.000 membros online</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-phanteon-gray/40 p-3 rounded-lg">
                    <p className="text-gray-300 font-medium"># anúncios</p>
                    <p className="text-gray-400 text-sm">Atualizações e novidades do servidor</p>
                  </div>
                  <div className="bg-phanteon-gray/40 p-3 rounded-lg">
                    <p className="text-gray-300 font-medium"># chat-geral</p>
                    <p className="text-gray-400 text-sm">Converse com a comunidade</p>
                  </div>
                  <div className="bg-phanteon-gray/40 p-3 rounded-lg">
                    <p className="text-gray-300 font-medium"># suporte</p>
                    <p className="text-gray-400 text-sm">Obtenha ajuda dos administradores</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}