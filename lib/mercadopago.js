import mercadopago from 'mercadopago';

// Inicializa o SDK do Mercado Pago apenas no lado do servidor
let mp;
if (typeof window === 'undefined') {
  try {
    mp = mercadopago;
    mp.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
    });
  } catch (error) {
    console.error('Error configuring Mercado Pago:', error);
  }
}

/**
 * Cria uma preferência de pagamento no Mercado Pago
 * @param {Object} paymentData - Dados para criar a preferência
 * @returns {Promise<Object>} - Preferência criada
 */
export async function createPaymentPreference(paymentData) {
  const { title, price, quantity, userId, planId, successUrl, failureUrl } = paymentData;
  
  try {
    const preference = {
      items: [
        {
          title,
          unit_price: Number(price),
          quantity: Number(quantity || 1),
        },
      ],
      external_reference: `${userId}|${planId}`,
      back_urls: {
        success: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/perfil`,
        failure: failureUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/planos`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/mercadopago`,
    };

    const response = await mp.preferences.create(preference);
    return response.body;
  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error);
    throw new Error('Falha ao processar pagamento');
  }
}

/**
 * Verifica o status de um pagamento
 * @param {string} paymentId - ID do pagamento no Mercado Pago
 * @returns {Promise<Object>} - Dados do pagamento
 */
export async function getPaymentStatus(paymentId) {
  try {
    const response = await mp.payment.get(paymentId);
    return response.body;
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    throw new Error('Falha ao verificar pagamento');
  }
}

/**
 * Processa uma notificação de pagamento
 * @param {string} topic - Tipo de notificação
 * @param {string} id - ID da notificação
 * @returns {Promise<Object>} - Dados processados
 */
export async function processPaymentNotification(topic, id) {
  if (topic !== 'payment') {
    return { success: false, message: 'Notificação não é de pagamento' };
  }

  try {
    const paymentInfo = await getPaymentStatus(id);
    
    // Verifica se o pagamento foi aprovado
    if (paymentInfo.status === 'approved') {
      const [userId, planId] = paymentInfo.external_reference.split('|');
      
      return {
        success: true,
        data: {
          userId,
          planId,
          paymentId: id,
          status: paymentInfo.status,
          amount: paymentInfo.transaction_amount,
        },
      };
    } else {
      return {
        success: false,
        message: `Status do pagamento: ${paymentInfo.status}`,
      };
    }
  } catch (error) {
    console.error('Erro ao processar notificação:', error);
    return { success: false, message: error.message };
  }
}