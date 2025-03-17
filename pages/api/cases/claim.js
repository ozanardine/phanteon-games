import { getSession } from 'next-auth/react';
import { fetchAPI } from '../../../utils/api';

export default async function handler(req, res) {
  // Verificar método
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Obter sessão do usuário
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Validar dados do corpo da requisição
    const { openingId, steamId } = req.body;
    
    if (!openingId) {
      return res.status(400).json({ success: false, message: 'Opening ID is required' });
    }
    
    // Preparar dados para enviar à API
    const payload = {
      openingId,
      steamId: steamId || ''
    };
    
    // Chamar a API do servidor para reclamar o item
    const data = await fetchAPI('/api/cases/claim', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error claiming case item:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 