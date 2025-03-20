import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { supabaseAdmin } from '../../../../lib/supabase';

/**
 * API para gerenciar recompensas específicas (admin)
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
    
    // Obter ID da recompensa
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    
    // Roteamento por método
    switch (req.method) {
      case 'GET':
        return await getReward(req, res, id);
      case 'PUT':
        return await updateReward(req, res, id, session);
      case 'DELETE':
        return await deleteReward(req, res, id, session);
      default:
        return res.status(405).json({ success: false, message: 'Método não permitido' });
    }
  } catch (error) {
    console.error('[API:admin/rewards/id] Erro:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}

/**
 * Obter uma recompensa específica
 */
async function getReward(req, res, id) {
  try {
    // Buscar a recompensa
    const { data: reward, error } = await supabaseAdmin
      .from('rewards_config')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, message: 'Recompensa não encontrada' });
      }
      
      console.error('Erro ao buscar recompensa:', error);
      return res.status(500).json({ success: false, message: 'Erro ao acessar banco de dados' });
    }
    
    return res.status(200).json({ success: true, reward });
  } catch (error) {
    console.error('Erro ao buscar recompensa:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}

/**
 * Atualizar uma recompensa
 */
async function updateReward(req, res, id, session) {
  try {
    const rewardData = req.body;
    
    // Validar dados
    if (!validateRewardData(rewardData)) {
      return res.status(400).json({ success: false, message: 'Dados inválidos' });
    }
    
    // Verificar se a recompensa existe
    const { data: existingReward, error: checkError } = await supabaseAdmin
      .from('rewards_config')
      .select('id')
      .eq('id', id)
      .single();
      
    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({ success: false, message: 'Recompensa não encontrada' });
      }
      
      console.error('Erro ao verificar recompensa:', checkError);
      return res.status(500).json({ success: false, message: 'Erro ao acessar banco de dados' });
    }
    
    // Atualizar recompensa
    const { data: reward, error } = await supabaseAdmin
      .from('rewards_config')
      .update({
        day: rewardData.day,
        reward_type: rewardData.reward_type || 'item',
        item_name: rewardData.item_name,
        item_shortname: rewardData.item_shortname,
        amount: rewardData.amount,
        vip_level: rewardData.vip_level || 'none',
        is_bonus: rewardData.is_bonus || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao atualizar recompensa:', error);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar recompensa' });
    }
    
    // Registrar log de sincronização
    await logSyncEvent('website', 'success', 'Recompensa atualizada', {
      admin: session.user.email,
      rewardId: reward.id,
      day: reward.day,
      vipLevel: reward.vip_level
    });
    
    return res.status(200).json({ success: true, reward });
  } catch (error) {
    console.error('Erro ao atualizar recompensa:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}

/**
 * Excluir uma recompensa
 */
async function deleteReward(req, res, id, session) {
  try {
    // Buscar a recompensa antes de excluir (para logs)
    const { data: rewardToDelete, error: fetchError } = await supabaseAdmin
      .from('rewards_config')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ success: false, message: 'Recompensa não encontrada' });
      }
      
      console.error('Erro ao buscar recompensa para exclusão:', fetchError);
      return res.status(500).json({ success: false, message: 'Erro ao acessar banco de dados' });
    }
    
    // Excluir recompensa
    const { error } = await supabaseAdmin
      .from('rewards_config')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Erro ao excluir recompensa:', error);
      return res.status(500).json({ success: false, message: 'Erro ao excluir recompensa' });
    }
    
    // Registrar log de sincronização
    await logSyncEvent('website', 'success', 'Recompensa excluída', {
      admin: session.user.email,
      rewardId: id,
      day: rewardToDelete.day,
      vipLevel: rewardToDelete.vip_level,
      item: rewardToDelete.item_name
    });
    
    return res.status(200).json({ success: true, message: 'Recompensa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir recompensa:', error);
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