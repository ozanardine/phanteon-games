import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router'; // Adicionando importação do useRouter
import Layout from '../components/layout/Layout';
import ServerStatus from '../components/server/ServerStatus';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import JoinServer from '../components/server/JoinServer';
import { useServerStatus } from '../hooks/useServerStatus';
import { FaSteam, FaDiscord, FaCalendarAlt, FaUsers, FaMap } from 'react-icons/fa';

const HomePage = () => {
  const router = useRouter(); // Inicializando o hook useRouter
  const { playerCount, maxPlayers, mapSize, seed, isOnline } = useServerStatus();

  return (
    <Layout 
      title="Phanteon Games - Comunidade Brasileira de Rust"
      description="Entre na melhor comunidade de Rust do Brasil. Jogadores ativos, eventos exclusivos e sistema VIP."
    >
      {/* Seção Hero */}
      <section className="relative h-screen flex items-center">
        {/* Imagem de Fundo */}
        <div className="absolute inset-0 bg-hero-pattern bg-cover bg-center bg-no-repeat opacity-50" />
        
        {/* Overlay Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-900" />
        
        {/* Conteúdo */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white text-shadow-lg">
              Bem-vindo à <span className="text-amber-500">Phanteon Games</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-200 mb-8 text-shadow">
              A melhor comunidade brasileira de Rust com servidores ativos, eventos exclusivos e recursos premium.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                leftIcon={<FaSteam />}
                onClick={() => window.location.href = 'steam://connect/game.phanteongames.com:28015'}
              >
                Conectar via Steam
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                leftIcon={<FaDiscord />}
                onClick={() => window.location.href = '/discord'}
              >
                Entrar no Discord
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Status do Servidor */}
      <section className="py-16 bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">Status do Servidor</h2>
              <p className="text-zinc-300 mb-8">
                Nossos servidores são hospedados em hardware de alta performance com proteção DDoS para garantir a melhor experiência de jogo. Junte-se agora e faça parte da nossa comunidade ativa!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <JoinServer 
                  serverAddress="game.phanteongames.com:28015"
                />
              </div>
            </div>
            
            <div className="md:w-1/2">
              <ServerStatus 
                isOnline={isOnline}
                playerCount={playerCount}
                maxPlayers={maxPlayers}
                mapSize={mapSize}
                seed={seed}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Características */}
      <section className="py-16 bg-zinc-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Por que escolher a Phanteon Games?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center" hoverEffect>
              <div className="p-4">
                <div className="bg-amber-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FaUsers className="text-amber-500 text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Comunidade Ativa</h3>
                <p className="text-zinc-400">
                  Junte-se a uma comunidade vibrante de jogadores. Faça amigos e encontre parceiros para sua próxima aventura.
                </p>
              </div>
            </Card>
            
            <Card className="text-center" hoverEffect>
              <div className="p-4">
                <div className="bg-amber-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FaCalendarAlt className="text-amber-500 text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Eventos Semanais</h3>
                <p className="text-zinc-400">
                  Participe de eventos emocionantes com ótimas recompensas. Torneios PvP, caças ao tesouro e muito mais!
                </p>
              </div>
            </Card>
            
            <Card className="text-center" hoverEffect>
              <div className="p-4">
                <div className="bg-amber-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FaMap className="text-amber-500 text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Mapas Customizados</h3>
                <p className="text-zinc-400">
                  Desfrute de mapas únicos e cuidadosamente balanceados que proporcionam a melhor experiência de jogo para todos os jogadores.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Seção CTA */}
      <section className="py-16 bg-gradient-rust text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Pronto para se juntar a nós?</h2>
          <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
            Torne-se parte da nossa crescente comunidade hoje. Conecte-se com outros jogadores, participe de eventos e desfrute de recursos premium.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              variant="primary" 
              onClick={() => window.location.href = 'steam://connect/game.phanteongames.com:28015'}
            >
              Entrar no Servidor Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => router.push('/vip')}
            >
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;