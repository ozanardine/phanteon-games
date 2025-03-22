/**
 * Funções para interagir com a API do Mercado Pago
 */

// Versão atualizada do SDK do Mercado Pago
import { MercadoPagoConfig, Payment, Preference, MerchantOrder } from 'mercadopago';

// Configuração
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Debug: Imprimir estado das variáveis (exceto valores sensíveis)
console.log('[MercadoPago] Variáveis de ambiente:', {
  MERCADOPAGO_ACCESS_TOKEN: MERCADO_PAGO_ACCESS_TOKEN ? `${MERCADO_PAGO_ACCESS_TOKEN.substring(0, 8)}...` : 'não definido',
  NEXT_PUBLIC_BASE_URL,
  NODE_ENV: process.env.NODE_ENV
});

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
} else {
  console.error('[MercadoPago] ALERTA: MERCADOPAGO_ACCESS_TOKEN não está definido. Checkout não funcionará!');
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
 * Processa a notificação do MercadoPago
 * @param {string} topic - Tipo de notificação (payment, merchant_order)
 * @param {string} id - ID da notificação
 * @returns {Promise<Object>} - Resultado do processamento
 */
export async function processPaymentNotification(topic, id) {
  console.log(`[MercadoPago] Processando notificação: ${topic}, ID: ${id}`);
  
  // Validação inicial
  if (!id || !topic) {
    return {
      success: false,
      message: 'ID de notificação ou tipo inválido'
    };
  }
  
  if (!mpClient) {
    return {
      success: false,
      message: 'Cliente do Mercado Pago não está configurado'
    };
  }
  
  try {
    // Processa com base no tipo de notificação
    if (topic === 'payment' || topic === 'payment.created' || topic === 'payment.updated') {
      return await processPayment(id);
    } else if (topic === 'merchant_order' || topic === 'merchant_order.created' || topic === 'merchant_order.updated') {
      return await processMerchantOrder(id);
    } else {
      console.warn(`[MercadoPago] Tipo de notificação não suportado: ${topic}`);
      return {
        success: false,
        message: `Tipo de notificação não suportado: ${topic}`
      };
    }
  } catch (error) {
    console.error(`[MercadoPago] Erro ao processar notificação ${topic} ${id}:`, error);
    return {
      success: false,
      message: `Erro ao processar notificação: ${error.message}`
    };
  }
}

/**
 * Processa uma notificação de pagamento
 * @param {string} paymentId - ID do pagamento
 * @returns {Promise<Object>} - Resultado do processamento
 */
async function processPayment(paymentId) {
  console.log(`[MercadoPago] Processando notificação de pagamento: ${paymentId}`);
  
  try {
    // Tentativa de obter dados do pagamento com retry
    const payment = new Payment(mpClient);
    let paymentData;
    
    try {
      paymentData = await withRetry(
        () => payment.get({ id: paymentId }),
        {
          maxRetries: 3,
          initialDelay: 1000,
          operationName: `Obter Pagamento ${paymentId}`
        }
      );
    } catch (paymentError) {
      // Manejo específico para erro 404 (pagamento não encontrado)
      if (paymentError.status === 404 || 
          (paymentError.cause && paymentError.cause[0]?.code === '404') ||
          paymentError.message.includes('not found')) {
        console.error(`[MercadoPago] Pagamento ${paymentId} não encontrado na API do Mercado Pago`);
        return {
          success: false,
          message: `Pagamento não encontrado: ${paymentId}`
        };
      }
      throw paymentError; // re-throw para outros erros
    }
    
    // Validação básica dos dados do pagamento
    if (!paymentData || !paymentData.external_reference) {
      console.warn(`[MercadoPago] Pagamento ${paymentId} sem external_reference válida`);
      return {
        success: false,
        message: 'Notificação de pagamento sem referência externa'
      };
    }
    
    // Extrair user_id e plan_id da external_reference (formato esperado: userId|planId)
    const [userId, planId] = paymentData.external_reference.split('|');
    
    if (!userId || !planId) {
      console.warn(`[MercadoPago] Referência externa inválida: ${paymentData.external_reference}`);
      return {
        success: false,
        message: 'Formato de referência externa inválido'
      };
    }
    
    // Mapear status do Mercado Pago para status interno
    const statusMap = {
      'approved': 'active',
      'authorized': 'pending',
      'in_process': 'pending',
      'in_mediation': 'pending',
      'rejected': 'cancelled',
      'cancelled': 'cancelled',
      'refunded': 'cancelled',
      'charged_back': 'cancelled',
      'pending': 'pending'
    };
    
    const status = statusMap[paymentData.status] || 'pending';
    
    // Armazenar no cache
    addToCache(paymentCache, paymentId, paymentData);
    
    // Construir resposta formatada
    return {
      success: true,
      data: {
        userId,
        planId,
        paymentId: String(paymentId),
        status,
        amount: paymentData.transaction_amount,
        metadata: {
          mp_status: paymentData.status,
          payment_method: paymentData.payment_method_id,
          payment_type: paymentData.payment_type_id,
          installments: paymentData.installments,
          mp_order_id: paymentData.order?.id,
          mp_external_reference: paymentData.external_reference
        }
      }
    };
  } catch (error) {
    console.error(`[MercadoPago] Erro ao processar pagamento ${paymentId}:`, error);
    return {
      success: false,
      message: `Erro ao processar pagamento: ${error.message}`
    };
  }
}

/**
 * Processa uma notificação de ordem
 * @param {string} orderId - ID da ordem
 * @returns {Promise<Object>} - Resultado do processamento
 */
async function processMerchantOrder(orderId) {
  console.log(`[MercadoPago] Processando notificação de ordem: ${orderId}`);
  
  try {
    // Tentativa de obter dados da ordem com retry
    const merchantOrder = new MerchantOrder(mpClient);
    let orderData;
    
    try {
      orderData = await withRetry(
        () => merchantOrder.get({ id: orderId }),
        {
          maxRetries: 3,
          initialDelay: 1000,
          operationName: `Obter Ordem ${orderId}`
        }
      );
    } catch (orderError) {
      // Manejo específico para erro 404 (ordem não encontrada)
      if (orderError.status === 404 || 
          (orderError.cause && orderError.cause[0]?.code === '404') ||
          orderError.message.includes('not found')) {
        console.error(`[MercadoPago] Ordem ${orderId} não encontrada na API do Mercado Pago`);
        return {
          success: false,
          message: `Ordem não encontrada: ${orderId}`
        };
      }
      throw orderError; // re-throw para outros erros
    }
    
    // Validação básica da ordem
    if (!orderData || !orderData.external_reference) {
      console.warn(`[MercadoPago] Ordem ${orderId} sem external_reference válida`);
      return {
        success: false,
        message: 'Notificação de ordem sem referência externa'
      };
    }
    
    // Extrair user_id e plan_id da external_reference (formato esperado: userId|planId)
    const [userId, planId] = orderData.external_reference.split('|');
    
    if (!userId || !planId) {
      console.warn(`[MercadoPago] Referência externa inválida: ${orderData.external_reference}`);
      return {
        success: false,
        message: 'Formato de referência externa inválido'
      };
    }
    
    // Verificar se há pagamentos associados à ordem
    if (!orderData.payments || !orderData.payments.length) {
      console.log(`[MercadoPago] Ordem ${orderId} sem pagamentos associados`);
      return {
        success: false,
        message: 'Ordem sem pagamentos associados'
      };
    }
    
    // Obter informações do pagamento mais recente
    const latestPayment = orderData.payments
      .sort((a, b) => new Date(b.date_created) - new Date(a.date_created))[0];
    
    if (!latestPayment) {
      return {
        success: false,
        message: 'Pagamento não encontrado na ordem'
      };
    }
    
    // Mapear status da ordem para status interno
    const orderStatusMap = {
      'payment_required': 'pending',
      'partially_paid': 'pending',
      'paid': 'active',
      'cancelled': 'cancelled',
      'expired': 'cancelled',
      'in_process': 'pending'
    };
    
    const status = orderStatusMap[orderData.status] || 'pending';
    
    // Armazenar no cache
    addToCache(orderCache, orderId, orderData);
    
    // Construir resposta formatada
    return {
      success: true,
      data: {
        userId,
        planId,
        paymentId: String(latestPayment.id),
        status,
        amount: orderData.total_amount,
        metadata: {
          mp_order_id: orderId,
          mp_order_status: orderData.status,
          mp_payment_id: latestPayment.id,
          mp_payment_status: latestPayment.status,
          mp_external_reference: orderData.external_reference
        }
      }
    };
  } catch (error) {
    console.error(`[MercadoPago] Erro ao processar ordem ${orderId}:`, error);
    return {
      success: false,
      message: `Erro ao processar ordem: ${error.message}`
    };
  }
}

/**
 * Gera um ID único para a notificação processada
 * @param {string} topic - Tipo de notificação 
 * @param {string} id - ID da notificação
 * @returns {string} - ID único para a notificação
 */
export function getNotificationUniqueId(topic, id, data = null) {
  let idComponents = [topic, id];
  
  // Adiciona componentes adicionais para evitar duplicação em casos específicos
  if (data && data.action) {
    idComponents.push(data.action);
  }
  
  return idComponents.join('_');
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