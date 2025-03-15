// src/pages/api/server-status.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Buscar todos os servidores para obter estatísticas reais
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://www.phanteongames.com';
    const serversRes = await fetch(`${baseUrl}/api/servers`);
    
    if (serversRes.ok) {
      const servers = await serversRes.json();
      
      if (Array.isArray(servers)) {
        // Contar servidores online
        const onlineServers = servers.filter(server => server.status === 'online');
        const onlineServersCount = onlineServers.length;
        
        // Somar todos os jogadores online em todos os servidores
        const totalPlayers = servers.reduce((total, server) => {
          return total + (server.players || 0);
        }, 0);
        
        // Obter detalhes do servidor principal para manter compatibilidade
        const mainServer = servers.find(s => s.id === '32225312') || servers[0] || {};
        
        return res.status(200).json({
          name: mainServer.name || 'Phanteon Games Rust Server',
          status: mainServer.status || 'unknown',
          players: totalPlayers,
          maxPlayers: mainServer.maxPlayers || 100,
          address: mainServer.address || 'Unknown',
          map: mainServer.map || 'Unknown',
          seed: mainServer.seed || '1708110947',
          worldSize: mainServer.worldSize || '4500',
          lastWipe: mainServer.lastWipe,
          // Adicionar estatísticas gerais
          totalServers: servers.length,
          onlineServers: onlineServersCount
        });
      }
    }
    
    // Fallback para chamada direta ao BattleMetrics se a nova API falhar
    const serverId = '32225312'; // ID fixo do servidor do Phanteon Games
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
      lastWipe: details.rust_last_wipe,
      // Valores padrão para estatísticas gerais
      totalServers: 1,
      onlineServers: attributes.status === 'online' ? 1 : 0
    };
    
    return res.status(200).json(serverData);
  } catch (error) {
    console.error('Error fetching server data:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch server data' });
  }
}
