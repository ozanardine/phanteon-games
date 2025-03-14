// pages/api/servers/index.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const game = req.query.game;
  
  try {
    // Buscar os servidores do Supabase primeiro
    const { data: serverStats, error } = await supabaseAdmin
      .from('server_stats')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    // Agrupar por server_id para ter apenas o registro mais recente de cada servidor
    const latestServerStats = {};
    serverStats.forEach(stat => {
      if (!latestServerStats[stat.server_id] || 
          new Date(stat.timestamp) > new Date(latestServerStats[stat.server_id].timestamp)) {
        latestServerStats[stat.server_id] = stat;
      }
    });
    
    // Formatar os dados para o formato esperado pela UI
    const formattedServers = Object.values(latestServerStats).map(stat => {
      return {
        id: stat.server_id,
        name: stat.server_name,
        game: "rust", // Assumindo que são servidores Rust
        status: stat.status || "offline",
        players: stat.online_players || 0,
        maxPlayers: stat.max_players || 0,
        address: `${stat.ip}:${stat.port}` || "Unknown",
        map: stat.map || "Unknown",
        seed: stat.seed?.toString() || "",
        worldSize: stat.size?.toString() || "",
        lastWipe: stat.last_wipe,
        description: "Servidor Rust da comunidade Phanteon Games.",
        logo: "/images/rust_banner2.png",
        wipeSchedule: "Primeira quinta-feira do mês"
      };
    });
    
    // Filtrar por jogo se necessário
    const filteredServers = game 
      ? formattedServers.filter(server => server.game === game)
      : formattedServers;
    
    // Se não houver servidores ou se houver erro, tentar o fallback BattleMetrics
    if (filteredServers.length === 0 || error) {
      console.log("Sem dados do Supabase, usando BattleMetrics como fallback");
      return await fallbackToBattleMetrics(req, res, game);
    }
    
    return res.status(200).json(filteredServers);
  } catch (error) {
    console.error('Error fetching server data from Supabase:', error);
    // Em caso de erro, tentar o fallback BattleMetrics
    return await fallbackToBattleMetrics(req, res, game);
  }
}

// Servidores padrão do BattleMetrics como fallback
const defaultServers = [
  {
    id: "32225312", // ID do servidor no BattleMetrics
    name: "Rust Survival #1",
    game: "rust",
    status: "online",
    players: 0,
    maxPlayers: 60,
    address: "Unknown", // Será preenchido pela API
    map: "Unknown", // Será preenchido pela API
    seed: "328564061",
    worldSize: "4000",
    description: "Servidor focado em te proporcionar a melhor experiência de sobrevivência e aproveitar todos os recursos do jogo.",
    logo: "/images/rust_banner2.png",
    wipeSchedule: "Primeira quinta-feira do mês",
    features: ["Casual", "Survival", "2x"],
    modded: false
  }
];

// Função de fallback para BattleMetrics
async function fallbackToBattleMetrics(req, res, game) {
  try {
    // Filtrar servers por jogo se necessário
    const filteredServers = game 
      ? defaultServers.filter(server => server.game === game)
      : defaultServers;
      
    // Atualizar com dados do BattleMetrics
    const updatedServers = await Promise.all(
      filteredServers.map(async (server) => {
        // Deep clone do servidor para evitar mutação
        const updatedServer = JSON.parse(JSON.stringify(server));
        
        // Buscar detalhes do BattleMetrics apenas para servidores Rust
        if (server.game === 'rust') {
          try {
            const response = await fetch(`https://api.battlemetrics.com/servers/${server.id}`);
            
            if (!response.ok) {
              console.warn(`BattleMetrics API returned ${response.status} for server ${server.id}`);
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
            
            // Atualizar objeto do servidor com dados do BattleMetrics
            updatedServer.status = attributes.status || 'unknown';
            updatedServer.players = attributes.players || 0;
            updatedServer.maxPlayers = attributes.maxPlayers || updatedServer.maxPlayers;
            updatedServer.address = `${attributes.ip}:${attributes.port}` || 'Unknown';
            updatedServer.map = details.map || updatedServer.map;
            updatedServer.seed = details.rust_seed || updatedServer.seed;
            updatedServer.worldSize = details.rust_world_size || updatedServer.worldSize;
            updatedServer.lastWipe = details.rust_last_wipe || updatedServer.lastWipe;
            
            // Armazenar URL para debug
            updatedServer._queryUrl = `https://api.battlemetrics.com/servers/${server.id}`;
          } catch (error) {
            console.error(`Error fetching data for server ${server.id}:`, error);
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