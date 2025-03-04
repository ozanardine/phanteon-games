import { getSession } from 'next-auth/react';
import { supabase } from '../../../lib/supabase';
import { addVipPermissions, removeVipPermissions } from '../../../lib/rust-server';

export default async function handler(req, res) {
  // Apenas método PUT é permitido
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    // Apenas administradores podem atualizar assinaturas de outros usuários
    const isAdmin = session.user.isAdmin || false;
    const { subscriptionId, userId, status, planId, expiresAt } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ message: 'ID da assinatura é obrigatório' });
    }

    // Busca a assinatura atual
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      console.error('Assinatura não encontrada:', subError);
      return res.status(404).json({ message: 'Assinatura não encontrada' });
    }

    // Verifica se o usuário tem permissão para atualizar esta assinatura
    if (subscription.user_id !== session.user.discord_id && !isAdmin) {
      return res.status(403).json({ message: 'Sem permissão para atualizar esta assinatura' });
    }

    // Prepara os dados para atualização
    const updateData = {};
    
    if (status) updateData.status = status;
    if (planId) updateData.plan_id = planId;
    if (expiresAt) updateData.expires_at = expiresAt;

    // Se não houver dados para atualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Nenhum dado fornecido para atualização' });
    }

    // Atualiza a assinatura
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Erro ao atualizar assinatura:', updateError);
      return res.status(500).json({ message: 'Erro ao atualizar assinatura' });
    }

    // Se o status mudou para 'active', adiciona permissões VIP
    if (status === 'active' && subscription.status !== 'active') {
      const { data: userData } = await supabase
        .from('users')
        .select('steam_id')
        .eq('discord_id', subscription.user_id)
        .single();

      if (userData && userData.steam_id) {
        const vipAdded = await addVipPermissions(userData.steam_id);
        if (!vipAdded) {
          console.error('Erro ao adicionar permissões VIP no servidor');
        }
      }
    }
    
    // Se o status mudou para 'expired' ou 'cancelled', remove permissões VIP
    if ((status === 'expired' || status === 'cancelled') && subscription.status === 'active') {
      const { data: userData } = await supabase
        .from('users')
        .select('steam_id')
        .eq('discord_id', subscription.user_id)
        .single();

      if (userData && userData.steam_id) {
        const vipRemoved = await removeVipPermissions(userData.steam_id);
        if (!vipRemoved) {
          console.error('Erro ao remover permissões VIP no servidor');
        }
      }
    }

    return res.status(200).json({ 
      success: true,
      message: 'Assinatura atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}