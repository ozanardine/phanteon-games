// src/pages/api/server-status.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serverId = '32225312'; // ID fixo do servidor do Phanteon Games

  try {
    // Redirecionando para a nova API de servidores
    // Construir URL absoluta para evitar erro de parsing
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://www.phanteongames.com';
    const internalRes = await fetch(`${baseUrl}/api/servers/${serverId}`);
    
    if (internalRes.ok) {
      const data = await internalRes.json();
      
      if (data && data.server) {
        return res.status(200).json({
          name: data.server.name,
          status: data.server.status,
          players: data.server.players,
          maxPlayers: data.server.maxPlayers,
          address: data.server.address,
          map: data.server.map,
          seed: data.server.seed,
          worldSize: data.server.worldSize,
          lastWipe: data.server.lastWipe
        });
      }
    }
    
    // Fallback para chamada direta ao BattleMetrics se a nova API falhar
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
    
    const serverData = {
      name: attributes.name || 'Phanteon Games Rust Server',
      status: attributes.status || 'unknown',
      players: attributes.players || 0,
      maxPlayers: attributes.maxPlayers || 100,
      address: `${attributes.ip}:${attributes.port}` || 'Unknown',
      map: details.map || 'Unknown',
      seed: details.rust_seed || '1708110947', // Adicionando valor padrão
      worldSize: details.rust_world_size || '4500',
      lastWipe: details.rust_last_wipe
    };
    
    return res.status(200).json(serverData);
  } catch (error) {
    console.error('Error fetching server data:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch server data' });
  }
}
