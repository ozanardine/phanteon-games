import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { supabase } from '@/lib/supabase';

// Esta API é usada para diagnosticar problemas de autenticação
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar autenticação
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ 
      error: 'Não autenticado',
      details: 'Esta API requer autenticação'
    });
  }
  
  // Para diagnóstico, verificamos se o usuário é admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();
  
  const isAdmin = profile?.is_admin === true;
  
  // Operações de diagnóstico e correção
  try {
    switch (req.query.action) {
      case 'diagnose':
        // Diagnóstico básico do estado de autenticação
        return res.status(200).json(await diagnosisInfo(session, isAdmin));
      
      case 'fix-discord':
        // Corrigir problemas de conexão Discord
        if (!isAdmin) {
          return res.status(403).json({ error: 'Permissão negada para esta operação' });
        }
        return res.status(200).json(await fixDiscordConnection(req.body.userId, req.body.discordId));
        
      case 'sync-profile':
        // Sincronizar perfil com dados de autenticação
        if (!isAdmin && req.body.userId !== session.user.id) {
          return res.status(403).json({ error: 'Permissão negada para esta operação' });
        }
        return res.status(200).json(await syncUserProfile(req.body.userId || session.user.id));
        
      default:
        return res.status(400).json({ error: 'Ação não especificada ou inválida' });
    }
  } catch (error: any) {
    console.error('Error in auth-utils API:', error);
    return res.status(500).json({ 
      error: 'Erro no servidor', 
      message: error.message 
    });
  }
}

// Função para gerar informações de diagnóstico
async function diagnosisInfo(session: any, isAdmin: boolean) {
  // Informações básicas da sessão (seguros para mostrar)
  const sessionInfo = {
    userId: session.user.id,
    email: session.user.email,
    isAdmin: isAdmin
  };
  
  // Se for admin, podemos mostrar mais informações
  if (isAdmin) {
    try {
      // Verificar informações do usuário no Supabase Auth
      const { data: authSession } = await supabase.auth.getSession();
      
      // Verificar conexões Discord
      const { data: discordConnections, error: discordError } = await supabase
        .from('discord_connections')
        .select('*')
        .eq('user_id', session.user.id);
      
      // Verificar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      // Retornar todas as informações para diagnóstico
      return {
        session: sessionInfo,
        authSession: authSession?.session || null,
        profile: profileError ? { error: profileError.message } : profileData,
        discordConnections: discordError ? { error: discordError.message } : discordConnections,
        diagnostics: {
          isSessionValid: !!session,
          isProfileFound: !profileError && !!profileData,
          isSupabaseSessionValid: !!authSession?.session,
          discordConnectionCount: discordConnections?.length || 0
        }
      };
    } catch (error: any) {
      return {
        session: sessionInfo,
        error: error.message,
        diagnostics: {
          isSessionValid: !!session,
          error: 'Erro ao gerar diagnóstico completo'
        }
      };
    }
  }
  
  // Para usuários não-admin, apenas informações básicas
  return {
    session: sessionInfo,
    diagnostics: {
      isSessionValid: !!session,
      hasAdminAccess: isAdmin
    }
  };
}

// Função para corrigir problemas de conexão Discord
async function fixDiscordConnection(userId: string, discordId: string) {
  if (!userId || !discordId) {
    return { 
      success: false, 
      error: 'Parâmetros incompletos (userId e discordId são obrigatórios)' 
    };
  }
  
  try {
    // Verificar se o usuário existe
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      return { 
        success: false, 
        error: 'Usuário não encontrado' + (userError ? `: ${userError.message}` : '') 
      };
    }
    
    // Buscar conexão Discord existente
    const { data: existingConnection } = await supabase
      .from('discord_connections')
      .select('*')
      .eq('discord_user_id', discordId)
      .single();
    
    // Se conexão já existe e está vinculada a outro usuário, precisamos corrigir
    if (existingConnection && existingConnection.user_id !== userId) {
      // Registrar operação para auditoria
      await supabase
        .from('auth_logs')
        .insert({
          user_id: userId,
          action: 'discord_connection_reassigned',
          success: true,
          details: {
            from_user_id: existingConnection.user_id,
            to_user_id: userId,
            discord_id: discordId
          }
        });
      
      // Atualizar conexão existente
      await supabase
        .from('discord_connections')
        .update({
          user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('discord_user_id', discordId);
      
      return { 
        success: true, 
        message: 'Conexão Discord reatribuída com sucesso',
        details: {
          previousUserId: existingConnection.user_id,
          currentUserId: userId
        }
      };
    }
    
    // Se não existe, criar nova conexão
    if (!existingConnection) {
      await supabase
        .from('discord_connections')
        .insert({
          user_id: userId,
          discord_user_id: discordId,
          discord_username: 'Unknown (Added manually)',
          updated_at: new Date().toISOString()
        });
      
      return { 
        success: true, 
        message: 'Nova conexão Discord criada manualmente' 
      };
    }
    
    // Se a conexão já existe e está correta
    return { 
      success: true, 
      message: 'Conexão Discord já estava correta' 
    };
  } catch (error: any) {
    console.error('Error fixing Discord connection:', error);
    return { 
      success: false, 
      error: `Erro ao corrigir conexão: ${error.message}` 
    };
  }
}

// Função para sincronizar perfil com dados de autenticação
async function syncUserProfile(userId: string) {
  if (!userId) {
    return { 
      success: false, 
      error: 'ID de usuário não fornecido' 
    };
  }
  
  try {
    // Buscar dados de autenticação 
    const { data: authSession } = await supabase.auth.getSession();
    
    if (!authSession?.session) {
      return { 
        success: false, 
        error: 'Nenhuma sessão de autenticação ativa encontrada' 
      };
    }
    
    // Verificar se o perfil existe
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!existingProfile) {
      return {
        success: false,
        error: 'Perfil não encontrado. Use a função do sistema para criar novos perfis.'
      };
    }
    
    // Se existe, atualizar com dados básicos
    await supabase
      .from('profiles')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    return { 
      success: true, 
      message: 'Perfil atualizado com sucesso' 
    };
  } catch (error: any) {
    console.error('Error syncing user profile:', error);
    return { 
      success: false, 
      error: `Erro ao sincronizar perfil: ${error.message}` 
    };
  }
}