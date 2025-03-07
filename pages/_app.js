import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();

  // Log para depuração da sessão
  useEffect(() => {
    if (session) {
      // Session is available
    } else {
      // No session available
    }
  }, [session]);

  // Prefetch de páginas populares para melhorar performance
  useEffect(() => {
    // Prefetch das páginas mais visitadas
    router.prefetch('/planos');
    router.prefetch('/perfil');
    router.prefetch('/servers');
  }, [router]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Phanteon Games - Servidor Brasileiro de Rust com planos VIP, assinaturas e recursos exclusivos para melhorar sua experiência de jogo." />
        <meta name="keywords" content="rust, jogos, servidor, game, vip, phanteon, brasileiro" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Phanteon Games - Servidor Rust Brasileiro" />
        <meta property="og:description" content="O melhor servidor brasileiro de Rust. Obtenha vantagens VIP, comandos exclusivos e kits especiais." />
        <meta property="og:image" content="/images/og-image.jpg" />
        <meta name="theme-color" content="#FF4B00" />
        <link rel="icon" href="/logo.png" />
      </Head>
      <SessionProvider 
        session={session}
        refetchInterval={5 * 60} // Revalida a sessão a cada 5 minutos
        refetchOnWindowFocus={true} // Revalida quando a janela ganha foco
      >
        <Layout>
          <Component {...pageProps} />
          <Toaster position="top-right" toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFF',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFF',
              },
            },
          }} />
        </Layout>
      </SessionProvider>
    </>
  );
}

export default MyApp;