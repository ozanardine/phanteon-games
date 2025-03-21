// pages/api/rewards/claim.js - API para resgate de recompensas
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { supabaseAdmin, getUserByDiscordId } from '../../../lib/supabase';
import { rewardsService } from '../../../lib/rewards-service';
import { logEvent } from '../../../lib/monitoring';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    // Buscar o usuário pelo Discord ID
    const userData = await getUserByDiscordId(session.user.discord_id.toString());
    
    if (!userData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    // Verificar se o usuário tem um Steam ID configurado
    if (!userData.steam_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Steam ID não configurado. Configure seu Steam ID para acessar recompensas diárias.' 
      });
    }

    // Validar dia da recompensa
    const { day } = req.body;
    if (!day || isNaN(day) || day < 1 || day > 7) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dia de recompensa inválido. Deve ser um número entre 1 e 7.' 
      });
    }

    // Verificar se o jogador pode reclamar uma recompensa hoje (não fez claim nas últimas 24h)
    const lastClaimCheck = await validateLastClaim(userData.id);
    
    if (!lastClaimCheck.canClaim) {
      const hoursToWait = lastClaimCheck.hoursToWait;
      
      return res.status(400).json({ 
        success: false, 
        message: `Você já resgatou sua recompensa hoje. Próximo resgate disponível em ${hoursToWait} hora(s).`,
        nextClaimTime: lastClaimCheck.nextClaimTime
      });
    }

    // Registrar nova recompensa pendente
    const now = new Date().toISOString();
    
    // Criar registro de recompensa pendente
    const { data: pendingReward, error } = await supabaseAdmin
      .from('pending_rewards')
      .insert([{
        user_id: userData.id,
        steam_id: userData.steam_id,
        day,
        status: 'pending',
        claim_type: 'website',
        server_id: 'main',
        requested_at: now
      }])
      .select()
      .single();
      
    if (error) {
      console.error("[API:claim] Erro ao criar recompensa pendente:", error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao processar solicitação de recompensa' 
      });
    }
    
    // Registrar claim no histórico do jogador
    await registerClaim(userData.id, day, now);
    
    // Iniciar processo de entrega assíncrono com retentativas
    // Nota: Isso é assíncrono e não bloqueia a resposta ao cliente
    rewardsService.deliverRewardWithRetry(pendingReward)
      .then(success => {
        if (success) {
          console.log(`[API:claim] Recompensa ${pendingReward.id} entregue com sucesso`);
        } else {
          console.error(`[API:claim] Falha na entrega da recompensa ${pendingReward.id}`);
        }
      })
      .catch(err => {
        console.error(`[API:claim] Erro no processo de entrega: ${err.message}`);
      });
    
    // Responder ao cliente
    return res.status(200).json({
      success: true,
      message: 'Recompensa reivindicada com sucesso! Entre no servidor para recebê-la.',
      rewardId: pendingReward.id,
      claimTime: now,
      nextClaimTime: getNextClaimTime(now)
    });

  } catch (error) {
    console.error('[API:claim] Erro geral:', error);
    
    // Registrar erro no sistema de monitoramento
    await logEvent('claim_error', {
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao processar sua solicitação',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Valida se o jogador pode fazer um novo claim com base no último resgate
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Resultado da validação
 */
async function validateLastClaim(userId) {
  const cooldownHours = 20; // Tempo mínimo entre resgates (20h em vez de 24h para dar margem)
  
  // Buscar o último claim do jogador
  const { data: lastClaim, error } = await supabaseAdmin
    .from('player_reward_claims')
    .select('claimed_at')
    .eq('user_id', userId)
    .order('claimed_at', { ascending: false })
    .limit(1);
    
  if (error) {
    console.error("[API:claim:validate] Erro ao verificar último claim:", error);
    throw new Error('Falha ao verificar elegibilidade para recompensa');
  }
  
  // Se não houver claims anteriores, pode claimar
  if (!lastClaim || lastClaim.length === 0) {
    return { canClaim: true };
  }
  
  const lastClaimDate = new Date(lastClaim[0].claimed_at);
  const now = new Date();
  
  // Calcular a diferença em horas
  const diffHours = (now - lastClaimDate) / (1000 * 60 * 60);
  
  // Verificar se passou tempo suficiente
  if (diffHours >= cooldownHours) {
    return { canClaim: true };
  }
  
  // Calcular tempo restante
  const hoursToWait = Math.ceil(cooldownHours - diffHours);
  const nextClaimTime = new Date(lastClaimDate.getTime() + (cooldownHours * 60 * 60 * 1000));
  
  return { 
    canClaim: false, 
    hoursToWait, 
    nextClaimTime: nextClaimTime.toISOString() 
  };
}

/**
 * Registra um claim no histórico do jogador
 * @param {string} userId - ID do usuário
 * @param {number} day - Dia do resgate
 * @param {string} timestamp - Data/hora do resgate
 * @returns {Promise<void>}
 */
async function registerClaim(userId, day, timestamp) {
  const { error } = await supabaseAdmin
    .from('player_reward_claims')
    .insert([{
      user_id: userId,
      day,
      claimed_at: timestamp
    }]);
    
  if (error) {
    console.error("[API:claim:register] Erro ao registrar claim:", error);
    throw new Error('Falha ao registrar histórico de recompensa');
  }
}

/**
 * Calcula a próxima data/hora de claim disponível
 * @param {string} currentClaimTime - Data/hora do claim atual
 * @returns {string} Data/hora do próximo claim possível
 */
function getNextClaimTime(currentClaimTime) {
  const cooldownHours = 20;
  const date = new Date(currentClaimTime);
  date.setHours(date.getHours() + cooldownHours);
  return date.toISOString();
}