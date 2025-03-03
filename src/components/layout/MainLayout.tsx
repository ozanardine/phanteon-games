import React, { ReactNode } from 'react';
import Head from 'next/head';
import { Header } from './Header';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function MainLayout({ children, title, description }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-phanteon-dark text-white flex flex-col">
      <Head>
        <title>{title} | Phanteon Games</title>
        {description && <meta name="description" content={description} />}
        <link rel="icon" href="https://i.imgur.com/PFUYbUz.png" />
        <meta property="og:title" content={`${title} | Phanteon Games`} />
        {description && <meta property="og:description" content={description} />}
        <meta property="og:image" content="https://i.imgur.com/PFUYbUz.png" />
        <meta property="og:url" content="https://phanteongames.com" />
        <meta property="og:type" content="website" />
      </Head>

      <Header />

      <main className="flex-grow">
        {children}
      </main>

      <Footer />
    </div>
  );
}

export { default as ProtectedRoute } from './ProtectedRoute';