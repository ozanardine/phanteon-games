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
    const { userId, caseId, steamId } = req.body;
    
    if (!userId || !caseId) {
      return res.status(400).json({ success: false, message: 'User ID and Case ID are required' });
    }
    
    // Verificar se o usuário está acessando seus próprios dados
    if (userId !== session.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    // Preparar dados para enviar à API
    const apiRequestData = {
      userId: userId,
      caseId: caseId,
      steamId: steamId || session.user.steamId
    };
    
    // Chamar a API do servidor para abrir a caixa
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/cases/open`, {
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
      opening: data.opening,
      item: data.item,
      allItems: data.allItems,
      case: data.case
    });
  } catch (error) {
    console.error('Error opening case:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 