import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <link rel="icon" href="/logo.png" />
        <meta name="description" content="Phanteon Games - Assinaturas VIP para servidor de Rust" />
        <meta name="theme-color" content="#EC4D2D" />
        <meta property="og:title" content="Phanteon Games" />
        <meta property="og:description" content="Assinaturas VIP para servidor de Rust" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/images/og-image.jpg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}