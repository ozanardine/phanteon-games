import React, { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-phanteon-dark text-white flex flex-col overflow-hidden relative">
      <Head>
        <title>{title} | Phanteon Games</title>
        {description && <meta name="description" content={description} />}
        <link rel="icon" href="https://i.imgur.com/PFUYbUz.png" />
      </Head>

      {/* Elementos de fundo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-phanteon-dark to-phanteon-gray"></div>
        <div className="absolute top-[-50%] left-[-10%] w-[70%] h-[200%] bg-phanteon-orange/5 rounded-full blur-3xl transform rotate-12"></div>
        <div className="absolute bottom-[-30%] right-[-5%] w-[50%] h-[90%] bg-phanteon-orange/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header simples */}
      <header className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" legacyBehavior>
            <a className="flex items-center">
              <img
                src="https://i.imgur.com/PFUYbUz.png"
                alt="Phanteon Games Logo"
                className="h-8 w-auto mr-2"
              />
              <span className="text-white font-bold text-xl">
                <span className="text-phanteon-orange">Phanteon</span> Games
              </span>
            </a>
          </Link>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-grow flex items-center justify-center px-4 py-12 relative z-10">
        {children}
      </main>

      {/* Footer simples */}
      <footer className="relative z-10 p-4 text-center">
        <p className="text-gray-400">
          &copy; {new Date().getFullYear()} Phanteon Games. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}