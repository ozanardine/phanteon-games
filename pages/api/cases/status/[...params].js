import { getSession } from 'next-auth/react';

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
    
    // Obter parâmetros da rota (caseId e userId)
    const { params } = req.query;
    
    if (!params || params.length < 2) {
      return res.status(400).json({ success: false, message: 'Case ID and User ID are required' });
    }
    
    const [caseId, userId] = params;
    
    // Verificar se o usuário está acessando seus próprios dados
    if (userId !== session.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    // Chamar a API do servidor para verificar o status da caixa
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/cases/status/${caseId}/${userId}`);
    const data = await apiResponse.json();
    
    if (!data.success) {
      return res.status(400).json({ success: false, message: data.message });
    }
    
    return res.status(200).json({ 
      success: true, 
      canOpen: data.canOpen,
      lastOpening: data.lastOpening
    });
  } catch (error) {
    console.error('Error checking case status:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 