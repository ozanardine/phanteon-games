import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        
        {/* Fonts - Adicionando a fonte Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* Primary Meta Tags */}
        <meta name="description" content="Phanteon Games - Servidores de Rust com planos VIP e comunidade ativa" />
        <meta name="keywords" content="jogos, servidores, gaming, comunidade gamer, vip, phanteon, rust, brasileiro" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#EC4D2D" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Phanteon Games" />
        <meta property="og:description" content="Comunidade Brasileira de servidores de jogos online." />
        <meta property="og:image" content="/images/rust_banner3.png" />
        <meta property="og:site_name" content="Phanteon Games" />
        <meta property="og:locale" content="pt_BR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Phanteon Games" />
        <meta name="twitter:description" content="Comunidade Brasileira de servidores de jogos online." />
        <meta name="twitter:image" content="/images/rust_banner3.png" />

      </Head>
      <body>
        <Main />
        <NextScript />
        
        {/* Aqui você pode adicionar scripts que precisam ser carregados após o conteúdo principal */}
      </body>
    </Html>
  );
}