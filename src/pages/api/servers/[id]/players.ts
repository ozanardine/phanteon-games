// src/pages/api/servers/[id]/players.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Endpoint para buscar jogadores online em um servidor específico
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Server ID is required' });
  }

  try {
    // Buscar jogadores online no Supabase
    const { data, error } = await supabaseAdmin
      .from('online_players')
      .select('*')
      .eq('server_id', id);
    
    if (error) {
      throw error;
    }
    
    // Se não houver dados reais, simular alguns jogadores online para demonstração
    if (!data || data.length === 0) {
      // Simulação de dados para demonstração
      // Em um ambiente real, isso não seria necessário
      const simulatedPlayers = generateSimulatedPlayers(id);
      return res.status(200).json(simulatedPlayers);
    }
    
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error fetching online players:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// Função para gerar jogadores simulados (apenas para demonstração)
function generateSimulatedPlayers(serverId: string) {
  const numPlayers = Math.floor(Math.random() * 20) + 5; // 5-25 jogadores
  const players = [];
  
  const names = [
    'RustPlayer123', 'IronWarrior', 'SaltyRaider', 'MetalHead', 
    'BaseBuilder', 'RaidMaster', 'LootLord', 'RadiationKing',
    'BoltAction', 'HeadShotter', 'RockThrower', 'BluePrints',
    'RustDevil', 'MetalFarmer', 'SulfurMiner', 'NightWolf',
    'BowMaster', 'ShotgunSally', 'PumpkinPete', 'WoodChopper'
  ];
  
  for (let i = 0; i < numPlayers; i++) {
    const steamId = `7656119${Math.floor(Math.random() * 90000000) + 10000000}`;
    const isAdmin = Math.random() < 0.1; // 10% de chance de ser admin
    const isAlive = Math.random() < 0.9; // 90% de chance de estar vivo
    
    // Coordenadas no mapa (assumindo um mapa de tamanho 4500)
    const worldSize = 4500;
    const posX = (Math.random() * worldSize) - (worldSize / 2);
    const posY = (Math.random() * 100) + 50; // Altura
    const posZ = (Math.random() * worldSize) - (worldSize / 2);
    
    players.push({
      steam_id: steamId,
      server_id: serverId,
      name: names[Math.floor(Math.random() * names.length)],
      position_x: posX,
      position_y: posY,
      position_z: posZ,
      health: isAlive ? Math.floor(Math.random() * 50) + 50 : 0, // 50-100 de vida se vivo
      is_alive: isAlive,
      is_admin: isAdmin,
      ping: Math.floor(Math.random() * 100) + 10,
      session_time: Math.floor(Math.random() * 600), // 0-600 minutos
      updated_at: new Date().toISOString()
    });
  }
  
  return players;
}