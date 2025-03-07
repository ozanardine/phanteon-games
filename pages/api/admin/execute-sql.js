import { supabaseAdmin } from '../../../lib/supabase';

// ATENÇÃO: Este endpoint é apenas para uso administrativo e deve ser protegido
// ou removido em ambiente de produção

export default async function handler(req, res) {
  // Verificar método
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  // Verificar autenticação administrativa (isso deve ser melhorado em produção)
  // Por exemplo, você pode verificar se o usuário tem role="admin"
  
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Query SQL não fornecida ou inválida' 
      });
    }
    
    // Executar a query SQL
    const { data, error } = await supabaseAdmin.rpc('pgcall', { query });
    
    if (error) {
      console.error('Erro ao executar SQL:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao executar SQL',
        error
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'SQL executado com sucesso',
      result: data
    });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}
