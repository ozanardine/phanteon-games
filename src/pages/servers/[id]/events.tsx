// src/pages/servers/[id]/events.tsx
// Este arquivo vazio é necessário para que o Next.js não tente
// renderizar a API como um componente React
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function EventsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirecionar para a página do servidor
    if (router.query.id) {
      router.replace(`/servers/${router.query.id}`);
    }
  }, [router]);
  
  return null;
}