import { getSession } from 'next-auth/react';
import { fetchAPI } from '../../../utils/api';
import { v4 as uuidv4 } from 'uuid';

// Cache para prevenir múltiplas aberturas simultâneas
const inProgressOpenings = new Map();
// Limpa entradas antigas do cache a cada minuto
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of inProgressOpenings.entries()) {
    if (now - value.timestamp > 60000) { // 1 minuto
      inProgressOpenings.delete(key);
    }
  }
}, 60000);

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
    const { caseId, userId, steamId, sessionId } = req.body;
    
    if (!caseId || !userId) {
      return res.status(400).json({ success: false, message: 'Case ID and user ID are required' });
    }
    
    // Verificar se o usuário está tentando abrir seu próprio caso (segurança adicional)
    if (userId !== session.user.id) {
      console.warn(`[Security] User ${session.user.id} tried to open case for another user ${userId}`);
      return res.status(403).json({ success: false, message: 'You can only open cases for your own account' });
    }
    
    // Verificar se já existe uma operação em andamento para este usuário/caixa
    const cacheKey = `${userId}:${caseId}`;
    if (inProgressOpenings.has(cacheKey)) {
      console.warn(`[Rate Limit] Duplicate case opening attempt: ${cacheKey}`);
      return res.status(429).json({ success: false, message: 'Please wait before trying again' });
    }
    
    // Marcar como em andamento
    inProgressOpenings.set(cacheKey, { 
      timestamp: Date.now(),
      sessionId: sessionId || uuidv4() 
    });
    
    try {
      // Configurar cabeçalhos para segurança
      const headers = {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
        'X-Session-ID': sessionId || 'none',
        'X-Request-ID': uuidv4()
      };
      
      // Preparar payload para a API
      const payload = {
        caseId,
        userId,
        steamId: steamId || '',
        timestamp: new Date().toISOString(),
        sessionId: sessionId || uuidv4()
      };
      
      // Chamar a API do servidor para abrir a caixa
      const data = await fetchAPI('/api/cases/open', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      // Remover do cache quando completado
      inProgressOpenings.delete(cacheKey);
      
      return res.status(200).json(data);
    } catch (error) {
      // Remover do cache em caso de erro
      inProgressOpenings.delete(cacheKey);
      throw error;
    }
  } catch (error) {
    console.error('Error opening case:', error);
    
    // Tentar fornecer mensagens de erro mais informativas
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.message.includes('not found') || error.message.includes('404')) {
      errorMessage = 'Case not found';
      statusCode = 404;
    } else if (error.message.includes('cooldown') || error.message.includes('wait')) {
      errorMessage = 'This case is on cooldown. Please try again later.';
      statusCode = 429;
    } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      errorMessage = 'Session expired. Please login again.';
      statusCode = 401;
    }
    
    return res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}