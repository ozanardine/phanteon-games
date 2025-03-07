import { supabase } from '../../../lib/supabase';
import { removeVipPermissions } from '../../../lib/rust-server';
import { removeVipRole } from '../../../lib/discord';

// Este endpoint deve ser chamado periodicamente por um serviço externo como Vercel Cron Jobs
// para verificar assinaturas expiradas e remover permissões automaticamente

export default async function handler(req, res) {
  // Verifica token secreto para proteção do endpoint
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1] || '';
  
  if (token !== process.env.ADMIN_CRON_SECRET) {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  try {
    console.log('[Admin:checkExpired] Iniciando verificação de assinaturas expiradas');
    
    // Busca assinaturas que expiraram mas ainda estão com status ativo
    const { data: expiredSubscriptions, error } = await supabase
      .from('subscriptions')
      .select('*, users!inner(discord_id, steam_id)')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('[Admin:checkExpired] Erro ao buscar assinaturas expiradas:', error);
      return res.status(500).json({ message: 'Erro ao buscar assinaturas' });
    }

    console.log(`[Admin:checkExpired] Encontradas ${expiredSubscriptions.length} assinaturas expiradas para processar`);

    // Processa cada assinatura expirada
    const results = [];
    for (const subscription of expiredSubscriptions) {
      const { id, users } = subscription;
      console.log(`[Admin:checkExpired] Processando assinatura: ${id}`);
      
      try {
        // Atualiza status para expirado
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString() 
          })
          .eq('id', id);

        if (updateError) {
          console.error(`[Admin:checkExpired] Erro ao atualizar assinatura ${id}:`, updateError);
          results.push({ id, success: false, message: 'Erro ao atualizar status' });
          continue;
        }

        // Remove permissões no servidor Rust se houver SteamID
        if (users?.steam_id) {
          try {
            console.log(`[Admin:checkExpired] Removendo permissões VIP para SteamID: ${users.steam_id}`);
            const rustResult = await removeVipPermissions(users.steam_id);
            
            if (rustResult) {
              // Atualiza flag de permissão no servidor
              await supabase
                .from('subscriptions')
                .update({ rust_permission_assigned: false })
                .eq('id', id);
            } else {
              console.log(`[Admin:checkExpired] Falha ao remover permissões no servidor para ${users.steam_id}`);
            }
          } catch (rustError) {
            console.error(`[Admin:checkExpired] Erro ao remover permissões Rust:`, rustError);
          }
        }

        // Remove cargo no Discord se houver Discord ID
        if (users?.discord_id) {
          try {
            console.log(`[Admin:checkExpired] Removendo cargo VIP para Discord ID: ${users.discord_id}`);
            const discordResult = await removeVipRole(users.discord_id);
            
            if (discordResult) {
              // Atualiza flag de cargo no Discord
              await supabase
                .from('subscriptions')
                .update({ discord_role_assigned: false })
                .eq('id', id);
            } else {
              console.log(`[Admin:checkExpired] Falha ao remover cargo Discord para ${users.discord_id}`);
            }
          } catch (discordError) {
            console.error(`[Admin:checkExpired] Erro ao remover cargo Discord:`, discordError);
          }
        }

        results.push({ id, success: true });
      } catch (processError) {
        console.error(`[Admin:checkExpired] Erro ao processar assinatura ${id}:`, processError);
        results.push({ id, success: false, message: processError.message });
      }
    }

    return res.status(200).json({ 
      success: true, 
      processed: expiredSubscriptions.length,
      results 
    });
  } catch (error) {
    console.error('[Admin:checkExpired] Erro não tratado:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      details: error.message 
    });
  }
}