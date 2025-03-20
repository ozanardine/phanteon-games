import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { supabaseAdmin } from '../../../../lib/supabase';

/**
 * API para obter estatísticas de recompensas (admin)
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
    
    // Apenas método GET é permitido
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Método não permitido' });
    }
    
    // Obter estatísticas
    try {
      // Buscar todas as estatísticas
      const { data: statistics, error } = await supabaseAdmin
        .from('rewards_statistics')
        .select('*')
        .order('day', { ascending: true })
        .order('vip_level', { ascending: true });
        
      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return res.status(500).json({ success: false, message: 'Erro ao acessar banco de dados' });
      }
      
      // Calcular totais por dia e nível VIP
      const totalByDay = {};
      const totalByVipLevel = {};
      
      statistics.forEach(stat => {
        // Por dia
        if (!totalByDay[stat.day]) {
          totalByDay[stat.day] = 0;
        }
        totalByDay[stat.day] += stat.claim_count;
        
        // Por nível VIP
        if (!totalByVipLevel[stat.vip_level]) {
          totalByVipLevel[stat.vip_level] = 0;
        }
        totalByVipLevel[stat.vip_level] += stat.claim_count;
      });
      
      // Calcular total geral
      const total = statistics.reduce((sum, stat) => sum + stat.claim_count, 0);
      
      return res.status(200).json({
        success: true,
        statistics,
        summary: {
          byDay: totalByDay,
          byVipLevel: totalByVipLevel,
          total
        }
      });
    } catch (error) {
      console.error('Erro ao processar estatísticas:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  } catch (error) {
    console.error('[API:admin/rewards/statistics] Erro:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
} 