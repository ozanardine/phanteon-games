// src/pages/api/servers/index.js

// Lista de servidores ativos na comunidade
const servers = [
  {
    id: "32225312", // ID do servidor no BattleMetrics
    name: "Rust Survival",
    game: "rust",
    status: "online",
    players: 0,
    maxPlayers: 60,
    address: "Unknown", // Será preenchido pela API
    map: "Unknown", // Será preenchido pela API
    seed: "1708110947",
    worldSize: "4500",
    description: "Servidor focado em te proporcionar a melhor experiência de sobrevivência e aproveitar todos os recursos do jogo.",
    logo: "https://i.imgur.com/PFUYbUz.png"
  }
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const game = req.query.game;
  
  try {
    // Atualizar os dados dos servidores com informações do BattleMetrics
    const updatedServers = await Promise.all(
      servers
        .filter(server => !game || server.game === game)
        .map(async (server) => {
          // Só busca detalhes do BattleMetrics para servidores Rust por enquanto
          if (server.game === 'rust') {
            try {
              const response = await fetch(`https://api.battlemetrics.com/servers/${server.id}`);
              
              if (!response.ok) {
                console.warn(`BattleMetrics API returned ${response.status} for server ${server.id}`);
                return server;
              }
              
              const data = await response.json();
              
              if (!data || !data.data) {
                console.warn(`Invalid response from BattleMetrics for server ${server.id}`);
                return server;
              }
              
              const serverInfo = data.data;
              const attributes = serverInfo.attributes;
              const details = attributes.details || {};
              
              return {
                ...server,
                status: attributes.status || 'unknown',
                players: attributes.players || 0,
                maxPlayers: attributes.maxPlayers || 100,
                address: `${attributes.ip}:${attributes.port}` || 'Unknown',
                map: details.map || 'Unknown',
                seed: details.rust_seed || server.seed,
                worldSize: details.rust_world_size || server.worldSize,
                lastWipe: details.rust_last_wipe
              };
            } catch (error) {
              console.error(`Error fetching data for server ${server.id}:`, error);
              return server;
            }
          }
          
          return server;
        })
    );
    
    return res.status(200).json(updatedServers);
  } catch (error) {
    console.error('Error processing server data:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch server data' });
  }
}
