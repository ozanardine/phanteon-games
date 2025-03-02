// src/pages/servers/battlemetrics/[id].tsx
// Este arquivo vazio é necessário para que o Next.js não tente
// renderizar a API como um componente React
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function BattlemetricsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirecionar para a página de servidores
    router.replace('/servers');
  }, [router]);
  
  return null;
}