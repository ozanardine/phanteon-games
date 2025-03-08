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
    seed: "1708110947",
    worldSize: "4500",
    description: "Servidor focado em te proporcionar a melhor experiência de sobrevivência e aproveitar todos os recursos do jogo. Regras balanceadas, economia sustentável e comunidade ativa te esperam.",
    logo: "/images/rust_survival.jpg",
    wipeSchedule: "Primeira quinta-feira do mês",
    features: ["PVP", "Base Building", "Trading", "Events"],
    modded: false,
    rules: [
      "Não é permitido usar cheats ou exploits",
      "Respeite outros jogadores no chat",
      "Raid apenas após 48h de wipe",
      "Construções tóxicas serão removidas",
      "Clans limitados a 8 membros"
    ],
    discordUrl: "https://discord.gg/v8575VMgPW",
    connectCommand: "client.connect 82.29.62.21:28015",
    nextWipe: "2025-04-07T12:00:00Z",
    adminContacts: ["Phanteon#1234", "Rust_Admin#5678"],
    bannerImage: "/images/rust_banner3.png"
  },
  "32225313": {
    id: "32225313", 
    name: "Rust PVP Arena",
    game: "rust",
    status: "online",
    players: 0,
    maxPlayers: 40,
    address: "Unknown",
    map: "Unknown",
    seed: "1708110948",
    worldSize: "3000",
    description: "Arena de PVP com eventos constantes e combates intensos. Ideal para quem busca ação. Servidor com mods que aumentam a frequência de PVP e tornam os combates mais dinâmicos.",
    logo: "/images/rust_pvp.jpg",
    wipeSchedule: "Quinzenalmente",
    features: ["PVP", "Arena", "Events", "Weekly Tournaments"],
    modded: true,
    rules: [
      "Sem toxicidade no chat",
      "Proibido uso de cheats",
      "Áreas demarcadas para eventos são zonas neutras",
      "Regras específicas durante torneios",
      "Respeito aos admins e moderadores"
    ],
    discordUrl: "https://discord.gg/v8575VMgPW",
    connectCommand: "client.connect 82.29.62.21:28016",
    nextWipe: "2025-03-21T12:00:00Z",
    adminContacts: ["PVP_Admin#1234", "Arena_Mod#5678"],
    bannerImage: "/images/rust_banner3.png",
    mods: [
      "PVP Enhancement",
      "Better Loot",
      "Arena Framework",
      "Advanced Combat"
    ]
  },
  "32225314": {
    id: "32225314", 
    name: "Rust Creative",
    game: "rust",
    status: "online",
    players: 0,
    maxPlayers: 30,
    address: "Unknown",
    map: "Unknown",
    seed: "1708110949",
    worldSize: "5000",
    description: "Servidor criativo para construção e experimentação. Recursos infinitos e sem raid. Ideal para testar novas construções e designs de base antes de implementar em servidores survival.",
    logo: "/images/rust_creative.jpg",
    wipeSchedule: "Mensalmente",
    features: ["Creative", "Building", "No Raid", "Unlimited Resources"],
    modded: true,
    rules: [
      "Proibido destruir construções de outros jogadores",
      "Eventos de construção todas as sextas",
      "Recursos são infinitos para todos",
      "Áreas reservadas para builds comunitárias",
      "Use /help para comandos específicos"
    ],
    discordUrl: "https://discord.gg/v8575VMgPW",
    connectCommand: "client.connect 82.29.62.21:28017",
    nextWipe: "2025-04-01T12:00:00Z",
    adminContacts: ["Creative_Admin#1234"],
    bannerImage: "/images/rust_banner3.png",
    mods: [
      "Creative Mode",
      "Building Plus",
      "Copy/Paste Tool",
      "Unlimited Resources"
    ]
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
    },
    { 
      id: "2", 
      title: "Evento PVP Arena", 
      description: "Competição PVP com premiações para os melhores jogadores. Local: Monument X.", 
      date: "2025-03-22T18:00:00Z",
      image: "/images/events/pvp.jpg"
    },
    { 
      id: "3", 
      title: "Raid Boss Challenge", 
      description: "Derrote o boss e ganhe recompensas exclusivas!", 
      date: "2025-03-25T20:00:00Z",
      image: "/images/events/boss.jpg"
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