// pages/api/servers/index.js

// Improved list of servers with more metadata
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
    seed: "328564061",
    worldSize: "4000",
    description: "Servidor focado em te proporcionar a melhor experiência de sobrevivência e aproveitar todos os recursos do jogo.",
    logo: "logo.png", // Updated to use local path for reliability
    wipeSchedule: "Primeira quinta-feira do mês",
    features: ["Casual", "Survival", "2x", "Events"],
    modded: false
  }
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const game = req.query.game;
  
  try {
    // Create a new array for updated servers to avoid mutation issues
    const updatedServers = await Promise.all(
      servers
        .filter(server => !game || server.game === game)
        .map(async (server) => {
          // Deep clone the server object to avoid mutation
          const updatedServer = JSON.parse(JSON.stringify(server));
          
          // Only fetch details from BattleMetrics for Rust servers
          if (server.game === 'rust') {
            try {
              const response = await fetch(`https://api.battlemetrics.com/servers/${server.id}`);
              
              if (!response.ok) {
                console.warn(`BattleMetrics API returned ${response.status} for server ${server.id}`);
                // If API call fails, still return the server with default values
                return updatedServer;
              }
              
              const data = await response.json();
              
              if (!data || !data.data) {
                console.warn(`Invalid response from BattleMetrics for server ${server.id}`);
                return updatedServer;
              }
              
              const serverInfo = data.data;
              const attributes = serverInfo.attributes;
              const details = attributes.details || {};
              
              // Update server object with fetched data
              updatedServer.status = attributes.status || 'unknown';
              updatedServer.players = attributes.players || 0;
              updatedServer.maxPlayers = attributes.maxPlayers || updatedServer.maxPlayers;
              updatedServer.address = `${attributes.ip}:${attributes.port}` || 'Unknown';
              updatedServer.map = details.map || updatedServer.map;
              updatedServer.seed = details.rust_seed || updatedServer.seed;
              updatedServer.worldSize = details.rust_world_size || updatedServer.worldSize;
              updatedServer.lastWipe = details.rust_last_wipe || updatedServer.lastWipe;
              
              // Add query URL for debugging
              updatedServer._queryUrl = `https://api.battlemetrics.com/servers/${server.id}`;
            } catch (error) {
              console.error(`Error fetching data for server ${server.id}:`, error);
              // Return server with default values if an error occurs
            }
          }
          
          return updatedServer;
        })
    );
    
    return res.status(200).json(updatedServers);
  } catch (error) {
    console.error('Error processing server data:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch server data' });
  }
}