import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Endpoint que seria usado para checar status dos servidores
// Em um cenário real, seria uma integração com os servidores de jogos

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Server ID is required' });
    }
    
    // Em um cenário real, consultaria o status do servidor no sistema de jogos
    // Aqui, apenas retornamos dados mockados para simulação
    
    const { data, error } = await supabaseAdmin
      .from('servers')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      throw error;
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Simula status atualizado
    const isOnline = Math.random() > 0.2; // 80% de chance de estar online
    const players = isOnline ? Math.floor(Math.random() * data.players_max) : 0;
    
    const updatedData = {
      ...data,
      status: isOnline ? 'online' : 'offline',
      players_current: players,
      last_online: new Date().toISOString(),
    };
    
    // Atualiza o status no banco de dados
    await supabaseAdmin
      .from('servers')
      .update({
        status: updatedData.status,
        players_current: updatedData.players_current,
        last_online: updatedData.last_online,
      })
      .eq('id', id);
    
    return res.status(200).json(updatedData);
  } catch (error) {
    console.error('Error checking server status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}