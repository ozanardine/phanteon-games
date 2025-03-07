import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Aceita apenas método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificação de autenticação
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    // Garantir que o Discord ID seja uma string
    const discordIdString = session.user.discord_id.toString();
    
    const { subscriptionId, status, paymentId, expiresAt } = req.body;

    // Validação de parâmetros
    if (!subscriptionId || !status) {
      return res.status(400).json({ message: 'Dados incompletos para atualizar assinatura' });
    }

    console.log(`[API:update] Atualizando assinatura ${subscriptionId} para ${status}`);
    console.log(`[API:update] Usuário logado: ${discordIdString}`);

    // Buscar usuário no Supabase pelo discord_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('discord_id', discordIdString)
      .maybeSingle();

    if (userError) {
      console.error('[API:update] Erro ao buscar usuário:', userError);
      return res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
    }

    if (!userData) {
      console.error('[API:update] Usuário não encontrado, discord_id:', discordIdString);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Buscar a assinatura para verificar se pertence ao usuário
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .maybeSingle();

    if (subError) {
      console.error('[API:update] Erro ao buscar assinatura:', subError);
      return res.status(500).json({ message: 'Erro ao buscar assinatura' });
    }

    if (!subscriptionData) {
      console.error('[API:update] Assinatura não encontrada:', subscriptionId);
      return res.status(404).json({ message: 'Assinatura não encontrada' });
    }

    // Verificar se a assinatura pertence ao usuário logado
    if (subscriptionData.user_id !== userData.id) {
      console.error('[API:update] Tentativa de atualizar assinatura de outro usuário');
      return res.status(403).json({ message: 'Você não tem permissão para atualizar esta assinatura' });
    }

    // Criar objeto com os dados a serem atualizados
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Adicionar campos opcionais se fornecidos
    if (paymentId) updateData.payment_id = paymentId;
    if (expiresAt) updateData.expires_at = expiresAt;

    // Atualizar a assinatura
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      console.error('[API:update] Erro ao atualizar assinatura:', updateError);
      return res.status(500).json({ message: 'Erro ao atualizar assinatura' });
    }

    console.log(`[API:update] Assinatura ${subscriptionId} atualizada com sucesso para ${status}`);

    return res.status(200).json({
      success: true,
      subscription: updatedSubscription
    });
  } catch (error) {
    console.error('[API:update] Erro no servidor:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      details: error.message
    });
  }
}