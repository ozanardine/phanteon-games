// pages/api/scheduled/sync-permissions.js - Job agendado para sincronizar permissões automaticamente
import { supabaseAdmin } from '../../../lib/supabase';
import { logEvent } from '../../../lib/monitoring';

// URL do webhook do servidor do jogo (configurado no arquivo .env)
const GAME_SERVER_WEBHOOK_URL = process.env.RUST_SERVER_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const CRON_API_KEY = process.env.CRON_API_KEY;

export default async function handler(req, res) {
  try {
    // Verificar método
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Método não permitido' });
    }

    // Verificar autenticação para jobs agendados
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== CRON_API_KEY) {
      // Adicionar delay para prevenir ataques de força bruta
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(401).json({ success: false, message: 'Não autorizado' });
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
      // Nada para sincronizar
      await logEvent('scheduled_sync_empty', {
        message: 'Nenhum usuário para sincronizar',
        timestamp: new Date().toISOString()
      });
      
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

    // Verificar se o webhook está configurado
    if (!GAME_SERVER_WEBHOOK_URL) {
      await logEvent('scheduled_sync_config_error', {
        message: 'RUST_SERVER_WEBHOOK_URL não configurado',
        timestamp: new Date().toISOString()
      });
      
      return res.status(500).json({
        success: false,
        message: 'URL do webhook do servidor não configurada',
        error: 'RUST_SERVER_WEBHOOK_URL not set'
      });
    }

    // Enviar para o webhook do servidor
    const webhookResponse = await fetch(GAME_SERVER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(permissionsPayload),
      // Adicionar timeout para evitar bloqueio
      timeout: 10000
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      throw new Error(`Erro ao sincronizar com servidor: ${webhookResponse.status} - ${errorText}`);
    }

    const webhookResult = await webhookResponse.json();

    // Registrar evento de sincronização
    await logEvent('scheduled_permissions_sync', {
      count: usersWithSteamId.length,
      result: webhookResult,
      timestamp: new Date().toISOString()
    });

    // Atualizar o último horário de sincronização no status do sistema
    await supabaseAdmin
      .from('system_status')
      .upsert([
        {
          id: 'permissions_sync',
          status: 'success',
          details: {
            count: usersWithSteamId.length,
            last_sync: new Date().toISOString()
          },
          last_check: new Date().toISOString()
        }
      ]);

    return res.status(200).json({
      success: true,
      message: `Permissões sincronizadas automaticamente para ${usersWithSteamId.length} usuários`,
      count: usersWithSteamId.length
    });
  } catch (error) {
    console.error('[Scheduled:sync-permissions] Erro:', error);
    
    // Registrar erro no sistema de monitoramento
    await logEvent('scheduled_sync_error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Atualizar status de erro no sistema
    await supabaseAdmin
      .from('system_status')
      .upsert([
        {
          id: 'permissions_sync',
          status: 'error',
          details: {
            error: error.message,
            last_error: new Date().toISOString()
          },
          last_check: new Date().toISOString()
        }
      ]);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao sincronizar permissões automaticamente',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
} 