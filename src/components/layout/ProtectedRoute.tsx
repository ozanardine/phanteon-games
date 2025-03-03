// src/components/layout/ProtectedRoute.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(`/auth/login?redirect=${encodeURIComponent(router.pathname)}`);
      } else if (adminOnly && !isAdmin) {
        router.push('/home');
      }
    }
  }, [user, isLoading, isAdmin, router, adminOnly]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-phanteon-dark">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-phanteon-orange border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || (adminOnly && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}