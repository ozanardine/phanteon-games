// src/pages/perfil/index.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import AuthGuard from '@/components/auth/AuthGuard';
import PlayerStatsCard from '@/components/server/PlayerStatsCard';
import { FaUser, FaDiscord, FaSteam, FaCrown, FaClock, FaCalendarAlt, FaEdit, FaKey } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { formatDateBR } from '@/lib/utils/dateUtils';
import UserAvatar from '@/components/auth/UserAvatar';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, hasActiveSubscription, signInWithDiscord, signInWithSteam } = useAuth();
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcular data de expiração do VIP (se tiver)
  const vipExpirationDate = user?.subscription?.currentPeriodEnd 
    ? formatDateBR(user.subscription.currentPeriodEnd)
    : null;

  const handleConnectDiscord = async () => {
    try {
      await signInWithDiscord();
    } catch (error) {
      console.error('Error connecting Discord:', error);
      toast.error('Falha ao conectar com Discord');
    }
  };

  const handleConnectSteam = async () => {
    try {
      await signInWithSteam();
    } catch (error) {
      console.error('Error connecting Steam:', error);
      toast.error('Falha ao conectar com Steam');
    }
  };

  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    
    try {
      // Implementar atualização de perfil com Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      toast.success('Perfil atualizado com sucesso!');
      setEditMode(false);
      
      // Recarregar a página para atualizar os dados
      router.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Falha ao atualizar perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <Layout
        title="Meu Perfil - Phanteon Games"
        description="Gerencie seu perfil de jogador na Phanteon Games."
      >
        <div className="container mx-auto px-4 py-8 mt-6">
          <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna da Esquerda */}
            <div className="lg:col-span-1">
              <Card className="mb-6">
                <div className="p-6 text-center">
                  <UserAvatar user={user} size="lg" showVIPBadge className="mx-auto mb-4" />
                  
                  {editMode ? (
                    <div className="space-y-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Nome</label>
                        <input 
                          type="text" 
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Sobrenome</label>
                        <input 
                          type="text" 
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => setEditMode(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleSaveProfile}
                          isLoading={isSubmitting}
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold">
                        {user?.firstName && user?.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user?.discordUsername || user?.steamUsername || 'Jogador'
                        }
                      </h2>
                      
                      <p className="text-zinc-400 text-sm mb-4">{user?.email}</p>
                      
                      {/* Status VIP */}
                      {hasActiveSubscription ? (
                        <div className="bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-md py-2 px-3 text-sm flex items-center justify-center mb-4">
                          <FaCrown className="mr-2" />
                          <span>
                            VIP Ativo até {vipExpirationDate}
                          </span>
                        </div>
                      ) : (
                        <Button 
                          size="sm"
                          className="mb-4"
                          onClick={() => router.push('/vip')}
                        >
                          <FaCrown className="mr-2" /> Obter VIP
                        </Button>
                      )}
                      
                      <div className="flex space-x-2 justify-center">
                        <Button 
                          size="sm" 
                          variant="outline"
                          leftIcon={<FaEdit />}
                          onClick={() => setEditMode(true)}
                        >
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          leftIcon={<FaKey />}
                          onClick={() => router.push('/perfil/alterar-senha')}
                        >
                          Senha
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="border-t border-zinc-700 p-4">
                  <p className="text-sm text-zinc-400 flex items-center mb-3">
                    <FaCalendarAlt className="mr-2" />
                    Conta criada em {user?.createdAt ? formatDateBR(user.createdAt) : 'N/A'}
                  </p>
                  
                  <p className="text-sm text-zinc-400 flex items-center">
                    <FaClock className="mr-2" />
                    Último login em {formatDateBR(new Date())}
                  </p>
                </div>
              </Card>
              
              {/* Contas Conectadas */}
              <Card>
                <h3 className="text-lg font-bold px-6 py-4 border-b border-zinc-700">
                  Contas Conectadas
                </h3>
                
                <div className="p-4 space-y-4">
                  {/* Discord */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaDiscord className="text-indigo-400 mr-3 text-xl" />
                      <div>
                        <p className="font-medium">Discord</p>
                        <p className="text-sm text-zinc-400">
                          {user?.discordUsername || 'Não conectado'}
                        </p>
                      </div>
                    </div>
                    
                    {user?.discordUsername ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-indigo-500 text-indigo-400"
                        disabled
                      >
                        Conectado
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-indigo-500 hover:bg-indigo-500"
                        onClick={handleConnectDiscord}
                      >
                        Conectar
                      </Button>
                    )}
                  </div>
                  
                  {/* Steam */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaSteam className="text-blue-400 mr-3 text-xl" />
                      <div>
                        <p className="font-medium">Steam</p>
                        <p className="text-sm text-zinc-400">
                          {user?.steamUsername || 'Não conectado'}
                        </p>
                      </div>
                    </div>
                    
                    {user?.steamId ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-blue-500 text-blue-400"
                        disabled
                      >
                        Conectado
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-blue-500 hover:bg-blue-500"
                        onClick={handleConnectSteam}
                      >
                        Conectar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Coluna da Direita */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <h3 className="text-lg font-bold px-6 py-4 border-b border-zinc-700">
                  Minhas Estatísticas
                </h3>
                
                <div className="p-4">
                  {user?.steamId ? (
                    <PlayerStatsCard steamId={user.steamId} />
                  ) : (
                    <div className="text-center py-10">
                      <FaUser className="text-4xl text-zinc-600 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-zinc-400 mb-2">
                        Conta Steam não conectada
                      </h4>
                      <p className="text-zinc-500 max-w-md mx-auto mb-4">
                        Para visualizar suas estatísticas de jogo, conecte sua conta Steam clicando no botão abaixo.
                      </p>
                      <Button
                        onClick={handleConnectSteam}
                        leftIcon={<FaSteam />}
                      >
                        Conectar Steam
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
              
              {/* VIP Section */}
              {hasActiveSubscription ? (
                <Card>
                  <h3 className="text-lg font-bold px-6 py-4 border-b border-zinc-700 flex items-center">
                    <FaCrown className="text-amber-500 mr-2" />
                    Minha Assinatura VIP
                  </h3>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                        <h4 className="text-sm font-medium text-zinc-400 mb-1">Status</h4>
                        <p className="text-lg font-semibold text-green-500">Ativo</p>
                      </div>
                      
                      <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                        <h4 className="text-sm font-medium text-zinc-400 mb-1">Próxima Cobrança</h4>
                        <p className="text-lg font-semibold">{vipExpirationDate}</p>
                      </div>
                      
                      <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                        <h4 className="text-sm font-medium text-zinc-400 mb-1">Plano</h4>
                        <p className="text-lg font-semibold">VIP Mensal</p>
                      </div>
                      
                      <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                        <h4 className="text-sm font-medium text-zinc-400 mb-1">Método de Pagamento</h4>
                        <p className="text-lg font-semibold">{user?.subscription?.id ? 'Ativo' : 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => router.push('/vip/invoices')}
                      >
                        Histórico de Faturas
                      </Button>
                      
                      <Button
                        onClick={() => router.push('/vip/dashboard')}
                      >
                        Painel VIP
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="p-6 text-center">
                    <FaCrown className="text-amber-500 text-4xl mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Obtenha Mais com VIP</h3>
                    <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                      Ganhe acesso a recursos exclusivos, participe de eventos especiais e obtenha prioridade nas filas do servidor.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => router.push('/vip')}
                    >
                      Conhecer Planos VIP
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default ProfilePage;