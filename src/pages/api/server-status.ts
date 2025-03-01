import { NextApiRequest, NextApiResponse } from 'next';
import { fetchServerStatus, fetchServerEvents } from '../../lib/api/steamApi';
import { getNextWipeDate } from '../../lib/utils/dateUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apenas permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Obter endereço do servidor da query ou usar o padrão
    const { server } = req.query;
    const serverAddress = server && typeof server === 'string' 
      ? server 
      : 'game.phanteongames.com:28015';

    // Buscar status do servidor
    const serverStatus = await fetchServerStatus(serverAddress);
    
    // Se houver problema com os eventos, tentar buscar separadamente
    if (!serverStatus.events || serverStatus.events.length === 0) {
      serverStatus.events = await fetchServerEvents(serverAddress);
    }
    
    // Adicionar informações de wipe se não existirem
    if (!serverStatus.nextWipe) {
      serverStatus.nextWipe = getNextWipeDate();
    }
    
    if (!serverStatus.lastWipe) {
      // Estimar último wipe com base no próximo
      const lastWipe = new Date(serverStatus.nextWipe);
      lastWipe.setMonth(lastWipe.getMonth() - 1);
      serverStatus.lastWipe = lastWipe;
    }
    
    // Adicionar cabeçalhos de cache (validade de 1 minuto)
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    // Retornar dados do servidor
    return res.status(200).json(serverStatus);
  } catch (error) {
    console.error('Erro ao buscar status do servidor:', error);
    
    return res.status(500).json({
      error: 'Erro interno ao buscar status do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}