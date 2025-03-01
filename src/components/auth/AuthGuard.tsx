// src/components/auth/AuthGuard.tsx
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: 'user' | 'vip' | 'admin'; // Opcional: papel necessário para acesso
}

/**
 * Componente que protege rotas autenticadas
 * Redireciona para a página de login se o usuário não estiver autenticado
 */
const AuthGuard = ({ children, requiredRole = 'user' }: AuthGuardProps) => {
  const { isAuthenticated, loading, hasActiveSubscription, isAdmin, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Aguardar até que a verificação de autenticação esteja completa
    if (!loading) {
      // Se o usuário não estiver autenticado, redirecionar para o login
      if (!isAuthenticated) {
        router.push({
          pathname: '/auth/login',
          query: { redirect: router.asPath }, // Salvar a URL atual para redirecionar depois do login
        });
      } 
      // Verificar se o usuário tem o papel necessário
      else if (requiredRole === 'vip' && !hasActiveSubscription) {
        router.push('/vip?required=true');
      }
      else if (requiredRole === 'admin' && !isAdmin) {
        router.push('/');
      }
    }
  }, [isAuthenticated, loading, router, requiredRole, hasActiveSubscription, isAdmin]);

  // Mostrar indicador de carregamento enquanto verifica a autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" color="amber" text="Verificando autenticação..." />
      </div>
    );
  }

  // Se estiver autenticado (e tiver o papel necessário), mostrar o conteúdo
  if (isAuthenticated) {
    if (
      (requiredRole === 'user') || 
      (requiredRole === 'vip' && hasActiveSubscription) ||
      (requiredRole === 'admin' && isAdmin)
    ) {
      return <>{children}</>;
    }
  }

  // Não renderizar nada enquanto redireciona
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" color="amber" text="Redirecionando..." />
    </div>
  );
};

export default AuthGuard;