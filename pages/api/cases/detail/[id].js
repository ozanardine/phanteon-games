import { getSession } from 'next-auth/react';
import { fetchAPI } from '../../../../utils/api';

export default async function handler(req, res) {
  // Verificar método
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Obter sessão do usuário
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Obter ID da caixa da rota dinâmica
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'Case ID is required' });
    }
    
    // Verificar se variáveis de ambiente necessárias estão definidas
    if (!process.env.RUST_API_KEY) {
      console.error('RUST_API_KEY não está definida!');
      return res.status(500).json({ 
        success: false, 
        message: 'API key não configurada',
        errorCode: 'API_CONFIG_ERROR'
      });
    }
    
    // Chamar a API externa para obter detalhes da caixa
    try {
      // Não inclua '/api' no caminho, pois fetchAPI já adiciona
      const data = await fetchAPI(`/cases/detail/${id}`);
      
      // Retornar resposta da API
      return res.status(200).json(data);
    } catch (apiError) {
      console.error(`API error for /cases/detail/${id}:`, apiError.message);
      
      const statusCode = apiError.status || 503;
      
      return res.status(statusCode).json({ 
        success: false, 
        message: `Erro ao acessar API externa: ${apiError.message}`,
        errorCode: 'API_CONNECTION_ERROR',
        errorDetail: apiError.details || null
      });
    }
  } catch (error) {
    console.error('Error fetching case details:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      errorDetail: error.message
    });
  }
}