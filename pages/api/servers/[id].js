// pages/api/servers/[id].js

// Server details with expanded information
const serversDetails = {
  "32225312": {
    id: "32225312", 
    name: "Rust Survival",
    game: "rust",
    status: "online",
    players: 0,
    maxPlayers: 60,
    address: "Unknown",
    map: "Unknown",
    seed: "328564061",
    worldSize: "4000",
    description: "Servidor focado em te proporcionar a melhor experiência de sobrevivência e aproveitar todos os recursos do jogo. Regras balanceadas, economia sustentável e comunidade ativa te esperam.",
    logo: "logo.png",
    wipeSchedule: "Primeira quinta-feira do mês",
    features: ["Casual", "Survival", "2x", "Events"],
    modded: false,
    rules: [
      "Não é permitido usar cheats ou exploits",
      "Respeite outros jogadores no chat",
      "Construções tóxicas serão removidas",
      "Times limitados a 5 membros"
    ],
    discordUrl: "https://discord.gg/v8575VMgPW",
    connectCommand: "client.connect 82.29.62.21:28015",
    nextWipe: "2025-04-07T12:00:00Z",
    adminContacts: ["Discord: thezanardine"],
    bannerImage: "/images/rust_banner.png",
    /*mods: [
      "PVP Enhancement",
      "Better Loot",
      "Arena Framework",
      "Advanced Combat"
    ]*/
  }
};

// Dados mockados para o leaderboard e eventos
const mockLeaderboard = {
  "32225312": [
    { playerId: "1", playerName: "PhanteonPlayer1", kills: 150, deaths: 45, playtime: 1820, lastSeen: "2023-03-01T10:23:00Z" },
    { playerId: "2", playerName: "RustWarrior", kills: 120, deaths: 38, playtime: 1540, lastSeen: "2023-03-02T18:15:00Z" },
    { playerId: "3", playerName: "IronBuilder", kills: 95, deaths: 52, playtime: 2100, lastSeen: "2023-03-03T14:30:00Z" },
    { playerId: "4", playerName: "SaltyRaider", kills: 88, deaths: 60, playtime: 1320, lastSeen: "2023-03-02T21:45:00Z" },
    { playerId: "5", playerName: "BaseMaster", kills: 75, deaths: 30, playtime: 990, lastSeen: "2023-03-03T08:10:00Z" },
    { playerId: "6", playerName: "RaidMaster", kills: 67, deaths: 42, playtime: 850, lastSeen: "2023-03-02T15:20:00Z" },
    { playerId: "7", playerName: "RustSniper", kills: 61, deaths: 25, playtime: 780, lastSeen: "2023-03-03T09:45:00Z" },
    { playerId: "8", playerName: "BradleyKiller", kills: 58, deaths: 33, playtime: 920, lastSeen: "2023-03-01T22:30:00Z" },
    { playerId: "9", playerName: "HeliHunter", kills: 52, deaths: 28, playtime: 650, lastSeen: "2023-03-02T17:15:00Z" },
    { playerId: "10", playerName: "ScrapCollector", kills: 45, deaths: 30, playtime: 1100, lastSeen: "2023-03-03T11:40:00Z" },
    { playerId: "11", playerName: "OilRigDominator", kills: 40, deaths: 22, playtime: 580, lastSeen: "2023-03-02T14:55:00Z" },
    { playerId: "12", playerName: "CargoRunner", kills: 38, deaths: 18, playtime: 720, lastSeen: "2023-03-01T19:20:00Z" },
    { playerId: "13", playerName: "RocketLauncher", kills: 35, deaths: 24, playtime: 430, lastSeen: "2023-03-03T13:10:00Z" },
    { playerId: "14", playerName: "SulfurFarmer", kills: 30, deaths: 35, playtime: 860, lastSeen: "2023-03-02T16:05:00Z" },
    { playerId: "15", playerName: "BaseDesigner", kills: 25, deaths: 20, playtime: 1250, lastSeen: "2023-03-01T12:45:00Z" }
  ]
};

const mockEvents = {
  "32225312": [
    { 
      id: "1", 
      title: "Wipe Semanal", 
      description: "Reset completo do servidor, incluindo itens, construções e blueprints.", 
      date: "2025-03-20T12:00:00Z",
      image: "/images/events/wipe.jpg"
    }
  ]
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Server ID is required' });
  }
  
  try {
    // Get the cached server details
    const serverData = serversDetails[id];
    
    if (!serverData) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    let updatedServer = JSON.parse(JSON.stringify(serverData));
    
    // Update data from BattleMetrics for Rust servers
    if (serverData.game === 'rust') {
      try {
        console.log(`Fetching BattleMetrics data for server ${id}`);
        const response = await fetch(`https://api.battlemetrics.com/servers/${id}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.data) {
            console.log(`Successfully fetched BattleMetrics data for server ${id}`);
            const serverInfo = data.data;
            const attributes = serverInfo.attributes;
            const details = attributes.details || {};
            
            // Update server with live data from BattleMetrics
            updatedServer.status = attributes.status || updatedServer.status;
            updatedServer.players = attributes.players || 0;
            updatedServer.maxPlayers = attributes.maxPlayers || updatedServer.maxPlayers;
            updatedServer.address = `${attributes.ip}:${attributes.port}` || updatedServer.address;
            updatedServer.map = details.map || updatedServer.map;
            updatedServer.seed = details.rust_seed || updatedServer.seed;
            updatedServer.worldSize = details.rust_world_size || updatedServer.worldSize;
            updatedServer.lastWipe = details.rust_last_wipe || updatedServer.lastWipe;
            
            // Log values for debugging
            console.log("Updated server data:", {
              status: updatedServer.status,
              players: updatedServer.players,
              map: updatedServer.map,
              seed: updatedServer.seed
            });
          } else {
            console.warn(`Invalid data structure from BattleMetrics for server ${id}`);
          }
        } else {
          console.warn(`BattleMetrics API returned status ${response.status} for server ${id}`);
        }
      } catch (error) {
        console.error(`Error fetching BattleMetrics data for server ${id}:`, error);
      }
    }
    
    // Get leaderboard and events data
    const leaderboard = mockLeaderboard[id] || [];
    const events = mockEvents[id] || [];
    
    // Return complete server data
    return res.status(200).json({
      server: updatedServer,
      leaderboard,
      events
    });
  } catch (error) {
    console.error('Error fetching server details:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch server details' });
  }
}