// pages/api/rewards/daily.js - API para obter status atual de recompensas
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { supabaseAdmin } from '../../../lib/supabase';
import { getUserByDiscordId } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Buscar status diário do jogador
    const { data: dailyStatus, error: statusError } = await supabaseAdmin
      .from('player_daily_status')
      .select('*')
      .eq('steam_id', userData.steam_id)
      .single();

    if (statusError && statusError.code !== 'PGRST116') {
      throw statusError;
    }

    // Buscar histórico de recompensas recentes
    const { data: rewardHistory, error: historyError } = await supabaseAdmin
      .from('daily_rewards')
      .select('*')
      .eq('steam_id', userData.steam_id)
      .order('claimed_at', { ascending: false })
      .limit(20);

    if (historyError) throw historyError;

    // Se não há status diário, criar um novo
    if (!dailyStatus) {
      // Valor padrão para novo status diário
      const defaultStatus = {
        user_id: userData.id,
        steam_id: userData.steam_id,
        consecutive_days: 0,
        claimed_days: [],
        last_claim_date: null,
        vip_status: await determineVipStatus(userData),
        has_missed_day: false,
        is_active: true,
        cycle_start_date: new Date().toISOString(),
        next_reset_time: getNextResetTime(),
        has_active_rewards: true
      };

      // Verificar se é VIP Plus para enviar as recompensas
      if (defaultStatus.vip_status === 'vip-plus') {
        // Buscar configuração de recompensas
        const { data: rewardsConfig, error: configError } = await supabaseAdmin
          .from('rewards_config')
          .select('*')
          .order('day', { ascending: true })
          .order('is_bonus', { ascending: false });
          
        if (configError) throw configError;
        
        // Estruturar recompensas por dia
        const rewardsByDay = await formatRewardsData(rewardsConfig, defaultStatus);
        
        return res.status(200).json({
          success: true,
          status: defaultStatus,
          rewards: rewardsByDay,
          history: rewardHistory || []
        });
      } else {
        // Usuário não é VIP Plus, retornar status sem recompensas
        return res.status(200).json({
          success: true,
          status: defaultStatus,
          rewards: [],
          history: rewardHistory || [],
          message: 'Recurso disponível apenas para VIP Plus'
        });
      }
    }

    // Verificar se o status está atualizado
    const updatedStatus = checkAndUpdateDailyStatus(dailyStatus);
    
    // Verificar se é VIP Plus para enviar as recompensas
    if (updatedStatus.vip_status === 'vip-plus') {
      // Buscar configuração de recompensas
      const { data: rewardsConfig, error: configError } = await supabaseAdmin
        .from('rewards_config')
        .select('*')
        .order('day', { ascending: true })
        .order('is_bonus', { ascending: false });
        
      if (configError) throw configError;
      
      // Estruturar recompensas por dia
      const rewardsByDay = await formatRewardsData(rewardsConfig, updatedStatus);
      
      // Retornar os dados completos
      return res.status(200).json({
        success: true,
        status: updatedStatus,
        rewards: rewardsByDay,
        history: rewardHistory || []
      });
    } else {
      // Usuário não é VIP Plus, retornar status sem recompensas
      return res.status(200).json({
        success: true,
        status: updatedStatus,
        rewards: [],
        history: rewardHistory || [],
        message: 'Recurso disponível apenas para VIP Plus'
      });
    }
  } catch (error) {
    console.error('[API:daily-rewards] Erro:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar recompensas diárias',
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
      console.error('[API:daily-rewards] Erro ao buscar assinatura:', error);
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
    console.error('[API:daily-rewards] Erro ao determinar status VIP:', error);
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

// Função para estruturar recompensas por dia
async function formatRewardsData(rewardsConfig, status) {
  try {
    // Inicializar estrutura para 7 dias
    const rewardsByDay = [];
    
    // Para cada dia (1-7)
    for (let day = 1; day <= 7; day++) {
      const dayConfig = rewardsConfig.filter(r => r.day === day);
      
      // Itens do dia atual
      const items = [];
      
      // Adicionar itens regulares (não-VIP)
      const regularItems = dayConfig.filter(r => r.vip_level === 'none');
      regularItems.forEach(item => {
        items.push({
          name: item.item_name,
          amount: item.amount,
          isVip: false
        });
      });
      
      // Adicionar bônus VIP
      if (status.vip_status !== 'none') {
        // Determinar quais níveis VIP aplicar
        const applicableLevels = [];
        
        if (status.vip_status === 'vip-basic') {
          applicableLevels.push('vip-basic');
        } else if (status.vip_status === 'vip-plus') {
          applicableLevels.push('vip-basic', 'vip-plus');
        }
        
        // Filtrar itens VIP aplicáveis
        const vipItems = dayConfig.filter(r => 
          r.is_bonus && applicableLevels.includes(r.vip_level)
        );
        
        // Adicionar itens VIP
        vipItems.forEach(item => {
          items.push({
            name: item.item_name,
            amount: item.amount,
            isVip: true
          });
        });
      }
      
      // Verificar se este dia foi reivindicado
      const claimed = Array.isArray(status.claimed_days) && status.claimed_days.includes(day);
      
      // Verificar se este dia está disponível para reivindicar
      const nextDay = status.consecutive_days + 1;
      const available = day === nextDay && !claimed;
      
      // Adicionar ao array de recompensas
      rewardsByDay.push({
        day,
        items,
        claimed,
        available
      });
    }
    
    return rewardsByDay;
  } catch (error) {
    console.error('[API:daily-rewards] Erro ao formatar recompensas:', error);
    return [];
  }
}