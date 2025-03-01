import { NextApiRequest, NextApiResponse } from 'next';
import { handleMercadoPagoWebhook } from '../../lib/payment/mercadoPagoClient';
import { verifyWebhookSignature } from '../../lib/payment/paypalClient';
import { supabase } from '../../lib/supabase/client';
import { syncDiscordVipStatus } from '../../lib/discord/discordAuth';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apenas permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Obter o provider a partir do path
    const provider = req.query.provider as string;
    
    if (!provider) {
      return res.status(400).json({ error: 'Provedor de pagamento não especificado' });
    }

    let eventData;
    let isValidWebhook = false;
    let metadata: any = {};
    let eventType = '';
    let subscriptionId = '';
    let userId = '';
    let status = '';

    // Processar webhook com base no provedor
    switch (provider) {
      case 'mercadopago':
      // Processar webhook do MercadoPago
      eventData = req.body;
      
      try {
        if (eventData.type === 'payment') {
          const paymentId = eventData.data.id;
          const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
          
          if (!mpAccessToken) {
            throw new Error('MercadoPago token not configured');
          }
          
          const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
          const paymentClient = new Payment(client);
          
          const paymentData = await paymentClient.get({ id: paymentId });
          
          // Verificar se é um pagamento para nosso app
          if (paymentData && paymentData.external_reference) {
            const externalRef = paymentData.external_reference;
            
            if (externalRef.includes(':vip:')) {
              const parts = externalRef.split(':');
              userId = parts[0];
              status = paymentData.status === 'approved' ? 'active' : paymentData.status;
              subscriptionId = paymentId; // Usar ID do pagamento como ID da assinatura
              
              isValidWebhook = true;
            }
          }
        }
      } catch (error) {
        console.error('Error processing MercadoPago webhook:', error);
        isValidWebhook = false;
      }
      break;

      case 'paypal':
        // Processar webhook do PayPal
        eventData = req.body;
        isValidWebhook = await verifyWebhookSignature(eventData, req.headers as Record<string, string>);
        
        if (isValidWebhook) {
          eventType = eventData.event_type || '';
          
          if (eventType === 'PAYMENT.SALE.COMPLETED') {
            // Pagamento concluído
            const resource = eventData.resource;
            
            // Buscar informações da transação/assinatura associada
            subscriptionId = resource.billing_agreement_id || resource.id;
            status = 'active';
            
            // Em uma implementação real, você buscaria o ID do usuário
            // a partir de custom_id ou referência externa
            userId = resource.custom || '';
          } else if (eventType === 'BILLING.SUBSCRIPTION.CREATED') {
            // Assinatura criada
            const resource = eventData.resource;
            subscriptionId = resource.id;
            status = 'active';
            userId = resource.custom_id || '';
          } else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
            // Assinatura cancelada
            const resource = eventData.resource;
            subscriptionId = resource.id;
            status = 'canceled';
            userId = resource.custom_id || '';
          }
        }
        break;

      default:
        return res.status(400).json({ error: 'Provedor de pagamento não suportado' });
    }

    // Se o webhook não puder ser validado
    if (!isValidWebhook) {
      return res.status(401).json({ error: 'Assinatura do webhook inválida' });
    }

    // Atualizar o banco de dados com base no evento recebido
    if (userId && status) {
      // Atualizar status da assinatura
      if (subscriptionId && ['active', 'canceled', 'past_due'].includes(status)) {
        // Calcular data de término (30 dias a partir de agora)
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        
        // Atualizar tabela de assinaturas
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            status,
            payment_provider_id: subscriptionId,
            current_period_start: new Date().toISOString(),
            current_period_end: endDate.toISOString(),
            created_at: new Date().toISOString()
          });

        if (subError) {
          console.error('Erro ao atualizar assinatura:', subError);
        } else {
          // Sincronizar status VIP no Discord
          await syncDiscordVipStatus(userId);
        }
      }

      // Registrar o pagamento (se for um evento de pagamento)
      if (eventType.includes('payment') || eventType.includes('PAYMENT')) {
        const { error: paymentError } = await supabase
          .from('payment_history')
          .insert({
            user_id: userId,
            status: status === 'active' ? 'succeeded' : status,
            payment_provider: provider,
            created_at: new Date().toISOString()
          });

        if (paymentError) {
          console.error('Erro ao registrar pagamento:', paymentError);
        }
      }
    }

    // Retornar resposta de sucesso
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({ error: 'Erro interno ao processar webhook' });
  }
}