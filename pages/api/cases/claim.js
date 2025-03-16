import { getSession } from 'next-auth/react';

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
    
    // Obter dados do corpo da requisição
    const { openingId, steamId, serverId } = req.body;
    
    if (!openingId || !serverId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Opening ID and Server ID are required' 
      });
    }
    
    // Verificar se o Steam ID corresponde ao do usuário autenticado
    const userSteamId = steamId || session.user.steamId;
    
    if (!userSteamId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Steam ID is required' 
      });
    }
    
    // Preparar dados para enviar à API
    const apiRequestData = {
      openingId: openingId,
      steamId: userSteamId,
      serverId: serverId
    };
    
    // Chamar a API do servidor para resgatar o item
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/cases/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequestData),
    });
    
    const data = await apiResponse.json();
    
    if (!data.success) {
      return res.status(400).json({ success: false, message: data.message });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: data.message
    });
  } catch (error) {
    console.error('Error claiming case item:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 