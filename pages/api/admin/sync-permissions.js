// pages/api/admin/sync-permissions.js - Sincroniza permissões entre o site e o servidor
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { supabaseAdmin } from '../../../lib/supabase';
import { logEvent } from '../../../lib/monitoring';

// URL do webhook do servidor do jogo (configurado no arquivo .env)
const GAME_SERVER_WEBHOOK_URL = process.env.RUST_SERVER_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

export default async function handler(req, res) {
  try {
    // Verificar método
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Método não permitido' });
    }

    // Verificar autenticação
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    // Verificar permissão de administrador
    if (session.user.role !== 'admin') {
      await logEvent('unauthorized_sync_attempt', { user: session.user.email });
      return res.status(403).json({ success: false, message: 'Acesso restrito a administradores' });
    }

    // Buscar usuários ativos com assinatura
    const { data: activeSubscriptions, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        user_id,
        plan_id,
        status,
        created_at,
        expires_at,
        users (
          id,
          steam_id,
          name,
          email
        )
      `)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString());

    if (subscriptionError) {
      throw new Error(`Erro ao buscar assinaturas: ${subscriptionError.message}`);
    }

    // Mapear planos para permissões no servidor
    const planToPermission = {
      '0b81cf06-ed81-49ce-8680-8f9d9edc932e': 'vip-basic', // VIP Básico
      '3994ff53-f110-4c8f-a492-ad988528006f': 'vip-plus'   // VIP Plus
    };

    // Filtrar apenas usuários com Steam ID
    const usersWithSteamId = activeSubscriptions.filter(sub => 
      sub.users && sub.users.steam_id && sub.users.steam_id.length > 0
    );

    if (usersWithSteamId.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum usuário com Steam ID encontrado para sincronizar',
        count: 0
      });
    }

    // Preparar dados para enviar ao servidor
    const permissionsPayload = {
      secret: WEBHOOK_SECRET,
      action: 'sync_permissions',
      permissions: usersWithSteamId.map(sub => ({
        steam_id: sub.users.steam_id,
        permission: planToPermission[sub.plan_id] || 'vip-basic',
        expires_at: sub.expires_at
      }))
    };

    // Enviar para o webhook do servidor
    const webhookResponse = await fetch(GAME_SERVER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(permissionsPayload)
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      throw new Error(`Erro ao sincronizar com servidor: ${webhookResponse.status} - ${errorText}`);
    }

    const webhookResult = await webhookResponse.json();

    // Registrar evento de sincronização
    await logEvent('permissions_sync', {
      count: usersWithSteamId.length,
      result: webhookResult
    });

    return res.status(200).json({
      success: true,
      message: `Permissões sincronizadas para ${usersWithSteamId.length} usuários`,
      count: usersWithSteamId.length,
      details: webhookResult
    });
  } catch (error) {
    console.error('[Admin:sync-permissions] Erro:', error);
    
    // Registrar erro no sistema de monitoramento
    await logEvent('sync_permissions_error', {
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao sincronizar permissões',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 