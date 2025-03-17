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
    
    // Verificar se variáveis de ambiente necessárias estão definidas
    if (!process.env.RUST_API_KEY) {
      console.error('RUST_API_KEY não está definida!');
      return res.status(500).json({ 
        success: false, 
        message: 'API key não configurada',
        errorCode: 'API_CONFIG_ERROR'
      });
    }
    
    // Chamar a API externa para obter as caixas do tipo de jogo especificado
    try {
      // Não inclua '/api' no caminho, pois fetchAPI já adiciona
      const data = await fetchAPI(`/cases/${gameType}`);
      
      // Retornar resposta da API
      return res.status(200).json(data);
    } catch (apiError) {
      console.error(`API error for /cases/${gameType}:`, apiError.message);
      
      const statusCode = apiError.status || 503;
      
      return res.status(statusCode).json({ 
        success: false, 
        message: `Erro ao acessar API externa: ${apiError.message}`,
        errorCode: 'API_CONNECTION_ERROR',
        errorDetail: apiError.details || null
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