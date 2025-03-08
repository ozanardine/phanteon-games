import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();

  // Prefetch de páginas populares para melhorar performance
  useEffect(() => {
    const prefetchRoutes = async () => {
      // Prefetch das páginas mais visitadas
      await Promise.all([
        router.prefetch('/planos'),
        router.prefetch('/perfil'),
        router.prefetch('/servers')
      ]);
    };
    
    prefetchRoutes();
  }, [router]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Phanteon Games - Comunidade Brasileira de Jogos com servidores de alta qualidade, planos VIP, e experiências exclusivas para diversos jogos." />
        <meta name="keywords" content="jogos, servidores, gaming, comunidade gamer, vip, phanteon, rust, minecraft, cs2, brasileiro" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Phanteon Games - Comunidade Brasileira de Jogos" />
        <meta property="og:description" content="Comunidade brasileira com servidores de alta qualidade para diversos jogos. Obtenha vantagens VIP, comandos exclusivos e experiências diferenciadas." />
        <meta property="og:image" content="/images/rust_banner3.png" />
        <meta property="og:site_name" content="Phanteon Games" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Phanteon Games - Comunidade Brasileira de Jogos" />
        <meta name="twitter:description" content="Comunidade brasileira com servidores de alta qualidade para diversos jogos. Obtenha vantagens VIP, comandos exclusivos e experiências diferenciadas." />
        <meta name="twitter:image" content="/images/rust_banner3.png" />
        <meta name="theme-color" content="#EC4D2D" />
        <link rel="icon" href="/logo.png" />
        <link rel="canonical" href="https://phanteongames.com" />
      </Head>
      <SessionProvider 
        session={session}
        refetchInterval={5 * 60} // Revalida a sessão a cada 5 minutos
        refetchOnWindowFocus={true} // Revalida quando a janela ganha foco
      >
        <Layout>
          <Component {...pageProps} />
          <Toaster 
            position="top-right" 
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '0.375rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#FFF',
                },
                style: {
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  background: 'rgba(16, 185, 129, 0.1)',
                }
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFF',
                },
                style: {
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  background: 'rgba(239, 68, 68, 0.1)',
                }
              },
            }} 
          />
        </Layout>
      </SessionProvider>
    </>
  );
}

export default MyApp;