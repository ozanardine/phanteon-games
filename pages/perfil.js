// pages/perfil.js
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import { TabSelector } from '../components/ui/TabSelector';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  FaCrown, FaUser, FaServer, FaGift
} from 'react-icons/fa';
import { getUserByDiscordId, getUserSubscription, supabase } from '../lib/supabase';
import { requireAuth, syncUserData } from '../lib/auth';
import TabContent from '../components/profile/TabContent';
import SteamIdModal from '../components/profile/SteamIdModal';
import { validateSteamId } from '../components/profile/utils';

// ==========================================
// COMPONENTE PRINCIPAL - Refatorado com otimizações
// ==========================================

export default function PerfilPage({ userData, subscriptionData, subscriptionHistory = [], serverData, errorMessage, newUser }) {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Estado para gerenciamento de tabs
  const [activeTab, setActiveTab] = useState('profile');
  
  // Estados para gerenciamento do SteamID
  const [steamId, setSteamId] = useState(userData?.steam_id || '');
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(newUser === true || !userData?.steam_id);

  // Definição das tabs
  const tabs = [
    { id: 'profile', label: 'Meu Perfil', icon: <FaUser /> },
    { id: 'vip', label: 'Assinatura VIP', icon: <FaCrown /> },
    { id: 'server', label: 'Estatísticas do Servidor', icon: <FaServer /> },
    { id: 'rewards', label: 'Recompensas Diárias', icon: <FaGift /> },
  ];

  // Effect para exibir mensagens de erro
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  // Effect para inicializar a tab ativa com base na URL
  useEffect(() => {
    // Verificar se há um parâmetro 'tab' na URL
    const { tab } = router.query;
    
    // Se existir e for uma tab válida, definir como ativa
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [router.query]);

  // Effect para atualizar a URL quando a tab mudar
  useEffect(() => {
    // Atualizar a URL sem recarregar a página
    router.push(`/perfil?tab=${activeTab}`, undefined, { shallow: true });
  }, [activeTab]);
  
  // Effect para gerenciar o estado do SteamID e o modal
  useEffect(() => {
    if (userData?.steam_id) {
      setSteamId(userData.steam_id);
    }
  
    // Gerenciar abertura do modal apenas se o componente estiver montado
    const shouldOpenModal = newUser === true || !userData?.steam_id;
    if (shouldOpenModal) {
      setIsEditModalOpen(true);
    }
  }, [userData, newUser]);

  // Handler para salvar o SteamID
  const handleSaveSteamId = useCallback(async () => {
    if (!steamId) {
      toast.error('Por favor, insira seu Steam ID');
      return;
    }
  
    if (!validateSteamId(steamId)) {
      toast.error('Steam ID inválido. Deve conter 17 dígitos numéricos');
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch('/api/user/update-steam-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ steamId }),
      });
  
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Erro (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Steam ID atualizado com sucesso!');
        setIsEditModalOpen(false);
        
        // Usar router.replace em vez de recarregar a página completamente
        router.replace(router.asPath);
      } else {
        throw new Error(data.message || 'Falha ao atualizar Steam ID');
      }
    } catch (error) {
      console.error('Erro ao atualizar Steam ID:', error);
      toast.error(error.message || 'Erro ao atualizar Steam ID');
    } finally {
      setLoading(false);
    }
  }, [steamId, router]);

  // Handler para renovação de assinatura
  const handleRenewSubscription = useCallback(() => {
    if (subscriptionData?.plan_id) {
      router.push(`/checkout/${subscriptionData.plan_id}`);
    } else {
      router.push('/planos');
    }
  }, [subscriptionData, router]);

  // Handler para upgrade de plano
  const handleUpgradeSubscription = useCallback(() => {
    // Se o plano atual é o básico, direcionar para o plus
    if (subscriptionData?.plan_id === '0b81cf06-ed81-49ce-8680-8f9d9edc932e') {
      router.push('/checkout/vip-plus');
    } else {
      // Se for outro plano, direcionar para a página geral de planos
      router.push('/planos');
    }
  }, [subscriptionData, router]);

  // Handlers para o modal de edição do SteamID
  const handleCloseEditModal = useCallback(() => {
    if (userData?.steam_id) {
      setIsEditModalOpen(false);
    } else {
      toast.info('É necessário configurar seu Steam ID para acessar todas as funcionalidades do site.');
    }
  }, [userData]);

  const handleOpenEditModal = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  return (
    <>
      <Head>
        <title>Meu Perfil | Phanteon Games</title>
      </Head>

      <div className="container-custom mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-white mb-2">Meu Perfil</h1>
        <p className="text-gray-400 mb-8">
          Gerencie suas informações, assinaturas VIP e acompanhe seu progresso nos servidores
        </p>
        
        {/* Seletor de Tabs */}
        <div className="mb-8">
          <TabSelector 
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
        
        {/* Conteúdo das Tabs */}
        <TabContent 
          activeTab={activeTab}
          userData={userData}
          session={session}
          subscriptionData={subscriptionData}
          serverData={serverData}
          onEditSteamId={handleOpenEditModal}
          onRenewSubscription={handleRenewSubscription}
          onUpgradeSubscription={handleUpgradeSubscription}
          subscriptionHistory={subscriptionHistory}
        />
      </div>

      {/* Modal de Edição do SteamID */}
      <SteamIdModal 
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        steamId={steamId}
        setSteamId={setSteamId}
        onSave={handleSaveSteamId}
        loading={loading}
        isNewUser={newUser}
      />
    </>
  );
}

