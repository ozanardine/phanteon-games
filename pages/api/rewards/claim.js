// pages/api/rewards/claim.js - API para reivindicar recompensas
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { supabaseAdmin } from '../../../lib/supabase';
import { getUserByDiscordId } from '../../../lib/supabase';

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

    // Garantir que o Discord ID seja uma string
    const discordIdString = session.user.discord_id.toString();

    // Buscar o usuário pelo Discord ID
    const userData = await getUserByDiscordId(discordIdString);
    
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

    // Extrair o dia a ser reivindicado do corpo da requisição
    const { day, timestamp } = req.body;

    if (!day || typeof day !== 'number' || day < 1 || day > 7) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dia inválido. Deve ser um número entre 1 e 7.' 
      });
    }

    // Verificar status VIP (apenas VIP Plus pode reivindicar pelo site)
    const vipStatus = await determineVipStatus(userData);
    if (vipStatus !== 'vip-plus') {
      return res.status(403).json({
        success: false,
        message: 'Apenas usuários VIP Plus podem reivindicar recompensas pelo site.'
      });
    }

    // Buscar status diário do jogador
    const { data: dailyStatus, error: statusError } = await supabaseAdmin
      .from('player_daily_status')
      .select('*')
      .eq('steam_id', userData.steam_id)
      .single();

    if (statusError && statusError.code !== 'PGRST116') {
      throw statusError;
    }

    // Se não há status diário, criar um novo
    if (!dailyStatus) {
      // Verificar se é o dia 1 (único dia que pode ser reivindicado para novos jogadores)
      if (day !== 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Somente o dia 1 pode ser reivindicado para novos jogadores.' 
        });
      }

      // Criar novo status diário
      const now = new Date().toISOString();
      const newStatus = {
        user_id: userData.id,
        steam_id: userData.steam_id,
        consecutive_days: 1,
        claimed_days: [1],
        last_claim_date: now,
        vip_status: vipStatus,
        has_missed_day: false,
        is_active: true,
        cycle_start_date: now,
        next_reset_time: getNextResetTime(),
        has_active_rewards: true
      };

      // Inserir novo status
      const { data: insertedStatus, error: insertError } = await supabaseAdmin
        .from('player_daily_status')
        .insert([newStatus])
        .select()
        .single();

      if (insertError) throw insertError;

      // Gerar recompensas para o dia 1
      const rewards = await generateRewardsForDay(day, vipStatus);

      // Registrar reivindicação no histórico
      await registerClaims(userData, day, rewards);

      // Adicionar recompensas à fila de pendentes
      await addToPendingRewards(userData, day, timestamp);

      return res.status(200).json({
        success: true,
        message: 'Recompensas do dia 1 reivindicadas com sucesso!',
        rewards,
        status: insertedStatus
      });
    }

    // Verificar e atualizar status se necessário
    const updatedStatus = checkAndUpdateDailyStatus(dailyStatus);
    
    // Verificar se o dia já foi reivindicado
    if (updatedStatus.claimed_days && updatedStatus.claimed_days.includes(day)) {
      return res.status(400).json({ 
        success: false, 
        message: `O dia ${day} já foi reivindicado.` 
      });
    }

    // Verificar se é o próximo dia consecutivo
    const nextDay = updatedStatus.consecutive_days + 1;
    if (day !== nextDay) {
      return res.status(400).json({ 
        success: false, 
        message: `Somente o dia ${nextDay} pode ser reivindicado agora.` 
      });
    }

    // Atualizar status do jogador
    const now = new Date().toISOString();
    const newClaimedDays = [...(updatedStatus.claimed_days || []), day];
    const newConsecutiveDays = updatedStatus.consecutive_days + 1;
    
    const { data: updatedRecord, error: updateError } = await supabaseAdmin
      .from('player_daily_status')
      .update({
        consecutive_days: newConsecutiveDays,
        claimed_days: newClaimedDays,
        last_claim_date: now,
        has_missed_day: false
      })
      .eq('id', updatedStatus.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Gerar recompensas para o dia
    const rewards = await generateRewardsForDay(day, vipStatus);

    // Registrar reivindicação no histórico
    await registerClaims(userData, day, rewards);

    // Adicionar recompensas à fila de pendentes
    await addToPendingRewards(userData, day, timestamp);

    // Retornar sucesso com as recompensas
    return res.status(200).json({
      success: true,
      message: `Recompensas do dia ${day} reivindicadas com sucesso!`,
      rewards,
      status: updatedRecord
    });
  } catch (error) {
    console.error('[API:claim-reward] Erro:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao reivindicar recompensa diária',
      details: error.message 
    });
  }
}

// Função para determinar o status VIP
async function determineVipStatus(userData) {
  try {
    // Verificar se o usuário é admin (mantém privilégio máximo)
    if (userData.role === 'admin') {
      return 'vip-plus';
    }
    
    // Buscar assinatura ativa do usuário
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('[API:claim-reward] Erro ao buscar assinatura:', error);
      // Fallback para o campo role em caso de erro
      if (userData.role === 'vip-plus') {
        return 'vip-plus';
      } else if (userData.role === 'vip') {
        return 'vip-basic';
      }
      return 'none';
    }
    
    if (!subscription) {
      // Sem assinatura ativa, verificar o campo role como fallback
      if (userData.role === 'vip-plus') {
        return 'vip-plus';
      } else if (userData.role === 'vip') {
        return 'vip-basic';
      }
      return 'none';
    }
    
    // Mapear o plan_id para o tipo de VIP
    const planIdMapping = {
      '0b81cf06-ed81-49ce-8680-8f9d9edc932e': 'vip-basic',
      '3994ff53-f110-4c8f-a492-ad988528006f': 'vip-plus'
    };
    
    return planIdMapping[subscription.plan_id] || 'vip-basic';
  } catch (error) {
    console.error('[API:claim-reward] Erro ao determinar status VIP:', error);
    // Fallback para o campo role em caso de erro
    if (userData.role === 'vip-plus') {
      return 'vip-plus';
    } else if (userData.role === 'vip') {
      return 'vip-basic';
    }
    return 'none';
  }
}

