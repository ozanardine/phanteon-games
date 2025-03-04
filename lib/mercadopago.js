/**
 * Funções para interagir com a API do Mercado Pago
 */

// Versão atualizada do SDK do Mercado Pago
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

// Configuração
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// Inicializa o SDK do Mercado Pago apenas no lado do servidor
let mpClient;

if (typeof window === 'undefined') {
  try {
    mpClient = new MercadoPagoConfig({
      accessToken: MERCADOPAGO_ACCESS_TOKEN
    });
    console.log('[MercadoPago] Cliente inicializado com sucesso');
  } catch (error) {
    console.error('[MercadoPago] Erro ao inicializar cliente:', error);
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
    if (!mpClient) {
      throw new Error('Cliente do Mercado Pago não está configurado');
    }
    
    const preference = new Preference(mpClient);
    
    const preferenceData = {
      items: [
        {
          id: planId,
          title: title,
          unit_price: Number(price),
          quantity: Number(quantity || 1),
          currency_id: 'BRL',
        },
      ],
      external_reference: `${userId}|${planId}`,
      back_urls: {
        success: successUrl || `${NEXT_PUBLIC_BASE_URL}/perfil?success=true`,
        failure: failureUrl || `${NEXT_PUBLIC_BASE_URL}/checkout/${planId}?error=true`,
        pending: `${NEXT_PUBLIC_BASE_URL}/perfil?pending=true`,
      },
      auto_return: 'approved',
      notification_url: `${NEXT_PUBLIC_BASE_URL}/api/webhook/mercadopago`,
    };
    
    console.log('[MercadoPago] Criando preferência:', JSON.stringify(preferenceData, null, 2));
    
    const result = await preference.create({ body: preferenceData });
    
    console.log('[MercadoPago] Preferência criada com sucesso, ID:', result.id);

    return {
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    };
  } catch (error) {
    console.error('[MercadoPago] Erro ao criar preferência de pagamento:', error);
    throw new Error(`Falha ao processar pagamento: ${error.message}`);
  }
}

/**
 * Verifica o status de um pagamento
 * @param {string} paymentId - ID do pagamento no Mercado Pago
 * @returns {Promise<Object>} - Dados do pagamento
 */
export async function getPaymentStatus(paymentId) {
  try {
    if (!mpClient) {
      throw new Error('Cliente do Mercado Pago não está configurado');
    }
    
    const payment = new Payment(mpClient);
    const result = await payment.get({ id: paymentId });
    return result;
  } catch (error) {
    console.error('[MercadoPago] Erro ao verificar status do pagamento:', error);
    throw new Error(`Falha ao verificar pagamento: ${error.message}`);
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
    console.log(`[MercadoPago] Notificação ignorada: ${topic}`);
    return { success: false, message: 'Notificação não é de pagamento' };
  }

  try {
    console.log(`[MercadoPago] Processando notificação de pagamento ID: ${id}`);
    
    const paymentInfo = await getPaymentStatus(id);
    
    // Verifica se o pagamento foi aprovado
    if (paymentInfo.status === 'approved') {
      console.log(`[MercadoPago] Pagamento ${id} aprovado`);
      
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
      console.log(`[MercadoPago] Pagamento ${id} com status: ${paymentInfo.status}`);
      return {
        success: false,
        message: `Status do pagamento: ${paymentInfo.status}`,
      };
    }
  } catch (error) {
    console.error('[MercadoPago] Erro ao processar notificação:', error);
    return { success: false, message: error.message };
  }
}