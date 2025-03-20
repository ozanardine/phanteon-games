import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { supabaseAdmin } from '../../../../lib/supabase';

/**
 * API para gerenciar recompensas (admin)
 */
export default async function handler(req, res) {
  try {
    // Verificar autenticação
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }
    
    // Verificar se é administrador
    if (session.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acesso restrito a administradores' });
    }
    
    // Roteamento por método
    switch (req.method) {
      case 'GET':
        return await getRewards(req, res);
      case 'POST':
        return await createReward(req, res, session);
      default:
        return res.status(405).json({ success: false, message: 'Método não permitido' });
    }
  } catch (error) {
    console.error('[API:admin/rewards] Erro:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}

/**
 * Obter todas as recompensas configuradas
 */
async function getRewards(req, res) {
  try {
    // Buscar todas as recompensas
    const { data: rewards, error } = await supabaseAdmin
      .from('rewards_config')
      .select('*')
      .order('day', { ascending: true })
      .order('vip_level', { ascending: true });
      
    if (error) {
      console.error('Erro ao buscar recompensas:', error);
      return res.status(500).json({ success: false, message: 'Erro ao acessar banco de dados' });
    }
    
    return res.status(200).json({ success: true, rewards });
  } catch (error) {
    console.error('Erro ao buscar recompensas:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}

/**
 * Criar uma nova recompensa
 */
async function createReward(req, res, session) {
  try {
    const rewardData = req.body;
    
    // Validar dados
    if (!validateRewardData(rewardData)) {
      return res.status(400).json({ success: false, message: 'Dados inválidos' });
    }
    
    // Inserir nova recompensa
    const { data: reward, error } = await supabaseAdmin
      .from('rewards_config')
      .insert({
        day: rewardData.day,
        reward_type: rewardData.reward_type || 'item',
        item_name: rewardData.item_name,
        item_shortname: rewardData.item_shortname,
        amount: rewardData.amount,
        vip_level: rewardData.vip_level || 'none',
        is_bonus: rewardData.is_bonus || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao criar recompensa:', error);
      return res.status(500).json({ success: false, message: 'Erro ao salvar recompensa' });
    }
    
    // Registrar log de sincronização
    await logSyncEvent('website', 'success', 'Recompensa criada', {
      admin: session.user.email,
      rewardId: reward.id,
      day: reward.day,
      vipLevel: reward.vip_level
    });
    
    return res.status(201).json({ success: true, reward });
  } catch (error) {
    console.error('Erro ao criar recompensa:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}

/**
 * Validar dados da recompensa
 */
function validateRewardData(data) {
  if (!data) return false;
  
  // Validações básicas
  if (typeof data.day !== 'number' || data.day < 1 || data.day > 7) return false;
  if (!data.item_name || !data.item_shortname) return false;
  if (typeof data.amount !== 'number' || data.amount < 1) return false;
  
  // Validar nível VIP
  const validVipLevels = ['none', 'vip-basic', 'vip-plus', 'vip-premium'];
  if (!validVipLevels.includes(data.vip_level)) return false;
  
  return true;
}

/**
 * Registrar log de sincronização
 */
async function logSyncEvent(source, status, message, details = {}) {
  try {
    await supabaseAdmin
      .from('rewards_sync_logs')
      .insert({
        source,
        status,
        message,
        details,
        created_at: new Date().toISOString()
      });
  } catch (err) {
    console.error('Erro ao registrar log:', err);
  }
} 