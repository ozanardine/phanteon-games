import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { supabaseAdmin } from '../../../../lib/supabase';

/**
 * API para obter logs de sincronização (admin)
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
    
    // Obter parâmetros de consulta
    const limit = parseInt(req.query.limit) || 100;
    const source = req.query.source;
    const status = req.query.status;
    
    // Consultar logs
    try {
      // Construir query base
      let query = supabaseAdmin
        .from('rewards_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
        
      // Adicionar filtros se fornecidos
      if (source) {
        query = query.eq('source', source);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      // Executar query
      const { data: logs, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar logs:', error);
        return res.status(500).json({ success: false, message: 'Erro ao acessar banco de dados' });
      }
      
      return res.status(200).json({
        success: true,
        logs
      });
    } catch (error) {
      console.error('Erro ao processar logs:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  } catch (error) {
    console.error('[API:admin/rewards/logs] Erro:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
} 