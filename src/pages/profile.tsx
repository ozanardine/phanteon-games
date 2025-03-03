// src/pages/profile.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiUser, FiMail, FiEdit2, FiKey, FiSave, FiCheck, FiX, FiLink, FiUnlink } from 'react-icons/fi';
import { FaDiscord, FaSteam } from 'react-icons/fa';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { FormControl } from '@/components/ui/FormControl';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, updatePassword } from '@/lib/supabase';
import { checkDiscordConnection, initiateDiscordAuth, unlinkDiscord } from '@/lib/discord';
import { getCurrentSubscription } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    display_name: '',
    bio: '',
    steam_id: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [discordConnected, setDiscordConnected] = useState(false);
  const [discordUsername, setDiscordUsername] = useState('');
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { discord, error: urlError } = router.query;

  // Carregar dados iniciais
  useEffect(() => {
    if (profile) {
      setProfileData({
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        steam_id: profile.steam_id || '',
      });
    }
  }, [profile]);

  // Verificar parâmetros da URL
  useEffect(() => {
    if (discord === 'success') {
      // Atualizar status do Discord
      checkDiscordStatus();
    }
    
    if (urlError) {
      setError(decodeURIComponent(urlError as string));
    }
  }, [discord, urlError]);

  // Carregar dados do Discord e assinatura
  useEffect(() => {
    if (user) {
      checkDiscordStatus();
      loadSubscription();
    }
  }, [user]);

  const checkDiscordStatus = async () => {
    try {
      const { connected, username, error } = await checkDiscordConnection();
      
      if (error) {
        console.error('Error checking Discord connection:', error);
      } else {
        setDiscordConnected(connected);
        if (connected && username) {
          setDiscordUsername(username);
        }
      }
    } catch (error) {
      console.error('Error in checkDiscordStatus:', error);
    }
  };

  const loadSubscription = async () => {
    try {
      const { subscription, error } = await getCurrentSubscription();
      
      if (error) {
        console.error('Error loading subscription:', error);
      } else {
        setCurrentSubscription(subscription);
      }
    } catch (error) {
      console.error('Error in loadSubscription:', error);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    if (!profile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await updateProfile({
        username: profileData.username,
        display_name: profileData.display_name,
        bio: profileData.bio,
        steam_id: profileData.steam_id,
      });
      
      if (error) {
        throw error;
      }
      
      await refreshProfile();
      setEditMode(false);
      setProfileUpdated(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setProfileUpdated(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!user) return;
    
    // Validate passwords
    if (passwordData.newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await updatePassword(passwordData.newPassword);
      
      if (error) {
        throw error;
      }
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setPasswordUpdated(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setPasswordUpdated(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error changing password:', error);
      setError(error.message || 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  const connectDiscordAccount = () => {
    initiateDiscordAuth();
  };

  const disconnectDiscordAccount = async () => {
    if (!window.confirm('Tem certeza que deseja desvincular sua conta do Discord? Isso removerá seu cargo VIP no servidor.')) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { success, error } = await unlinkDiscord();
      
      if (error) {
        throw error;
      }
      
      if (success) {
        setDiscordConnected(false);
        setDiscordUsername('');
      }
    } catch (error: any) {
      console.error('Error unlinking Discord:', error);
      setError(error.message || 'Erro ao desvincular conta do Discord.');
    } finally {
      setLoading(false);
    }
  };

  const ProfileTab = () => (
    <div>
      {profileUpdated && (
        <Alert variant="success" className="mb-6">
          Perfil atualizado com sucesso!
        </Alert>
      )}
      
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Informações do Perfil</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className="flex items-center"
            >
              {editMode ? (
                <>
                  <FiX className="mr-2" /> Cancelar
                </>
              ) : (
                <>
                  <FiEdit2 className="mr-2" /> Editar
                </>
              )}
            </Button>
          </div>
          
          <div className="space-y-6">
            {!editMode ? (
              <>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-phanteon-light flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username || 'Avatar'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <FiUser className="text-2xl" />
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">
                      {profile?.display_name || profile?.username || 'Usuário'}
                    </h3>
                    <p className="text-gray-400">{user?.email}</p>
                  </div>
                </div>
                
                {currentSubscription && (
                  <div className="bg-phanteon-light/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge variant="primary" className="mr-2">
                          {currentSubscription.plan?.name || 'VIP'}
                        </Badge>
                        <span className="text-sm text-gray-300">
                          até {new Date(currentSubscription.end_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push('/vip')}
                      >
                        Gerenciar
                      </Button>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Nome de usuário</p>
                  <p>{profileData.username || 'Não definido'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Nome de exibição</p>
                  <p>{profileData.display_name || 'Não definido'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Biografia</p>
                  <p className="whitespace-pre-line">{profileData.bio || 'Não definida'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Steam ID</p>
                  <p>{profileData.steam_id || 'Não definido'}</p>
                </div>
              </>
            ) : (
              <>
                <FormControl
                  label="Nome de usuário"
                  htmlFor="username"
                >
                  <Input
                    id="username"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    placeholder="Seu nome de usuário"
                    icon={<FiUser />}
                    fullWidth
                  />
                </FormControl>
                
                <FormControl
                  label="Nome de exibição"
                  htmlFor="display_name"
                >
                  <Input
                    id="display_name"
                    name="display_name"
                    value={profileData.display_name}
                    onChange={handleProfileChange}
                    placeholder="Seu nome de exibição"
                    icon={<FiUser />}
                    fullWidth
                  />
                </FormControl>
                
                <FormControl
                  label="Biografia"
                  htmlFor="bio"
                >
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    placeholder="Conte um pouco sobre você"
                    className="bg-phanteon-dark border border-phanteon-light text-white text-sm rounded-lg focus:ring-phanteon-orange focus:border-phanteon-orange block p-2.5 w-full h-24"
                  />
                </FormControl>
                
                <FormControl
                  label="Steam ID"
                  htmlFor="steam_id"
                >
                  <Input
                    id="steam_id"
                    name="steam_id"
                    value={profileData.steam_id}
                    onChange={handleProfileChange}
                    placeholder="Seu Steam ID"
                    icon={<FaSteam />}
                    fullWidth
                  />
                </FormControl>
                
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={saveProfile}
                    isLoading={loading}
                    className="flex items-center"
                  >
                    <FiSave className="mr-2" /> Salvar Alterações
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );

  const SecurityTab = () => (
    <div>
      {passwordUpdated && (
        <Alert variant="success" className="mb-6">
          Senha alterada com sucesso!
        </Alert>
      )}
      
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Alterar Senha</h2>
          
          <div className="space-y-6">
            <FormControl
              label="Senha Atual"
              htmlFor="currentPassword"
            >
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showPassword.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Digite sua senha atual"
                  icon={<FiKey />}
                  fullWidth
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPassword.current ? <FiX /> : <FiCheck />}
                </button>
              </div>
            </FormControl>
            
            <FormControl
              label="Nova Senha"
              htmlFor="newPassword"
            >
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Digite sua nova senha"
                  icon={<FiKey />}
                  fullWidth
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPassword.new ? <FiX /> : <FiCheck />}
                </button>
              </div>
            </FormControl>
            
            <FormControl
              label="Confirmar Nova Senha"
              htmlFor="confirmPassword"
            >
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirme sua nova senha"
                  icon={<FiKey />}
                  fullWidth
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPassword.confirm ? <FiX /> : <FiCheck />}
                </button>
              </div>
            </FormControl>
            
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={changePassword}
                isLoading={loading}
              >
                Alterar Senha
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const ConnectionsTab = () => (
    <div className="space-y-6">
      {/* Discord Connection */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <FaDiscord className="text-[#5865F2] text-2xl mr-3" />
              <h2 className="text-xl font-bold">Discord</h2>
            </div>
            
            {discordConnected ? (
              <Badge variant="success">Conectado</Badge>
            ) : (
              <Badge variant="secondary">Desconectado</Badge>
            )}
          </div>
          
          {discordConnected ? (
            <div>
              <div className="bg-phanteon-light/20 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="font-medium">{discordUsername}</p>
                    <p className="text-sm text-gray-400">
                      Conta conectada com sucesso
                    </p>
                  </div>
                  {currentSubscription && (
                    <Badge 
                      variant="primary" 
                      className={currentSubscription.plan?.name?.includes('Gold') ? 'bg-yellow-600' : ''}
                    >
                      {currentSubscription.plan?.name || 'VIP'}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={disconnectDiscordAccount}
                  isLoading={loading}
                  className="text-red-400 hover:text-red-300"
                >
                  <FiUnlink className="mr-2" /> Desvincular
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-300 mb-6">
                Conecte sua conta do Discord para receber automaticamente seu cargo VIP e acessar canais exclusivos.
              </p>
              
              <Button
                variant="outline"
                onClick={connectDiscordAccount}
                isLoading={loading}
                className="bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border-[#5865F2]/30"
              >
                <FiLink className="mr-2" /> Conectar Discord
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      {/* Steam Connection - Placeholder */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <FaSteam className="text-[#1b2838] text-2xl mr-3" />
              <h2 className="text-xl font-bold">Steam</h2>
            </div>
            
            <Badge variant="secondary">Em breve</Badge>
          </div>
          
          <p className="text-gray-300 mb-6">
            Em breve você poderá conectar sua conta Steam para uma experiência mais integrada.
          </p>
          
          <Button
            variant="outline"
            disabled
            className="opacity-50 cursor-not-allowed"
          >
            <FiLink className="mr-2" /> Conectar Steam
          </Button>
        </div>
      </Card>
    </div>
  );

  const tabs: TabItem[] = [
    {
      id: 'profile',
      label: 'Perfil',
      content: <ProfileTab />,
    },
    {
      id: 'security',
      label: 'Segurança',
      content: <SecurityTab />,
    },
    {
      id: 'connections',
      label: 'Conexões',
      content: <ConnectionsTab />,
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout
        title="Meu Perfil"
        description="Gerencie seu perfil, segurança e conexões."
      >
        <div className="bg-phanteon-dark min-h-screen py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-10">
              <span className="text-phanteon-orange">Meu</span> Perfil
            </h1>
            
            {error && (
              <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            {discord === 'success' && !error && (
              <Alert variant="success" className="mb-6">
                Conta Discord conectada com sucesso!
              </Alert>
            )}
            
            <Tabs tabs={tabs} defaultTab="profile" />
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}