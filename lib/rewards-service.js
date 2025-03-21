// lib/rewards-service.js - Serviço centralizado para gerenciamento de recompensas
import { supabaseAdmin } from './supabase';
import { logEvent } from './monitoring';

/**
 * Classe para gerenciar recompensas com resiliência a falhas
 */
class RewardsService {
  /**
   * Tenta entregar uma recompensa com retentativas automáticas
   * @param {Object} rewardData - Dados da recompensa
   * @param {number} maxRetries - Número máximo de tentativas
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async deliverRewardWithRetry(rewardData, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[RewardsService] Tentativa ${attempt} de entregar recompensa ID: ${rewardData.id}`);

        // Tentar entregar a recompensa
        await this.processReward(rewardData);
        
        // Sucesso - registrar e retornar
        await logEvent('reward_delivered', {
          reward_id: rewardData.id,
          steam_id: rewardData.steam_id,
          attempts: attempt
        });
        return true;
      } catch (error) {
        console.error(`[RewardsService] Falha na tentativa ${attempt}:`, error);
        
        // Registrar erro para análise
        await logEvent('reward_delivery_attempt_failed', {
          reward_id: rewardData.id, 
          attempt: attempt, 
          error: error.message
        });
        
        // Aguardar com backoff exponencial antes da próxima tentativa
        // 1ª tentativa: 2s, 2ª: 4s, 3ª: 8s
        if (attempt < maxRetries) {
          const delayMs = 1000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    // Todas as tentativas falharam - marcar para reconciliação e alertar
    await this.markForReconciliation(rewardData.id);
    return false;
  }
  
  /**
   * Processa uma recompensa individual
   * @param {Object} rewardData - Dados da recompensa
   * @returns {Promise<void>}
   */
  async processReward(rewardData) {
    // Verificar se a recompensa já foi processada para evitar duplicação
    const { data: existingReward } = await supabaseAdmin
      .from('pending_rewards')
      .select('status, updated_at')
      .eq('id', rewardData.id)
      .single();
      
    if (existingReward && existingReward.status === 'processed') {
      console.log(`[RewardsService] Recompensa ${rewardData.id} já foi processada em ${existingReward.updated_at}`);
      return;
    }
    
    // Atualizar status para 'processing' para evitar processamento concorrente
    const { error: updateError } = await supabaseAdmin
      .from('pending_rewards')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', rewardData.id)
      .eq('status', 'pending'); // Apenas atualiza se ainda estiver pendente
      
    if (updateError) {
      console.error(`[RewardsService] Erro ao atualizar status para processing:`, updateError);
      throw new Error(`Falha ao atualizar status: ${updateError.message}`);
    }
    
    try {
      // Aqui seria integrado com o sistema de notificação para o servidor Rust
      // Isso acontece via webhook ou notificação em tempo real
      
      // Simulação de entrega bem-sucedida
      // Em produção, isso verificaria a resposta do servidor Rust
      const delivered = true;
      
      if (delivered) {
        // Atualizar como processado após entrega bem-sucedida
        await supabaseAdmin
          .from('pending_rewards')
          .update({ 
            status: 'processed',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', rewardData.id);
      } else {
        throw new Error('Falha na comunicação com o servidor de jogo');
      }
    } catch (error) {
      // Em caso de falha, reverter para pendente para permitir nova tentativa
      await supabaseAdmin
        .from('pending_rewards')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', rewardData.id);
      
      throw error; // Propagar erro para o sistema de retentativas
    }
  }
  
  /**
   * Marca uma recompensa para reconciliação manual após falhas persistentes
   * @param {string} rewardId - ID da recompensa
   * @returns {Promise<void>}
   */
  async markForReconciliation(rewardId) {
    await supabaseAdmin
      .from('pending_rewards')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', rewardId);
      
    // Registrar evento de falha para alertas administrativos
    await logEvent('reward_delivery_failed', {
      reward_id: rewardId,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Reconcilia recompensas presas em estados intermediários
   * @returns {Promise<{fixed: number, failed: number}>}
   */
  async reconcileStuckRewards() {
    const stuckThresholdHours = 3;
    const stuckThreshold = new Date();
    stuckThreshold.setHours(stuckThreshold.getHours() - stuckThresholdHours);
    
    // Encontrar recompensas presas em processamento por mais de 3 horas
    const { data: stuckRewards, error } = await supabaseAdmin
      .from('pending_rewards')
      .select('*')
      .or(`status.eq.processing,status.eq.pending`)
      .lt('updated_at', stuckThreshold.toISOString());
      
    if (error) {
      console.error('[RewardsService] Erro ao buscar recompensas presas:', error);
      return { fixed: 0, failed: 0 };
    }
    
    if (!stuckRewards || stuckRewards.length === 0) {
      return { fixed: 0, failed: 0 };
    }
    
    console.log(`[RewardsService] Encontradas ${stuckRewards.length} recompensas presas`);
    
    let fixed = 0;
    let failed = 0;
    
    // Tentar entregar cada recompensa presa
    for (const reward of stuckRewards) {
      const success = await this.deliverRewardWithRetry(reward, 2);
      
      if (success) {
        fixed++;
      } else {
        failed++;
      }
    }
    
    return { fixed, failed };
  }
}

// Exportar uma instância única do serviço
export const rewardsService = new RewardsService(); 