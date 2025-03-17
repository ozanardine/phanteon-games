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
      console.error('NEXT_PUBLIC_API_URL não está definido!');
      return res.status(500).json({ 
        success: false, 
        message: 'API URL não configurada',
        errorCode: 'API_CONFIG_ERROR'
      });
    }
    
    // Chamar a API do servidor com o endpoint correto
    try {
      const data = await fetchAPI(`/api/cases/${gameType}`);
      
      if (!data.success) {
        return res.status(400).json({ success: false, message: data.message });
      }
      
      return res.status(200).json({ success: true, cases: data.cases });
    } catch (apiError) {
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