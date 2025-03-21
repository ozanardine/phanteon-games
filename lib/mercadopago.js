/**
 * Funções para interagir com a API do Mercado Pago
 */

// Versão atualizada do SDK do Mercado Pago
import { MercadoPagoConfig, Payment, Preference, MerchantOrder } from 'mercadopago';

// Configuração
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Cache para evitar processamento duplicado
const processedPayments = new Set();

// Inicializa o SDK do Mercado Pago apenas no lado do servidor
let mpClient = null;

if (MERCADO_PAGO_ACCESS_TOKEN) {
  try {
    mpClient = new MercadoPagoConfig({ accessToken: MERCADO_PAGO_ACCESS_TOKEN });
    console.log('[MercadoPago] Cliente configurado com sucesso');
    
    // Log de verificação de ambiente
    if (MERCADO_PAGO_ACCESS_TOKEN && MERCADO_PAGO_ACCESS_TOKEN.startsWith('TEST-')) {
      console.log('[MercadoPago] Configurado em modo SANDBOX');
    } else if (MERCADO_PAGO_ACCESS_TOKEN && MERCADO_PAGO_ACCESS_TOKEN.startsWith('APP_USR-')) {
      console.log('[MercadoPago] Configurado em modo PRODUÇÃO');
    } else {
      console.warn('[MercadoPago] Token não reconhecido - verificar configuração');
    }
  } catch (error) {
    console.error('[MercadoPago] Erro ao configurar cliente:', error);
  }
}

// Cache de pagamentos e informações para evitar requisições duplicadas
const paymentCache = new Map();
const orderCache = new Map();

// TTL do cache (10 minutos em ms)
const CACHE_TTL = 10 * 60 * 1000; 
// Tamanho máximo do cache
const MAX_CACHE_SIZE = 1000;

/**
 * Gerencia o cache, adicionando com TTL
 * @param {Map} cache - Cache para adicionar o item
 * @param {string} key - Chave do item
 * @param {any} value - Valor a ser armazenado
 */
function addToCache(cache, key, value) {
  // Limpa o cache se atingir o tamanho máximo
  if (cache.size >= MAX_CACHE_SIZE) {
    // Remove os 20% mais antigos
    const keysToDelete = Array.from(cache.keys()).slice(0, Math.floor(cache.size * 0.2));
    keysToDelete.forEach(k => cache.delete(k));
  }
  
  // Adiciona ao cache com expiração
  cache.set(key, {
    data: value,
    timestamp: Date.now()
  });
}

/**
 * Obtém um item do cache
 * @param {Map} cache - Cache para buscar o item
 * @param {string} key - Chave do item
 * @returns {any|null} Valor do cache ou null se expirado/não encontrado
 */
