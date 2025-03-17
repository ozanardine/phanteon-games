import { getSession } from 'next-auth/react';
import { fetchAPI } from '../../../utils/api';

export default async function handler(req, res) {
  // Verificar método
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Obter sessão do usuário (opcional, pois a lista de caixas é pública)
    const session = await getSession({ req });
    
    // Obter tipo de jogo da rota dinâmica
    const { gameType } = req.query;
    
    if (!gameType) {
      return res.status(400).json({ success: false, message: 'Game type is required' });
    }
    
    // Verificar se a variável de ambiente está configurada corretamente
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error('[API Debug] NEXT_PUBLIC_API_URL não está definido!');
      return res.status(500).json({ 
        success: false, 
        message: 'API URL não configurada',
        errorCode: 'API_CONFIG_ERROR'
      });
    }
    
    console.log(`[API Debug] URL da API: ${process.env.NEXT_PUBLIC_API_URL}`);
    console.log(`[API Debug] Token configurado: ${process.env.RUST_API_KEY ? 'Sim' : 'Não'}`);
    
    // Chamar a API do servidor com o endpoint correto validado pelo Postman
    try {
      // Vamos tentar o endpoint exato que funciona no Postman
      const endpoint = `/api/cases/${gameType}`;
      console.log(`[API Debug] Tentando acessar endpoint: ${endpoint}`);
      
      const data = await fetchAPI(endpoint);
      
      if (!data.success) {
        console.log(`[API Debug] API retornou success=false. Mensagem: ${data.message}`);
        return res.status(400).json({ success: false, message: data.message });
      }
      
      console.log(`[API Debug] API retornou ${data.cases?.length || 0} caixas com sucesso`);
      return res.status(200).json({ success: true, cases: data.cases });
    } catch (apiError) {
      console.error(`[API Debug] Erro detalhado: ${apiError.stack || apiError}`);
      console.error(`API error for /api/cases/${gameType}:`, apiError.message);
      
      return res.status(503).json({ 
        success: false, 
        message: `Erro ao acessar API externa: ${apiError.message}`,
        errorCode: 'API_CONNECTION_ERROR',
        errorDetail: apiError.stack ? apiError.stack.split('\n')[0] : null
      });
    }
  } catch (error) {
    console.error('Error fetching cases:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      errorDetail: error.message
    });
  }
} 