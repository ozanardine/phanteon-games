/**
 * Funções para interagir com a API do Mercado Pago
 */

// Versão atualizada do SDK do Mercado Pago
import { MercadoPagoConfig, Payment, Preference, MerchantOrder } from 'mercadopago';

// Configuração
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Cache para evitar processamento duplicado
const processedPayments = new Set();

// Inicializa o SDK do Mercado Pago apenas no lado do servidor
let mpClient;

if (typeof window === 'undefined') {
  try {
    mpClient = new MercadoPagoConfig({
      accessToken: MERCADOPAGO_ACCESS_TOKEN
    });
    console.log('[MercadoPago] Cliente inicializado com sucesso');
    
    // Log de verificação de ambiente
    if (MERCADOPAGO_ACCESS_TOKEN && MERCADOPAGO_ACCESS_TOKEN.startsWith('TEST-')) {
      console.log('[MercadoPago] Configurado em modo SANDBOX');
    } else if (MERCADOPAGO_ACCESS_TOKEN && MERCADOPAGO_ACCESS_TOKEN.startsWith('APP_USR-')) {
      console.log('[MercadoPago] Configurado em modo PRODUÇÃO');
    } else {
      console.warn('[MercadoPago] Token não reconhecido - verificar configuração');
    }
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
      payment_methods: {
        excluded_payment_types: [], // Vazio para aceitar todos
        installments: 12, // Máximo de parcelas
      },
      statement_descriptor: "PHANTEONGAMES",
      expires: false,
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
 * Obtém detalhes de uma ordem
 * @param {string} orderId - ID da ordem
 * @returns {Promise<Object>} - Dados da ordem
 */
export async function getMerchantOrderDetails(orderId) {
  try {
    if (!mpClient) {
      throw new Error('Cliente do Mercado Pago não está configurado');
    }
    
    const merchantOrder = new MerchantOrder(mpClient);
    const result = await merchantOrder.get({ merchantOrderId: orderId });
    return result;
  } catch (error) {
    console.error('[MercadoPago] Erro ao buscar detalhes da ordem:', error);
    throw new Error(`Falha ao buscar ordem: ${error.message}`);
  }
}

/**
 * Processa uma notificação de pagamento
 * @param {string} topic - Tipo de notificação (payment, merchant_order)
 * @param {string} id - ID da notificação
 * @returns {Promise<Object>} - Dados processados
 */
export async function processPaymentNotification(topic, id) {
  // Verificação de parâmetros
  if (!id) {
    return { success: false, message: 'ID não fornecido' };
  }
  
  // Criamos um identificador único para este processamento
  const processingKey = `${topic}_${id}`;
  
  // Verificamos se já processamos este pagamento
  if (processedPayments.has(processingKey)) {
    console.log(`[MercadoPago] Notificação ${processingKey} já processada anteriormente`);
    return { success: true, message: 'Notificação já processada' };
  }
  
  try {
    console.log(`[MercadoPago] Processando notificação de ${topic} ID: ${id}`);
    
    let paymentInfo;
    let externalReference;
    
    // Estratégia de processamento baseada no tipo de notificação
    if (topic === 'merchant_order') {
      // Para merchant_order, buscamos informações da ordem
      const orderInfo = await getMerchantOrderDetails(id);
      
      // Verificar se a ordem tem pagamentos aprovados
      const approvedPayment = orderInfo.payments?.find(payment => 
        payment.status === 'approved'
      );
      
      if (!approvedPayment) {
        console.log(`[MercadoPago] Ordem ${id} sem pagamentos aprovados`);
        return { success: false, message: 'Nenhum pagamento aprovado na ordem' };
      }
      
      // Buscamos informações detalhadas do pagamento aprovado
      paymentInfo = await getPaymentStatus(approvedPayment.id);
      externalReference = orderInfo.external_reference || paymentInfo.external_reference;
      
    } else {
      // Para notificações de payment, buscamos diretamente
      paymentInfo = await getPaymentStatus(id);
      externalReference = paymentInfo.external_reference;
    }
    
    // Verificar se o pagamento foi aprovado
    if (paymentInfo.status === 'approved') {
      console.log(`[MercadoPago] Pagamento ${id} aprovado`);
      
      // Verificação da referência externa
      if (!externalReference) {
        console.warn(`[MercadoPago] Pagamento ${id} aprovado, mas sem referência externa`);
        return { success: false, message: 'Referência externa não encontrada' };
      }
      
      // Extração de userId e planId da referência externa
      let userId, planId;
      
      if (externalReference.includes('|')) {
        [userId, planId] = externalReference.split('|');
      } else {
        // Tenta extrair de outras fontes
        userId = paymentInfo.metadata?.user_id || paymentInfo.additional_info?.items?.[0]?.id;
        planId = paymentInfo.metadata?.plan_id || paymentInfo.additional_info?.items?.[0]?.id;
      }
      
      if (!userId || !planId) {
        console.error('[MercadoPago] Falha ao extrair userId/planId:', { externalReference });
        return { success: false, message: 'Informações de usuário/plano não encontradas' };
      }
      
      // Marca como processado para evitar duplicação
      processedPayments.add(processingKey);
      
      // Retorna os dados necessários para ativação da assinatura
      return {
        success: true,
        data: {
          userId,
          planId,
          paymentId: paymentInfo.id,
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

// Função utilitária para limpar o cache (útil para testes)
export function clearProcessedPaymentsCache() {
  const count = processedPayments.size;
  processedPayments.clear();
  console.log(`[MercadoPago] Cache de pagamentos processados limpo (${count} itens)`);
  return count;
}