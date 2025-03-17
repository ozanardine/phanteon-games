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
    
    // Chamar a API do servidor para obter caixas com autenticação
    const data = await fetchAPI(`/player/cases/${gameType}`);
    
    if (!data.success) {
      return res.status(400).json({ success: false, message: data.message });
    }
    
    return res.status(200).json({ success: true, cases: data.cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 