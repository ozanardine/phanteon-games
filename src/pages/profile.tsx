import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/components/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    
    if (user) {
      setUsername(user.username || '');
    }
  }, [isLoading, isAuthenticated, router, user]);
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ username })
        .eq('id', user.id);
        
      if (error) throw error;
      
      await refreshUser();
      
      setMessage({
        type: 'success',
        text: 'Perfil atualizado com sucesso!',
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({
        type: 'error',
        text: 'Erro ao atualizar perfil. Por favor, tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
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
    <Layout title="Meu Perfil | Phanteon Games" description="Edite seu perfil na Phanteon Games">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Meu Perfil</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Coluna do avatar */}
          <div>
            <Card>
              <CardContent className="p-6 flex flex-col items-center">
                <Avatar 
                  src={user.avatar_url || null} 
                  alt={user.username || 'User'} 
                  size="xl"
                  className="mb-4"
                />
                <h2 className="text-lg font-medium text-white mb-1">
                  {user.username || 'Usuário'}
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  {user.is_vip ? 'Membro VIP' : 'Membro'}
                </p>
                <div className="w-full mt-2">
                  <Button 
                    variant="outline" 
                    fullWidth
                    disabled={!user.discord_id}
                    className="mb-2"
                  >
                    Sincronizar com Discord
                  </Button>
                  <Button 
                    variant="outline" 
                    fullWidth
                    disabled={!user.steam_id}
                  >
                    Sincronizar com Steam
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Informações da conta */}
            <Card className="mt-4">
              <CardHeader>
                <h2 className="text-lg font-medium text-white">Informações da Conta</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Conta criada em</p>
                    <p className="text-white">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {user.is_vip && user.vip_expires_at && (
                    <div>
                      <p className="text-sm text-gray-400">VIP expira em</p>
                      <p className="text-white">
                        {new Date(user.vip_expires_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Coluna de edição */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
              </CardHeader>
              
              <CardContent>
                {message && (
                  <Alert type={message.type} className="mb-4">
                    {message.text}
                  </Alert>
                )}
                
                <form onSubmit={handleSaveProfile}>
                  <Input
                    label="Nome de usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu nome de usuário"
                    fullWidth
                    disabled={isSaving}
                  />
                  
                  <div className="mt-6">
                    <Button 
                      type="submit" 
                      disabled={isSaving}
                    >
                      {isSaving ? <Loading className="mr-2" /> : null}
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            {/* Segurança */}
            <Card className="mt-6">
              <CardHeader>
                <h2 className="text-xl font-bold text-white">Segurança</h2>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="mb-4">
                  Alterar Senha
                </Button>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Contas Vinculadas</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-phanteon-dark rounded-lg">
                      <div className="flex items-center">
                        <div className="mr-4">
                          <FaDiscord className="w-6 h-6 text-[#5865F2]" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Discord</p>
                          <p className="text-sm text-gray-400">
                            {user.discord_id ? 'Conectado' : 'Não conectado'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => user.discord_id ? null : signInWithDiscord()}
                      >
                        {user.discord_id ? 'Desconectar' : 'Conectar'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-phanteon-dark rounded-lg">
                      <div className="flex items-center">
                        <div className="mr-4">
                          <FaSteam className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Steam</p>
                          <p className="text-sm text-gray-400">
                            {user.steam_id ? 'Conectado' : 'Não conectado'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => user.steam_id ? null : signInWithSteam()}
                      >
                        {user.steam_id ? 'Desconectar' : 'Conectar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}