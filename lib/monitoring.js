// lib/monitoring.js - Sistema de monitoramento e logging
import { supabaseAdmin } from './supabase';

/**
 * Classe para monitoramento, alertas e logging do sistema
 */
class MonitoringService {
  constructor() {
    this.alertHandlers = [];
    this.alertThrottling = new Map(); // Para limitar frequência de alertas
  }

  /**
   * Registra um evento no sistema para rastreamento e análise
   * @param {string} eventType - Tipo de evento
   * @param {Object} data - Dados associados ao evento
   * @returns {Promise<void>}
   */
  async logEvent(eventType, data = {}) {
    try {
      // Adicionar metadados ao evento
      const event = {
        event_type: eventType,
        data: data,
        created_at: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      };

      // Registrar no banco de dados para persistência
      const { error } = await supabaseAdmin
        .from('system_events')
        .insert([event]);

      if (error) {
        console.error('[Monitoring] Erro ao registrar evento:', error);
      }
      
      // Verificar se o evento deve gerar um alerta
      this.checkForAlert(eventType, data);
    } catch (err) {
      console.error('[Monitoring] Falha crítica no sistema de eventos:', err);
    }
  }

  /**
   * Verifica se um evento deve desencadear alertas
   * @param {string} eventType - Tipo de evento
   * @param {Object} data - Dados do evento
   */
  checkForAlert(eventType, data) {
    // Definir eventos que geram alertas e sua gravidade
    const alertEvents = {
      'reward_delivery_failed': 'high',
      'system_error': 'critical',
      'database_connection_error': 'critical',
      'api_error': 'medium',
      'stuck_rewards_detected': 'high'
    };

    // Verificar se o evento é um tipo de alerta
    if (alertEvents[eventType]) {
      const severity = alertEvents[eventType];
      this.triggerAlert(eventType, data, severity);
    }
  }

  /**
   * Dispara um alerta com throttling para evitar spam
   * @param {string} alertType - Tipo de alerta
   * @param {Object} data - Dados do alerta
   * @param {string} severity - Gravidade (low, medium, high, critical)
   */
  triggerAlert(alertType, data, severity) {
    // Implementar throttling baseado no tipo e severidade
    const throttleKey = `${alertType}:${severity}`;
    const now = Date.now();
    const lastAlertTime = this.alertThrottling.get(throttleKey) || 0;
    
    // Definir tempos de throttling (em ms) baseado na severidade
    const throttleTimes = {
      'low': 3600000, // 1 hora
      'medium': 1800000, // 30 minutos
      'high': 300000, // 5 minutos
      'critical': 0 // Sem throttling para alertas críticos
    };
    
    const throttleTime = throttleTimes[severity] || 0;
    
    // Verificar se já passou tempo suficiente desde o último alerta deste tipo
    if (now - lastAlertTime > throttleTime) {
      // Atualizar último tempo de alerta
      this.alertThrottling.set(throttleKey, now);
      
      // Notificar todos os handlers registrados
      this.alertHandlers.forEach(handler => {
        try {
          handler(alertType, data, severity);
        } catch (err) {
          console.error(`[Monitoring] Erro ao processar alerta ${alertType}:`, err);
        }
      });
      
      // Log do alerta
      console.warn(`[ALERTA ${severity.toUpperCase()}] ${alertType}:`, data);
    }
  }

  /**
   * Registra um handler para receber alertas
   * @param {Function} handler - Função para processar alertas
   */
  registerAlertHandler(handler) {
    if (typeof handler === 'function') {
      this.alertHandlers.push(handler);
    }
  }

  /**
   * Verifica a saúde do sistema completo
   * @returns {Promise<Object>} Status de saúde do sistema
   */
  async checkSystemHealth() {
    try {
      // Verificar conexão com Supabase
      const dbStart = Date.now();
      const { data, error } = await supabaseAdmin
        .from('system_status')
        .select('last_check')
        .limit(1);
        
      const dbResponseTime = Date.now() - dbStart;
      const dbStatus = error ? 'error' : 'healthy';
      
      // Verificar recompensas presas
      const { data: stuckRewards } = await supabaseAdmin
        .from('pending_rewards')
        .select('id')
        .or('status.eq.processing,status.eq.failed')
        .gt('updated_at', new Date(Date.now() - 86400000).toISOString()) // Últimas 24h
        .limit(100);
        
      const stuckCount = stuckRewards?.length || 0;
      
      // Status geral do sistema
      const systemStatus = {
        status: dbStatus === 'error' ? 'degraded' : (stuckCount > 10 ? 'degraded' : 'healthy'),
        components: {
          database: {
            status: dbStatus,
            responseTime: dbResponseTime,
            error: error ? error.message : null
          },
          rewards: {
            status: stuckCount > 20 ? 'critical' : (stuckCount > 5 ? 'degraded' : 'healthy'),
            stuckCount: stuckCount
          }
        },
        timestamp: new Date().toISOString()
      };
      
      // Atualizar status do sistema no banco
      await supabaseAdmin
        .from('system_status')
        .upsert([
          { 
            id: 'latest',
            status: systemStatus.status,
            details: systemStatus,
            last_check: new Date().toISOString()
          }
        ]);
        
      return systemStatus;
    } catch (err) {
      console.error('[Monitoring] Erro ao verificar saúde do sistema:', err);
      return {
        status: 'critical',
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Exportar instância única do serviço
const monitoringService = new MonitoringService();

// Exportar funções individuais para facilidade de uso
export const logEvent = (eventType, data) => monitoringService.logEvent(eventType, data);
export const registerAlertHandler = (handler) => monitoringService.registerAlertHandler(handler);
export const checkSystemHealth = () => monitoringService.checkSystemHealth();
export default monitoringService; 