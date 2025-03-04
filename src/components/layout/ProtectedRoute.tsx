import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const isAdmin = session?.user?.isAdmin || false;

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/auth/login?redirect=${encodeURIComponent(router.pathname)}`);
      } else if (adminOnly && !isAdmin) {
        router.push('/home');
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, router, adminOnly]);

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

  if (!isAuthenticated || (adminOnly && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}