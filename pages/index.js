import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import Image from 'next/image';
import Button from '../components/ui/Button';
import { FaDiscord, FaGamepad, FaRocket, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  // Verifica se o usuário foi redirecionado para login
  useEffect(() => {
    if (router.query.login === 'true' && !session) {
      toast.error('Faça login para continuar');
    }
  }, [router.query, session]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-dark-400 py-16 md:py-24">
        <div className="container-custom mx-auto px-4 z-10 relative">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                Eleve Sua Experiência de <span className="text-primary">Jogo</span>
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Assinaturas VIP para os melhores servidores de jogos. 
                Obtenha vantagens exclusivas, benefícios especiais e suporte prioritário.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {!session ? (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => signIn('discord')}
                    className="flex items-center justify-center"
                  >
                    <FaDiscord className="mr-2" />
                    Entrar com Discord
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    href="/planos"
                    className="flex items-center justify-center"
                  >
                    <FaRocket className="mr-2" />
                    Ver Planos VIP
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  href="https://discord.gg/v8575VMgPW"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Entrar no Discord
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="relative h-[300px] md:h-[400px] w-full">
                <Image 
                  src="/images/rust-hero.webp" 
                  alt="Phanteon Games Rust Server" 
                  fill
                  className="object-cover rounded-lg shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-400 opacity-80"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-dark-300">
        <div className="container-custom mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Benefícios VIP
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Desfrute de vantagens exclusivas e melhore sua experiência em nossos servidores com os planos VIP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-dark-400 rounded-lg p-6 border border-dark-200 shadow-lg">
              <div className="bg-primary/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FaRocket className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Vantagens Exclusivas</h3>
              <p className="text-gray-400">
                Acesso a recursos e benefícios exclusivos para membros VIP, incluindo itens especiais e bônus únicos.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-dark-400 rounded-lg p-6 border border-dark-200 shadow-lg">
              <div className="bg-primary/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FaGamepad className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Recursos Premium</h3>
              <p className="text-gray-400">
                Desbloqueie comandos e funcionalidades especiais que melhoram sua experiência nos servidores.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-dark-400 rounded-lg p-6 border border-dark-200 shadow-lg">
              <div className="bg-primary/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FaShieldAlt className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Suporte Dedicado</h3>
              <p className="text-gray-400">
                Acesso prioritário ao suporte, canais exclusivos no Discord e participação em eventos especiais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container-custom mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para uma experiência premium?
          </h2>
          <p className="text-white text-lg mb-8 max-w-2xl mx-auto">
            Junte-se aos jogadores que já desfrutam dos benefícios VIP em nossos servidores. 
            Planos a partir de R$19,90 por mês.
          </p>
          <Button
            variant="secondary"
            size="lg"
            href="/planos"
          >
            Ver Planos VIP
          </Button>
        </div>
      </section>
    </div>
  );
}