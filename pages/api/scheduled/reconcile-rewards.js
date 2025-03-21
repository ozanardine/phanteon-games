// pages/api/scheduled/reconcile-rewards.js - Endpoint para reconciliação periódica de recompensas
import { rewardsService } from '../../../lib/rewards-service';
import { checkSystemHealth, logEvent } from '../../../lib/monitoring';

export default async function handler(req, res) {
  try {
    // Verificar autenticação por chave de API para jobs agendados
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.CRON_API_KEY) {
      // Usar delay para dificultar ataques de força bruta
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(401).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }

    // Verificar saúde do sistema antes de prosseguir
    const systemHealth = await checkSystemHealth();
    
    if (systemHealth.status === 'critical') {
      await logEvent('reconcile_skipped', {
        reason: 'Sistema em estado crítico',
        systemHealth
      });
      
      return res.status(503).json({
        success: false,
        message: 'Reconciliação adiada: sistema em estado crítico',
        systemHealth
      });
    }
    
    // Iniciar processo de reconciliação
    console.log(`[Reconcile] Iniciando reconciliação em ${new Date().toISOString()}`);
    const startTime = Date.now();
    
    // Executar reconciliação
    const result = await rewardsService.reconcileStuckRewards();
    
    // Calcular tempo de execução
    const executionTime = Date.now() - startTime;
    
    // Registrar resultados
    await logEvent('reconciliation_completed', {
      fixed: result.fixed,
      failed: result.failed,
      executionTimeMs: executionTime
    });
    
    return res.status(200).json({
      success: true,
      message: `Reconciliação concluída em ${executionTime}ms`,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reconcile] Erro durante reconciliação:', error);
    
    // Registrar erro
    await logEvent('reconciliation_error', {
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: 'Erro durante reconciliação',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
} 