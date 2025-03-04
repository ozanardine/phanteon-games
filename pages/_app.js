import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import { useEffect } from 'react';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  // Log para depuração da sessão
  useEffect(() => {
    if (session) {
      console.log('Sessão ativa:', session.user.name);
    } else {
      console.log('Nenhuma sessão ativa');
    }
  }, [session]);

  return (
    <SessionProvider 
      session={session}
      refetchInterval={5 * 60} // Revalida a sessão a cada 5 minutos
      refetchOnWindowFocus={true} // Revalida quando a janela ganha foco
    >
      <Layout>
        <Component {...pageProps} />
        <Toaster position="top-right" />
      </Layout>
    </SessionProvider>
  );
}

export default MyApp;