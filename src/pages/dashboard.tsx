import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/components/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);
  
  if (isLoading) {
    return (
      <Layout title="Carregando... | Phanteon Games">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loading size="lg" />
        </div>
      </Layout>
    );
  }
  
  if (!isAuthenticated || !user) {
    return null; // Será redirecionado pelo useEffect
  }
  
  return (
    <Layout title="Dashboard | Phanteon Games" description="Painel do usuário da Phanteon Games">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Painel do Jogador</h1>
          <p className="mt-2 text-lg text-gray-300">
            Bem-vindo de volta, {user.username || 'Jogador'}!
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status do VIP */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-white">Status VIP</h2>
              </CardHeader>
              <CardContent>
                {user.is_vip ? (
                  <div>
                    <div className="p-4 bg-phanteon-dark rounded-lg mb-4">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <h3 className="text-lg font-medium text-white">VIP Ativo</h3>
                      </div>
                      <p className="text-gray-300 mb-2">
                        Seu plano VIP está ativo até:
                      </p>
                      <p className="text-xl font-bold text-phanteon-orange">
                        {new Date(user.vip_expires_at || '').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button variant="outline">
                      Renovar VIP
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-300 mb-4">
                      Você ainda não possui um plano VIP ativo.
                      Adquira agora e desfrute de benefícios exclusivos!
                    </p>
                    <Link href="/vip">
                      <Button>
                        Ver Planos VIP
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Servidores recentes */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-white">Servidores Recentes</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-phanteon-dark rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-white">Servidor Principal</h3>
                      <p className="text-sm text-gray-400">Conectado pela última vez: Ontem</p>
                    </div>
                    <Button variant="secondary" size="sm">
                      Conectar
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-phanteon-dark rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-white">Servidor PvP</h3>
                      <p className="text-sm text-gray-400">Conectado pela última vez: 3 dias atrás</p>
                    </div>
                    <Button variant="secondary" size="sm">
                      Conectar
                    </Button>
                  </div>
                  
                  <Link href="/servers" className="inline-block text-phanteon-orange hover:underline text-sm mt-2">
                    Ver todos os servidores
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Eventos próximos */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-white">Próximos Eventos</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-phanteon-dark rounded-lg">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-white">Torneio Semanal</h3>
                      <span className="text-sm text-phanteon-orange">Sábado, 20:00</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Competição com premiação especial para os vencedores
                    </p>
                  </div>
                  
                  <div className="p-4 bg-phanteon-dark rounded-lg">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-white">Abertura Novo Servidor</h3>
                      <span className="text-sm text-phanteon-orange">Sexta, 19:00</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Lançamento do novo servidor com bônus para primeiros jogadores
                    </p>
                  </div>
                  
                  <Button variant="ghost" className="w-full">
                    Ver Todos os Eventos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Coluna lateral */}
          <div className="space-y-8">
            {/* Perfil */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar 
                    src={user.avatar_url || null} 
                    alt={user.username || 'User'} 
                    size="xl"
                    className="mb-4"
                  />
                  <h2 className="text-xl font-bold text-white mb-1">
                    {user.username || 'Usuário'}
                  </h2>
                  <p className="text-gray-400 text-sm mb-4">
                    {user.is_vip ? 'Membro VIP' : 'Membro'}
                  </p>
                  <Link href="/profile">
                    <Button variant="secondary" size="sm">
                      Editar Perfil
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Links rápidos */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-white">Links Rápidos</h2>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  <Link href="/servers" className="flex items-center p-3 rounded-md hover:bg-phanteon-dark text-gray-300 hover:text-white transition">
                    <span>Servidores</span>
                  </Link>
                  <Link href="/vip" className="flex items-center p-3 rounded-md hover:bg-phanteon-dark text-gray-300 hover:text-white transition">
                    <span>Planos VIP</span>
                  </Link>
                  <Link href="/support" className="flex items-center p-3 rounded-md hover:bg-phanteon-dark text-gray-300 hover:text-white transition">
                    <span>Apoiar Comunidade</span>
                  </Link>
                  <a 
                    href="https://discord.gg/phanteongames" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center p-3 rounded-md hover:bg-phanteon-dark text-gray-300 hover:text-white transition"
                  >
                    <span>Discord</span>
                  </a>
                </nav>
              </CardContent>
            </Card>
            
            {/* Notificações */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-white">Notificações</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-md bg-phanteon-dark">
                    <p className="text-sm text-gray-300">
                      Novo servidor disponível! Venha conferir.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Há 2 horas</p>
                  </div>
                  
                  <div className="p-3 rounded-md bg-phanteon-dark">
                    <p className="text-sm text-gray-300">
                      Evento especial neste final de semana.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Há 1 dia</p>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="w-full text-sm">
                    Ver Todas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}