// Busca de dados no servidor
export async function getServerSideProps(context) {
  // Verificar autenticação do usuário
  const authResult = await requireAuth(context);
  
  // Redirecionar se o usuário não estiver autenticado
  if (authResult.redirect) {
    console.log('[Perfil] Redirecionando usuário não autenticado');
    return authResult;
  }
  
  const session = authResult.props.session;
  
  if (!session?.user?.discord_id) {
    console.error('[Perfil] Sessão sem discord_id!', { session });
    return {
      redirect: {
        destination: '/api/auth/signin?error=missing_discord_id',
        permanent: false,
      },
    };
  }
  
  try {
    const discordId = session.user.discord_id.toString();
    
    console.log('[Perfil] Buscando perfil para discord_id:', discordId);
    
    // Obter dados do usuário via função auxiliar
    const userData = await getUserByDiscordId(discordId);
    
    if (!userData) {
      console.error('[Perfil] Usuário não encontrado no banco de dados');
      
      // Tentar sincronizar dados novamente
      const syncResult = await syncUserData({
        id: discordId,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image
      });
      
      if (!syncResult) {
        console.error('[Perfil] Falha ao sincronizar dados do usuário');
        
        // Em vez de mostrar um erro, retornar dados parciais
        return {
          props: {
            // Criar um objeto userData parcial com dados da sessão
            userData: {
              discord_id: discordId,
              name: session.user.name,
              email: session.user.email,
              discord_avatar: session.user.image,
              steam_id: null // Explicitamente nulo para indicar necessidade de configuração
            },
            subscriptionData: null,
            subscriptionHistory: [],
            newUser: true // Adicionar flag para indicar usuário novo
          },
        };
      }
      
      // Buscar novamente após sincronização
      const syncedUserData = await getUserByDiscordId(discordId);
      
      if (!syncedUserData) {
        console.error('[Perfil] Usuário ainda não encontrado após sincronização');
        
        // Mesmo tratamento que acima
        return {
          props: {
            userData: {
              discord_id: discordId,
              name: session.user.name,
              email: session.user.email,
              discord_avatar: session.user.image,
              steam_id: null
            },
            subscriptionData: null,
            subscriptionHistory: [],
            newUser: true
          },
        };
      }
      
      console.log('[Perfil] Usuário sincronizado com sucesso:', syncedUserData.id);
      
      // Buscar dados de assinatura ativa usando o UUID correto
      const subscriptionData = await getUserSubscription(syncedUserData.id);
      
      // Buscar histórico de assinaturas
      const { data: subscriptionHistory, error: historyError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', syncedUserData.id)
        .order('created_at', { ascending: false });
      
      if (historyError) {
        console.error('[Perfil] Erro ao buscar histórico de assinaturas:', historyError);
      }
      
      // Processar dados para garantir serialização
      const processedSubscription = subscriptionData ? {
        ...subscriptionData,
        created_at: subscriptionData.created_at ? new Date(subscriptionData.created_at).toISOString() : null,
        updated_at: subscriptionData.updated_at ? new Date(subscriptionData.updated_at).toISOString() : null,
        expires_at: subscriptionData.expires_at ? new Date(subscriptionData.expires_at).toISOString() : null
      } : null;
      
      // Processar histórico para garantir serialização
      const processedHistory = subscriptionHistory ? subscriptionHistory.map(sub => ({
        ...sub,
        created_at: sub.created_at ? new Date(sub.created_at).toISOString() : null,
        updated_at: sub.updated_at ? new Date(sub.updated_at).toISOString() : null,
        expires_at: sub.expires_at ? new Date(sub.expires_at).toISOString() : null
      })) : [];
      
      return {
        props: {
          userData: syncedUserData || null,
          subscriptionData: processedSubscription,
          subscriptionHistory: processedHistory,
        },
      };
    }
    
    console.log('[Perfil] Usuário encontrado, id:', userData.id);
    
    // Buscar dados de assinatura ativa usando o UUID correto
    const subscriptionData = await getUserSubscription(userData.id);
    
    // Buscar histórico de assinaturas
    const { data: subscriptionHistory, error: historyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });
    
    if (historyError) {
      console.error('[Perfil] Erro ao buscar histórico de assinaturas:', historyError);
    }
    
    // Processar dados para garantir serialização
    const processedSubscription = subscriptionData ? {
      ...subscriptionData,
      created_at: subscriptionData.created_at ? new Date(subscriptionData.created_at).toISOString() : null,
      updated_at: subscriptionData.updated_at ? new Date(subscriptionData.updated_at).toISOString() : null,
      expires_at: subscriptionData.expires_at ? new Date(subscriptionData.expires_at).toISOString() : null
    } : null;
    
    // Processar histórico para garantir serialização
    const processedHistory = subscriptionHistory ? subscriptionHistory.map(sub => ({
      ...sub,
      created_at: sub.created_at ? new Date(sub.created_at).toISOString() : null,
      updated_at: sub.updated_at ? new Date(sub.updated_at).toISOString() : null,
      expires_at: sub.expires_at ? new Date(sub.expires_at).toISOString() : null
    })) : [];
    
    return {
      props: {
        userData,
        subscriptionData: processedSubscription,
        subscriptionHistory: processedHistory,
      },
    };
  } catch (error) {
    console.error('[Perfil] Erro ao buscar dados do usuário:', error);
    
    return {
      props: {
        userData: null,
        subscriptionData: null,
        subscriptionHistory: [],
        errorMessage: 'Erro ao carregar dados do perfil. Tente novamente mais tarde.'
      },
    };
  }
}