function getFromCache(cache, key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  // Verifica se o cache expirou
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Funções utilitárias para retry
 */
async function withRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 500,
    maxDelay = 5000,
    factor = 2,
    operationName = 'Operação MP'
  } = options;
  
  let attempt = 0;
  let lastError = null;
  let delay = initialDelay;
  
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      lastError = error;
      
      if (attempt >= maxRetries) {
        break;
      }
      
      // Exponential backoff com jitter
      const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15
      delay = Math.min(delay * factor * jitter, maxDelay);
      
      console.warn(`[MercadoPago Retry] ${operationName} - Tentativa ${attempt}/${maxRetries} falhou: ${error.message}. Próxima em ${delay.toFixed(0)}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`[MercadoPago Retry] ${operationName} - Todas ${maxRetries} tentativas falharam. Último erro: ${lastError.message}`);
  throw lastError;
}

/**
 * Cria uma preferência de pagamento no Mercado Pago
 * @param {Object} paymentData - Dados para criar a preferência
 * @returns {Promise<Object>} - Preferência criada
 */
export async function createPaymentPreference(paymentData) {
  const { title, price, quantity, userId, planId, successUrl, failureUrl } = paymentData;
  
  return withRetry(async () => {
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
      metadata: {
        user_id: userId,
        plan_id: planId
      }
    };
    
    console.log('[MercadoPago] Criando preferência:', JSON.stringify(preferenceData, null, 2));
    
    const result = await preference.create({ body: preferenceData });
    
    console.log('[MercadoPago] Preferência criada com sucesso, ID:', result.id);

    return {
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    };
  }, {
    maxRetries: 3,
    operationName: 'Criar Preferência'
  });
}

/**
 * Obtém o status de um pagamento do Mercado Pago
 * @param {string} paymentId - ID do pagamento
 * @returns {Promise<Object>} - Status e detalhes do pagamento
 */
export async function getPaymentStatus(paymentId) {
  // Verificar no cache primeiro
  const cachedPayment = getFromCache(paymentCache, paymentId);
  if (cachedPayment) {
    return cachedPayment;
  }
  
  return withRetry(async () => {
    if (!mpClient) {
      throw new Error('Cliente do Mercado Pago não está configurado');
    }
    
    const payment = new Payment(mpClient);
    const paymentInfo = await payment.get({ id: paymentId });
    
    // Armazenar no cache
    addToCache(paymentCache, paymentId, paymentInfo);
    
    return paymentInfo;
  }, {
    maxRetries: 3,
    operationName: `Obter Pagamento ${paymentId}`
  });
}

/**
 * Obtém os detalhes de uma ordem do Mercado Pago
 * @param {string} orderId - ID da ordem
 * @returns {Promise<Object>} - Detalhes da ordem
 */
export async function getMerchantOrderDetails(orderId) {
  // Verificar no cache primeiro
  const cachedOrder = getFromCache(orderCache, orderId);
  if (cachedOrder) {
    return cachedOrder;
  }
  
  return withRetry(async () => {
    if (!mpClient) {
      throw new Error('Cliente do Mercado Pago não está configurado');
    }
    
    const merchantOrder = new MerchantOrder(mpClient);
    const orderInfo = await merchantOrder.get({ id: orderId });
    
    // Armazenar no cache
    addToCache(orderCache, orderId, orderInfo);
    
    return orderInfo;
  }, {
    maxRetries: 3,
    operationName: `Obter Ordem ${orderId}`
  });
}

/**
 * Processa uma notificação de pagamento
 * @param {string} topic - Tópico da notificação (payment, merchant_order)
 * @param {string} id - ID da entidade
 * @returns {Promise<Object>} - Resultado do processamento
 */
export async function processPaymentNotification(topic, id) {
  // Verificação de parâmetros
  if (!topic || !id) {
    return { success: false, message: 'Parâmetros incompletos' };
  }
  
  if (!mpClient) {
    return { success: false, message: 'Cliente do Mercado Pago não está configurado' };
  }
  
  // Chave única para identificar este processamento
  const processingKey = `${topic}:${id}`;
  
  // Verificar se já processamos este pagamento
  if (processedPayments.has(processingKey)) {
    console.log(`[MercadoPago] Notificação já processada: ${processingKey}`);
    return { success: true, message: 'Notificação já processada anteriormente' };
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
      
      // Limitar tamanho do conjunto para evitar vazamento de memória
      if (processedPayments.size > MAX_CACHE_SIZE) {
        // Converter para array, remover os primeiros 20% mais antigos
        const tempArray = Array.from(processedPayments);
        processedPayments.clear();
        tempArray.slice(Math.floor(MAX_CACHE_SIZE * 0.2)).forEach(id => processedPayments.add(id));
      }
      
      // Retorna os dados necessários para ativação da assinatura
      return {
        success: true,
        data: {
          userId,
          planId,
          paymentId: paymentInfo.id,
          status: paymentInfo.status,
          amount: paymentInfo.transaction_amount,
          date: paymentInfo.date_approved || paymentInfo.date_created,
          payment_method: {
            id: paymentInfo.payment_method_id,
            type: paymentInfo.payment_type_id
          }
        },
      };
    } else {
      console.log(`[MercadoPago] Pagamento ${id} com status: ${paymentInfo.status}`);
      return {
        success: false,
        message: `Status do pagamento: ${paymentInfo.status}`,
        status: paymentInfo.status
      };
    }
  } catch (error) {
    console.error('[MercadoPago] Erro ao processar notificação:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Processa um pagamento pendente
 * Usado em jobs de reconciliação para verificar pagamentos pendentes
 * @param {string} paymentId - ID do pagamento
 */
export async function processUnresolvedPayment(paymentId) {
  try {
    if (!paymentId) {
      return { success: false, message: 'ID de pagamento não informado' };
    }
    
    // Verificar status atual
    const paymentInfo = await getPaymentStatus(paymentId);
    
    // Se o pagamento foi aprovado, processa através do fluxo padrão
    if (paymentInfo.status === 'approved') {
      return processPaymentNotification('payment', paymentId);
    } else {
      return { 
        success: false, 
        message: `Pagamento com status '${paymentInfo.status}' não pode ser processado` 
      };
    }
  } catch (error) {
    console.error('[MercadoPago] Erro ao processar pagamento pendente:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Limpa os caches periodicamente para evitar vazamento de memória
 * ou uso prolongado de dados desatualizados
 */
export function clearCaches() {
  // Limpar caches mais antigos que o TTL
  const now = Date.now();
  
  // Limpar cache de pagamentos
  for (const [key, value] of paymentCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      paymentCache.delete(key);
    }
  }
  
  // Limpar cache de ordens
  for (const [key, value] of orderCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      orderCache.delete(key);
    }
  }
}

// Limpar caches a cada 30 minutos
setInterval(clearCaches, 30 * 60 * 1000);

export default {
  createPaymentPreference,
  getPaymentStatus,
  getMerchantOrderDetails,
  processPaymentNotification,
  processUnresolvedPayment
};