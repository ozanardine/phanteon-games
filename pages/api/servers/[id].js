// src/pages/api/servers/[id].js

// Lista de servidores para busca rápida
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
      date: "2023-03-10T12:00:00Z" 
    },
    { 
      id: "2", 
      title: "Evento PVP Arena", 
      description: "Competição PVP com premiações para os melhores jogadores. Local: Monument X.", 
      date: "2023-03-12T18:00:00Z",
      image: "https://cdn.discordapp.com/attachments/1088543257835413549/1214690097329176746/pvpeventmarch.png"
    },
    { 
      id: "3", 
      title: "Raid Boss Challenge", 
      description: "Derrote o boss e ganhe recompensas exclusivas!", 
      date: "2023-03-15T20:00:00Z" 
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
    // Encontrar o servidor pelo ID
    const serverData = servers.find(s => s.id === id);
    
    if (!serverData) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    let updatedServer = { ...serverData };
    
    // Buscar dados atualizados do BattleMetrics para servidores Rust
    if (serverData.game === 'rust') {
      try {
        const response = await fetch(`https://api.battlemetrics.com/servers/${id}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.data) {
            const serverInfo = data.data;
            const attributes = serverInfo.attributes;
            const details = attributes.details || {};
            
            // O PROBLEMA ESTAVA AQUI: Não preservava a descrição original
            // Atualização: Mantém todos os dados originais e atualiza apenas os específicos da API
            updatedServer = {
              ...serverData, // Preserva todos os dados originais (incluindo description)
              status: attributes.status || serverData.status || 'unknown',
              players: attributes.players || serverData.players || 0,
              maxPlayers: attributes.maxPlayers || serverData.maxPlayers || 100,
              address: `${attributes.ip}:${attributes.port}` || serverData.address || 'Unknown',
              map: details.map || serverData.map || 'Unknown',
              // seed e worldSize não são atualizados da API
              lastWipe: details.rust_last_wipe || serverData.lastWipe
            };
            
            // Log para debug
            console.log(`Servidor Rust atualizado - Preservando descrição: "${updatedServer.description}"`);
          }
        }
      } catch (error) {
        console.error(`Error fetching BattleMetrics data for server ${id}:`, error);
        // Continua com os dados existentes em caso de erro
      }
    }
    
    // Buscar leaderboard e eventos (dados mockados por enquanto)
    const leaderboard = mockLeaderboard[id] || [];
    const events = mockEvents[id] || [];
    
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