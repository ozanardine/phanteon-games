import { processPaymentNotification } from '../../../lib/mercadopago';
import { supabase } from '../../../lib/supabase';
import { addVipPermissions } from '../../../lib/rust-server';

export default async function handler(req, res) {
  // Apenas método POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { query } = req;
    const { topic, id } = query;

    // Processa a notificação do Mercado Pago
    const result = await processPaymentNotification(topic, id);

    if (!result.success) {
      console.error('Erro ao processar notificação:', result.message);
      return res.status(400).json({ message: result.message });
    }

    const { userId, planId, paymentId, status, amount } = result.data;

    // Busca a assinatura pendente
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (subError || !subscription) {
      console.error('Assinatura pendente não encontrada:', subError);
      return res.status(404).json({ message: 'Assinatura não encontrada' });
    }

    // Calcula a data de expiração (30 dias a partir de agora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Atualiza o status da assinatura
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        payment_id: paymentId,
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Erro ao atualizar assinatura:', updateError);
      return res.status(500).json({ message: 'Erro ao atualizar assinatura' });
    }

    // Adiciona permissões VIP no servidor Rust
    const vipAdded = await addVipPermissions(subscription.steam_id);
    
    if (!vipAdded) {
      console.error('Erro ao adicionar permissões VIP no servidor');
      // Não retornamos erro aqui para não impactar o fluxo de pagamento
      // O administrador deve verificar os logs e adicionar manualmente se necessário
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}