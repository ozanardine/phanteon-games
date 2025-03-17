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
    
    // Chamar a API do servidor para obter caixas com autenticação - tentar diferentes formatos de endpoint
    try {
      // Primeiro, tente o caminho original
      try {
        console.log(`Tentando acessar endpoint: /player/cases/${gameType}`);
        const data = await fetchAPI(`/player/cases/${gameType}`);
        
        if (data.success) {
          return res.status(200).json({ success: true, cases: data.cases });
        }
      } catch (originalError) {
        console.log(`Falha no endpoint original: ${originalError.message}`);
        // Se o original falhar, continue tentando alternativas
      }
      
      // Alternativa 1: Tentar sem o prefixo /player
      try {
        console.log(`Tentando acessar endpoint alternativo 1: /cases/${gameType}`);
        const data = await fetchAPI(`/cases/${gameType}`);
        
        if (data.success) {
          return res.status(200).json({ success: true, cases: data.cases });
        }
      } catch (alt1Error) {
        console.log(`Falha no endpoint alternativo 1: ${alt1Error.message}`);
      }
      
      // Alternativa 2: Tentar com outro formato
      try {
        console.log(`Tentando acessar endpoint alternativo 2: /game/${gameType}/cases`);
        const data = await fetchAPI(`/game/${gameType}/cases`);
        
        if (data.success) {
          return res.status(200).json({ success: true, cases: data.cases });
        }
      } catch (alt2Error) {
        console.log(`Falha no endpoint alternativo 2: ${alt2Error.message}`);
      }
      
      // Se chegamos aqui, nenhuma das alternativas funcionou
      return res.status(503).json({ 
        success: false, 
        message: `Não foi possível encontrar o endpoint para ${gameType}. Entre em contato com o suporte.`,
        errorCode: 'ENDPOINT_NOT_FOUND'
      });
    } catch (apiError) {
      console.error(`API error for /player/cases/${gameType}:`, apiError.message);
      return res.status(503).json({ 
        success: false, 
        message: `Erro ao acessar API externa: ${apiError.message}`,
        errorCode: 'API_CONNECTION_ERROR'
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