// Função para obter o próximo horário de reset (meia-noite UTC)
function getNextResetTime() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

// Função para verificar e atualizar o status diário
function checkAndUpdateDailyStatus(status) {
  const now = new Date();
  const nextReset = new Date(status.next_reset_time);
  
  // Se já passou do horário de reset
  if (now > nextReset) {
    // Verifica se o jogador perdeu um dia
    const lastClaimDate = status.last_claim_date ? new Date(status.last_claim_date) : null;
    const hasMissedDay = lastClaimDate 
      ? (nextReset - lastClaimDate) > (24 * 60 * 60 * 1000 * 2) // Mais de 2 dias
      : false;
    
    return {
      ...status,
      has_missed_day: hasMissedDay,
      consecutive_days: hasMissedDay ? 0 : status.consecutive_days,
      next_reset_time: getNextResetTime()
    };
  }
  
  return status;
}

// Função para gerar recompensas para um dia específico
async function generateRewardsForDay(day, vipStatus) {
  try {
    // Buscar recompensas da tabela de configuração
    const { data: rewardsConfig, error } = await supabaseAdmin
      .from('rewards_config')
      .select('*')
      .eq('day', day)
      .order('is_bonus', { ascending: false });
    
    if (error) throw error;
    
    if (!rewardsConfig || rewardsConfig.length === 0) {
      throw new Error(`Nenhuma recompensa configurada para o dia ${day}`);
    }
    
    // Lista de recompensas
    const rewards = [];
    
    // Adicionar recompensas padrão (não-VIP)
    const standardRewards = rewardsConfig.filter(r => r.vip_level === 'none');
    standardRewards.forEach(reward => {
      rewards.push({
        name: reward.item_name,
        amount: reward.amount,
        isVip: false
      });
    });
    
    // Adicionar bônus VIP se aplicável
    if (vipStatus !== 'none') {
      // Determinar quais níveis VIP aplicar
      const applicableLevels = [];
      
      if (vipStatus === 'vip-basic') {
        applicableLevels.push('vip-basic');
      } else if (vipStatus === 'vip-plus') {
        applicableLevels.push('vip-basic', 'vip-plus');
      }
      
      // Filtrar recompensas VIP aplicáveis
      const vipRewards = rewardsConfig.filter(r => 
        r.is_bonus && applicableLevels.includes(r.vip_level)
      );
      
      // Adicionar recompensas VIP
      vipRewards.forEach(reward => {
        rewards.push({
          name: reward.item_name,
          amount: reward.amount,
          isVip: true
        });
      });
    }
    
    return rewards;
  } catch (error) {
    console.error(`[API:claim-reward] Erro ao buscar recompensas para o dia ${day}:`, error);
    
    // Fallback para recompensas padrão
    let baseReward;
    
    switch (day) {
      case 1:
        baseReward = { name: "Scrap", amount: 20 };
        break;
      case 2:
        baseReward = { name: "Wood", amount: 1000 };
        break;
      case 3:
        baseReward = { name: "Stone", amount: 500 };
        break;
      case 4:
        baseReward = { name: "Metal Fragments", amount: 250 };
        break;
      case 5:
        baseReward = { name: "Low Grade Fuel", amount: 100 };
        break;
      case 6:
        baseReward = { name: "Scrap", amount: 50 };
        break;
      case 7:
        baseReward = { name: "Scrap", amount: 100 };
        break;
      default:
        baseReward = { name: "Scrap", amount: 10 };
    }
    
    const rewards = [{ ...baseReward, isVip: false }];
    
    // Adicionar bônus VIP mínimo
    if (vipStatus === 'vip-plus') {
      rewards.push({ name: "Scrap", amount: 50, isVip: true });
    }
    
    return rewards;
  }
}

// Função para registrar reivindicações no histórico
async function registerClaims(userData, day, rewards) {
  const now = new Date().toISOString();
  const claimEntries = rewards.map(reward => ({
    user_id: userData.id,
    steam_id: userData.steam_id,
    day,
    reward_item: reward.name,
    reward_amount: reward.amount,
    is_currency: ['Scrap', 'Wood', 'Stone', 'Metal Fragments', 'Low Grade Fuel'].includes(reward.name),
    vip_status: 'vip-plus', // Apenas VIP Plus pode reivindicar pelo site
    claimed_at: now,
    server_id: 'main',
    claim_source: 'website'
  }));
  
  const { error } = await supabaseAdmin
    .from('daily_rewards')
    .insert(claimEntries);
    
  if (error) throw error;
}

// Função para adicionar à fila de recompensas pendentes
async function addToPendingRewards(userData, day, timestamp) {
  const now = timestamp || new Date().toISOString();
  
  const { error } = await supabaseAdmin
    .from('pending_rewards')
    .insert([{
      user_id: userData.id,
      steam_id: userData.steam_id,
      day,
      status: 'pending',
      claim_type: 'website',
      server_id: 'main',
      requested_at: now,
      delivered: false,
      delivered_at: null
    }]);
    
  if (error) throw error;
}