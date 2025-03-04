import { getServerSession } from "next-auth/react";
import { authOptions } from "../auth/[...nextauth]";
import { supabase } from '../../../lib/supabase';
import { addVipPermissions, removeVipPermissions } from '../../../lib/rust-server';
import { addVipRole, removeVipRole } from '../../../lib/discord';

export default async function handler(req, res) {
  // Apenas método PUT é permitido
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getServerSession({ req, res, authOptions });
    if (!session) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    // Apenas administradores podem atualizar assinaturas de outros usuários
    const isAdmin = session.user.isAdmin || false;
    const { subscriptionId, userId, status, planId, expiresAt } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ message: 'ID da assinatura é obrigatório' });
    }

    console.log(`[API:update] Atualizando assinatura: ${subscriptionId}, status: ${status}`);

    // Busca a assinatura atual
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError) {
      console.error('[API:update] Assinatura não encontrada:', subError);
      return res.status(404).json({ message: 'Assinatura não encontrada' });
    }

    // Buscar dados do usuário para verificar o discord_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('discord_id, steam_id')
      .eq('id', subscription.user_id)
      .single();
      
    if (userError) {
      console.error('[API:update] Erro ao buscar usuário:', userError);
      return res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
    }

    // Verifica se o usuário tem permissão para atualizar esta assinatura
    if (userData.discord_id !== session.user.discord_id && !isAdmin) {
      console.error('[API:update] Tentativa de acesso não autorizado:', session.user.discord_id);
      return res.status(403).json({ message: 'Sem permissão para atualizar esta assinatura' });
    }

    // Prepara os dados para atualização
    const updateData = {};
    
    if (status) updateData.status = status;
    if (planId) updateData.plan_id = planId;
    if (expiresAt) updateData.expires_at = expiresAt;
    
    // Atualiza o timestamp de modificação
    updateData.updated_at = new Date().toISOString();

    // Se não houver dados para atualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Nenhum dado fornecido para atualização' });
    }

    console.log('[API:update] Dados para atualização:', JSON.stringify(updateData));

    // Atualiza a assinatura
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('[API:update] Erro ao atualizar assinatura:', updateError);
      return res.status(500).json({ message: 'Erro ao atualizar assinatura' });
    }

    // Se o status mudou para 'active', adiciona permissões VIP
    if (status === 'active' && subscription.status !== 'active') {
      if (userData.steam_id) {
        try {
          console.log(`[API:update] Adicionando permissões VIP para SteamID: ${userData.steam_id}`);
          const vipAdded = await addVipPermissions(userData.steam_id);
          
          if (vipAdded) {
            console.log('[API:update] Permissões VIP adicionadas com sucesso');
            
            // Atualiza o flag na assinatura
            await supabase
              .from('subscriptions')
              .update({ rust_permission_assigned: true })
              .eq('id', subscriptionId);
          } else {
            console.error('[API:update] Falha ao adicionar permissões VIP no servidor');
          }
        } catch (serverError) {
          console.error('[API:update] Exceção ao adicionar permissões VIP:', serverError);
          // Não falha a resposta se a integração com o servidor falhar
        }
        
        // Adiciona cargo VIP no Discord
        if (userData.discord_id) {
          try {
            console.log(`[API:update] Adicionando cargo VIP para discord_id: ${userData.discord_id}`);
            const roleAdded = await addVipRole(userData.discord_id);
            
            if (roleAdded) {
              console.log('[API:update] Cargo VIP adicionado com sucesso');
              
              // Atualiza o flag na assinatura
              await supabase
                .from('subscriptions')
                .update({ discord_role_assigned: true })
                .eq('id', subscriptionId);
            } else {
              console.error('[API:update] Falha ao adicionar cargo VIP no Discord');
            }
          } catch (discordError) {
            console.error('[API:update] Exceção ao adicionar cargo Discord:', discordError);
            // Não falha a resposta se a integração com o Discord falhar
          }
        }
      }
    }
    
    // Se o status mudou para 'expired' ou 'cancelled', remove permissões VIP
    if ((status === 'expired' || status === 'cancelled') && subscription.status === 'active') {
      if (userData.steam_id) {
        try {
          console.log(`[API:update] Removendo permissões VIP para SteamID: ${userData.steam_id}`);
          const vipRemoved = await removeVipPermissions(userData.steam_id);
          
          if (vipRemoved) {
            console.log('[API:update] Permissões VIP removidas com sucesso');
            
            // Atualiza o flag na assinatura
            await supabase
              .from('subscriptions')
              .update({ rust_permission_assigned: false })
              .eq('id', subscriptionId);
          } else {
            console.error('[API:update] Falha ao remover permissões VIP no servidor');
          }
        } catch (serverError) {
          console.error('[API:update] Exceção ao remover permissões VIP:', serverError);
          // Não falha a resposta se a integração com o servidor falhar
        }
        
        // Remove cargo VIP no Discord
        if (userData.discord_id) {
          try {
            console.log(`[API:update] Removendo cargo VIP para discord_id: ${userData.discord_id}`);
            const roleRemoved = await removeVipRole(userData.discord_id);
            
            if (roleRemoved) {
              console.log('[API:update] Cargo VIP removido com sucesso');
              
              // Atualiza o flag na assinatura
              await supabase
                .from('subscriptions')
                .update({ discord_role_assigned: false })
                .eq('id', subscriptionId);
            } else {
              console.error('[API:update] Falha ao remover cargo VIP no Discord');
            }
          } catch (discordError) {
            console.error('[API:update] Exceção ao remover cargo Discord:', discordError);
            // Não falha a resposta se a integração com o Discord falhar
          }
        }
      }
    }

    return res.status(200).json({ 
      success: true,
      message: 'Assinatura atualizada com sucesso'
    });
  } catch (error) {
    console.error('[API:update] Erro ao atualizar assinatura:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      details: error.message
    });
  }
}