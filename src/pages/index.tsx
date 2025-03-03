// src/pages/index.tsx
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaDiscord } from 'react-icons/fa';
import { ServerStatusBox } from '../components/ServerStatus';

export default function ComingSoonPage() {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // Data alvo para lançamento - ajuste conforme necessário
  const targetDate = new Date('2025-04-15T00:00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        clearInterval(interval);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-phanteon-dark text-white flex flex-col overflow-hidden relative">
      <Head>
        <title>Phanteon Games | Em Breve</title>
        <meta name="description" content="Phanteon Games - Em construção. Junte-se à nossa comunidade no Discord!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Elementos de fundo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-phanteon-dark to-phanteon-gray"></div>
        <div className="absolute top-[-50%] left-[-10%] w-[70%] h-[200%] bg-phanteon-orange/5 rounded-full blur-3xl transform rotate-12"></div>
        <div className="absolute bottom-[-30%] right-[-5%] w-[50%] h-[90%] bg-phanteon-orange/10 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center px-4 z-10 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo Area */}
          <div className="mb-8 flex flex-col items-center">
            <div className="w-48 h-48 bg-phanteon-light rounded-full mb-6 flex items-center justify-center overflow-hidden border-4 border-phanteon-orange/30">
              {/* Logo da comunidade */}
              <img 
                src="https://i.imgur.com/PFUYbUz.png" 
                alt="Phanteon Games Logo" 
                className="w-32 h-32 object-contain"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-2">
              <span className="text-phanteon-orange">Phanteon</span> Games
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Estamos construindo algo incrível para você.
            </p>
          </div>

          {/* Countdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-phanteon-gray p-4 rounded-lg border border-phanteon-light">
              <div className="text-4xl font-bold text-phanteon-orange">{countdown.days}</div>
              <div className="text-gray-400 text-sm">Dias</div>
            </div>
            <div className="bg-phanteon-gray p-4 rounded-lg border border-phanteon-light">
              <div className="text-4xl font-bold text-phanteon-orange">{countdown.hours}</div>
              <div className="text-gray-400 text-sm">Horas</div>
            </div>
            <div className="bg-phanteon-gray p-4 rounded-lg border border-phanteon-light">
              <div className="text-4xl font-bold text-phanteon-orange">{countdown.minutes}</div>
              <div className="text-gray-400 text-sm">Minutos</div>
            </div>
            <div className="bg-phanteon-gray p-4 rounded-lg border border-phanteon-light">
              <div className="text-4xl font-bold text-phanteon-orange">{countdown.seconds}</div>
              <div className="text-gray-400 text-sm">Segundos</div>
            </div>
          </div>

          {/* Server Status Box */}
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                {/* CTA */}
                <div className="mb-6">
                  <p className="text-lg text-gray-300 mb-4">
                    Enquanto trabalhamos, junte-se à nossa comunidade no Discord para ficar por dentro de todas as novidades!
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
              </div>
              
              <div>
                {/* Status do Servidor */}
                <ServerStatusBox />
              </div>
            </div>
          </div>


        </div>
      </main>

      <footer className="py-6 border-t border-phanteon-light bg-phanteon-dark z-10 relative">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} Phanteon Games. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}