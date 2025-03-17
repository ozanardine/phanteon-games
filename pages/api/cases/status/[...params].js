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
    
    // Obter parâmetros da rota dinâmica
    const { params } = req.query;
    
    if (!params || params.length < 2) {
      return res.status(400).json({ success: false, message: 'Case ID and user ID are required' });
    }
    
    const [caseId, userId] = params;
    
    // Verificar se o usuário está acessando seus próprios dados
    if (userId !== session.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    // Chamar a API do servidor para verificar status
    const data = await fetchAPI(`/api/cases/status/${caseId}/${userId}`);
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error checking case status:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 