// pages/api/admin/system/health.js - API para monitoramento de saúde do sistema
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { checkSystemHealth, logEvent } from '../../../../lib/monitoring';

export default async function handler(req, res) {
  try {
    // Verificar autenticação
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    // Verificar se o usuário é admin
    if (session.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acesso restrito a administradores' });
    }

    // Obter status atual do sistema
    const healthStatus = await checkSystemHealth();
    
    // Retornar status completo para administradores
    return res.status(200).json({
      success: true,
      healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Admin:health] Erro ao verificar saúde do sistema:', error);
    
    // Registrar erro
    await logEvent('system_health_check_error', {
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao verificar saúde do sistema',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
} 