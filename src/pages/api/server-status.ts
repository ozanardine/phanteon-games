// src/pages/api/server-status.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type ServerData = {
  name: string;
  status: string;
  players: number;
  maxPlayers: number;
  address: string;
  map: string;
  seed?: string;
  worldSize?: string;
  lastWipe?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ServerData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serverId = '32225312'; // ID fixo do servidor do Phanteon Games

  try {
    const response = await fetch(`https://api.battlemetrics.com/servers/${serverId}`);
    
    if (!response.ok) {
      throw new Error(`BattleMetrics API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.data) {
      throw new Error('Invalid response from BattleMetrics');
    }
    
    const serverInfo = data.data;
    const attributes = serverInfo.attributes;
    const details = attributes.details || {};
    
    const serverData: ServerData = {
      name: attributes.name || 'Phanteon Games Rust Server',
      status: attributes.status || 'unknown',
      players: attributes.players || 0,
      maxPlayers: attributes.maxPlayers || 100,
      address: `${attributes.ip}:${attributes.port}` || 'Unknown',
      map: details.map || 'Unknown',
      seed: details.rust_seed,
      worldSize: details.rust_world_size,
      lastWipe: details.rust_last_wipe
    };
    
    return res.status(200).json(serverData);
  } catch (error: any) {
    console.error('Error fetching server data:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch server data' });
  }
}