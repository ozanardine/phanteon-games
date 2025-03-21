import { reconcileSystems } from '../../../src/services/reconciliation';
import { alertAdmins } from '../../../src/services/notifications';
import { setCacheItem, getCacheItem } from '../../../src/services/cache';

// Este endpoint é chamado manualmente ou pelo bot para executar a reconciliação do sistema VIP

export default async function handler(req, res) {
  // Verificar se é uma solicitação autorizada por chave de API
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const isAuthorized = apiKey === process.env.INTERNAL_API_KEY;
  
  if (!isAuthorized) {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }
  
  try {
    console.log('[API:Reconciliation] Iniciando reconciliação do sistema');
    
    // Obtém a última execução do cache (para logging)
    const lastRun = getCacheItem('last_reconciliation_run');
    if (lastRun) {
      const lastRunTime = new Date(lastRun.timestamp);
      const timeSinceLastRun = Math.floor((Date.now() - lastRun.timestamp) / 60000); // em minutos
      console.log(`[API:Reconciliation] Última execução: ${lastRunTime.toISOString()} (${timeSinceLastRun} minutos atrás)`);
    }
    
    // Executa reconciliação
    const startTime = Date.now();
    const reconciliationResult = await reconcileSystems();
    const executionTime = (Date.now() - startTime) / 1000; // segundos
    
    if (!reconciliationResult.success) {
      console.error(`[API:Reconciliation] Falha na reconciliação: ${reconciliationResult.message}`);
      
      // Alerta os administradores em caso de falha
      await alertAdmins(`Falha na reconciliação automática: ${reconciliationResult.message}`, 'warning');
      
      return res.status(500).json({
        success: false,
        message: reconciliationResult.message,
        execution_time: executionTime
      });
    }
    
    // Salva esta execução no cache para referência
    setCacheItem('last_reconciliation_run', {
      timestamp: Date.now(),
      results: reconciliationResult.results
    }, 86400); // 24 horas
    
    // Log de resultados
    console.log(`[API:Reconciliation] Reconciliação concluída em ${executionTime.toFixed(2)}s:`, reconciliationResult.results);
    
    // Se muitas correções foram feitas, alertar administradores
    const results = reconciliationResult.results;
    const totalFixes = (results.assinaturas_corrigidas || 0) + 
                       (results.assinaturas_expiradas || 0) + 
                       (results.permissoes_corrigidas || 0) + 
                       (results.status_corrigidos || 0);
                       
    if (totalFixes > 10) {
      await alertAdmins(
        `Reconciliação automática corrigiu um número significativo de inconsistências: ${totalFixes} itens corrigidos.`,
        'info'
      );
    }
    
    return res.status(200).json({
      success: true,
      message: `Reconciliação concluída em ${executionTime.toFixed(2)}s`,
      results: reconciliationResult.results,
      execution_time: executionTime
    });
  } catch (error) {
    console.error('[API:Reconciliation] Erro não tratado:', error);
    
    // Alerta administradores sobre erro crítico
    await alertAdmins(`Erro crítico na reconciliação automática: ${error.message}`, 'error');
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno na reconciliação',
      error: error.message
    });
  }
}

export const config = {
  api: {
    bodyParser: true,
  }
}; 