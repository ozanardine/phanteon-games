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
    
    // Chamar a API do servidor para obter detalhes da caixa
    const data = await fetchAPI(`/api/cases/detail/${id}`);
    
    if (!data.success) {
      return res.status(400).json({ success: false, message: data.message });
    }
    
    return res.status(200).json({ 
      success: true, 
      case: data.case,
      items: data.items
    });
  } catch (error) {
    console.error('Error fetching case details:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}