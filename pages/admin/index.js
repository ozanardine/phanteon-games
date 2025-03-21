import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSession } from 'next-auth/react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Página de redirecionamento para área administrativa
export default function AdminIndex() {
  const router = useRouter();
  
  // Redirecionar para rewards
  useEffect(() => {
    router.replace('/admin/rewards');
  }, [router]);
  
  // Mostrar loading enquanto redireciona
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-300">
      <LoadingSpinner size="lg" />
    </div>
  );
}

// Verificação de autenticação no lado do servidor
export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  // Verificar explicitamente se o usuário tem a role admin antes de renderizar a página
  if (!session.user || !session.user.role || session.user.role !== 'admin') {
    return {
      redirect: {
        destination: '/perfil',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      user: session.user || null,
    },
  };
} 