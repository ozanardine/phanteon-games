import { supabaseAdmin } from '../../../lib/supabase';
import { processUnresolvedPayment } from '../../../lib/mercadopago';
import { setCacheItem, getCacheItem, acquireProcessLock, releaseProcessLock } from '../../../src/services/cache';

// Limite de verificações por execução
const MAX_CHECKS_PER_RUN = 50;
// Tempo máximo de execução (em ms)
const MAX_RUN_TIME = 28 * 1000; // 28 segundos (menor que o limite de timeout do Vercel de 30s)

/**
 * Realiza verificação e processamento de pagamentos pendentes
 * Este endpoint NÃO é mais chamado por cron, apenas manualmente via API
 */
export default async function handler(req, res) {
  // Verificar se é uma solicitação autorizada (com chave API)
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const isAuthorized = apiKey === process.env.INTERNAL_API_KEY;
  
  if (!isAuthorized) {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }
  
  // Verificar se já está em execução (evitar concorrência)
  if (!acquireProcessLock('check_pending_payments', 60)) {
    return res.status(200).json({ 
      success: false, 
      message: 'Verificação já em andamento. Pulando execução.'
    });
  }
  
  try {
    const startTime = Date.now();
    console.log('[API] Iniciando verificação de pagamentos pendentes');
    
    // Resultados da operação
    const results = {
      checked: 0,
      processed: 0,
      errors: 0,
      details: []
    };
    
    // Buscar assinaturas com pagamentos pendentes
    const { data: pendingSubscriptions, error: queryError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, payment_id, payment_status, status, created_at')
      .or('payment_status.eq.pending,status.eq.pending')
      .order('created_at', { ascending: false })
      .limit(MAX_CHECKS_PER_RUN);
    
    if (queryError) {
      console.error('[API] Erro ao buscar assinaturas pendentes:', queryError.message);
      return res.status(500).json({ success: false, message: 'Erro ao buscar assinaturas' });
    }
    
    if (!pendingSubscriptions || pendingSubscriptions.length === 0) {
      console.log('[API] Nenhuma assinatura pendente encontrada');
      
      // Liberar o lock
      releaseProcessLock('check_pending_payments');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Nenhuma assinatura pendente encontrada',
        results
      });
    }
    
    console.log(`[API] Encontradas ${pendingSubscriptions.length} assinaturas pendentes para verificar`);
    
    // Verificar e processar cada assinatura pendente
    for (const subscription of pendingSubscriptions) {
      // Verificar se atingimos o tempo máximo de execução
      if (Date.now() - startTime > MAX_RUN_TIME) {
        console.warn('[API] Tempo máximo de execução atingido. Interrompendo processamento.');
        results.details.push({
          id: 'timeout',
          message: 'Tempo máximo de execução atingido'
        });
        break;
      }
      
      // Incrementar contador de verificados
      results.checked++;
      
      // Verificar se a assinatura tem um payment_id válido
      if (!subscription.payment_id) {
        console.warn(`[API] Assinatura ${subscription.id} sem payment_id`);
        results.details.push({
          id: subscription.id,
          success: false,
          message: 'Sem payment_id'
        });
        continue;
      }
      
      try {
        console.log(`[API] Verificando pagamento ${subscription.payment_id} da assinatura ${subscription.id}`);
        
        // Processar pagamento pendente
        const result = await processUnresolvedPayment(subscription.payment_id);
        
        // Registrar resultado
        results.details.push({
          id: subscription.id,
          payment_id: subscription.payment_id,
          success: result.success,
          message: result.message,
          status: result.status || result.data?.status
        });
        
        if (result.success) {
          results.processed++;
        } else {
          // Verificar se é um pagamento cancelado ou rejeitado
          if (result.status === 'cancelled' || result.status === 'rejected') {
            // Atualizar status da assinatura
            await supabaseAdmin
              .from('subscriptions')
              .update({
                status: 'cancelled',
                payment_status: result.status,
                updated_at: new Date().toISOString()
              })
              .eq('id', subscription.id);
              
            console.log(`[API] Assinatura ${subscription.id} marcada como cancelada devido a pagamento ${result.status}`);
          }
        }
      } catch (error) {
        console.error(`[API] Erro ao processar pagamento ${subscription.payment_id}:`, error);
        
        results.errors++;
        results.details.push({
          id: subscription.id,
          payment_id: subscription.payment_id,
          success: false,
          error: error.message
        });
      }
    }
    
    // Calcular tempo de execução
    const executionTime = (Date.now() - startTime) / 1000;
    
    // Registrar resultados no banco de dados
    await supabaseAdmin
      .from('system_logs')
      .insert({
        action: 'check_pending_payments',
        details: {
          ...results,
          execution_time: executionTime
        }
      });
    
    console.log(`[API] Verificação concluída em ${executionTime.toFixed(2)}s. Processados: ${results.processed}/${results.checked}`);
    
    // Registrar última execução no cache
    setCacheItem('last_pending_payment_check', {
      timestamp: Date.now(),
      results
    }, 86400); // 24 horas
    
    // Liberar o lock
    releaseProcessLock('check_pending_payments');
    
    // Retornar resultados
    return res.status(200).json({
      success: true,
      message: `Verificação concluída. Processados: ${results.processed}/${results.checked}.`,
      execution_time: executionTime,
      results
    });
  } catch (error) {
    console.error('[API] Erro ao verificar pagamentos pendentes:', error);
    
    // Liberar o lock mesmo em caso de erro
    releaseProcessLock('check_pending_payments');
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar pagamentos pendentes',
      error: error.message
    });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
}; 