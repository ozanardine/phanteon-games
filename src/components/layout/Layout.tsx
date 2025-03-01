import React from 'react';
import Head from 'next/head';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

type LayoutProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
};

export function Layout({ children, title = 'Phanteon Games', description = 'Comunidade de jogos Phanteon Games' }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-phanteon-dark text-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Navbar />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}