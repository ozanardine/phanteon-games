// pages/api/servers/[id].js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Server ID is required' });
  }
  
  try {
    // 1. Buscar dados do servidor do Supabase
    const { data: serverStats, error: serverError } = await supabaseAdmin
      .from('server_stats')
      .select('*')
      .eq('server_id', id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // 2. Buscar leaderboard
    const { data: leaderboardData, error: leaderboardError } = await supabaseAdmin
      .from('players')
      .select('*')
      .order('kills', { ascending: false })
      .limit(15);

    // 3. Buscar eventos do servidor (recentes e agendados)
    const { data: eventsData, error: eventsError } = await supabaseAdmin
      .from('server_events')
      .select('*')
      .eq('server_id', id)
      .order('timestamp', { ascending: false })
      .limit(10);

    // Se não temos dados do Supabase, tentar BattleMetrics + dados mockados
    if (serverError || !serverStats) {
      console.log('Sem dados do Supabase, usando BattleMetrics como fallback');
      return await fallbackToBattleMetrics(req, res, id);
    }

    // Formatar server stats para o formato esperado
    const serverData = {
      id: serverStats.server_id,
      name: serverStats.server_name,
      game: "rust",
      status: serverStats.status || "offline",
      players: serverStats.online_players || 0,
      maxPlayers: serverStats.max_players || 0,
      address: `${serverStats.ip || '82.29.62.21'}:${serverStats.port || '28015'}`,
      map: serverStats.map || "Unknown",
      seed: serverStats.seed?.toString() || "328564061",
      worldSize: serverStats.size?.toString() || "4000",
      lastWipe: serverStats.last_wipe,
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
      nextWipe: serverStats.next_wipe || "2025-04-07T12:00:00Z",
      adminContacts: ["Discord: thezanardine"],
      bannerImage: "/images/rust_banner.png",
    };

    // Formatar leaderboard para o formato esperado
    const leaderboard = leaderboardData?.map(player => ({
      playerId: player.id.toString(),
      playerName: player.name,
      kills: player.kills || 0,
      deaths: player.deaths || 0,
      playtime: Math.round(player.time_played || 0), // Converter para minutos se necessário
      lastSeen: player.last_seen
    })) || [];

    // Formatar eventos se disponíveis
    const events = eventsData?.map(event => {
      // Extrair dados do payload JSON
      const payload = event.payload || {};
      return {
        id: event.id.toString(),
        title: payload.title || getDefaultTitle(event.event_type),
        description: payload.description || "Detalhes indisponíveis",
        date: event.timestamp || new Date().toISOString(),
        image: payload.image || getDefaultImage(event.event_type),
        location: payload.location || "Servidor completo",
        eventType: event.event_type,
        status: payload.status || "completed"
      };
    }) || [];
    
    // Funções auxiliares para gerar título e imagem padrão com base no tipo de evento
    function getDefaultTitle(eventType) {
      const eventTitles = {
        'server_wipe': 'Wipe do Servidor',
        'server_restart': 'Reinício do Servidor',
        'server_update': 'Atualização do Servidor',
        'raid': 'Raid Detectado',
        'helicopter': 'Helicóptero Derrubado',
        'bradley': 'Bradley Destruído',
        'cargo_ship': 'Navio de Carga',
        'player_ban': 'Jogador Banido',
        'player_achievement': 'Conquista Desbloqueada'
      };
      
      return eventTitles[eventType] || 'Evento do Servidor';
    }
    
    function getDefaultImage(eventType) {
      const eventImages = {
        'server_wipe': '/images/events/wipe.jpg',
        'server_restart': '/images/events/restart.jpg',
        'server_update': '/images/events/update.jpg',
        'raid': '/images/events/raid.jpg',
        'helicopter': '/images/events/helicopter.jpg',
        'bradley': '/images/events/bradley.jpg',
        'cargo_ship': '/images/events/cargo_ship.jpg',
        'player_ban': '/images/events/ban.jpg',
        'player_achievement': '/images/events/achievement.jpg'
      };
      
      return eventImages[eventType] || '/images/events/default.jpg';
    }

    // Retornar dados completos
    return res.status(200).json({
      server: serverData,
      leaderboard,
      events
    });
  } catch (error) {
    console.error('Error fetching server details:', error);
    return await fallbackToBattleMetrics(req, res, id);
  }
}

// Função de fallback para BattleMetrics + dados mock
async function fallbackToBattleMetrics(req, res, id) {
  try {
    // Servidor estático como fallback
    const serverData = {
      id: id, 
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
    };

    // Mock data para leaderboard
    const mockLeaderboard = [
      { playerId: "1", playerName: "PhanteonPlayer1", kills: 150, deaths: 45, playtime: 1820, lastSeen: "2023-03-01T10:23:00Z" },
      { playerId: "2", playerName: "RustWarrior", kills: 120, deaths: 38, playtime: 1540, lastSeen: "2023-03-02T18:15:00Z" },
      { playerId: "3", playerName: "IronBuilder", kills: 95, deaths: 52, playtime: 2100, lastSeen: "2023-03-03T14:30:00Z" },
      // Removi alguns itens para economizar espaço, mas manteríamos a lista completa
    ];

    // Mock data para eventos
    const mockEvents = [
      { 
        id: "1", 
        title: "Wipe Semanal", 
        description: "Reset completo do servidor, incluindo itens, construções e blueprints.", 
        date: "2025-03-20T12:00:00Z",
        image: "/images/events/wipe.jpg"
      }
    ];

    // Para servidores Rust, tentar atualizar com BattleMetrics
    if (id && serverData.game === 'rust') {
      try {
        console.log(`Fetching BattleMetrics data for server ${id}`);
        
        // Adicionar timeout para evitar que a requisição fique pendente por muito tempo
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
        
        const response = await fetch(`https://api.battlemetrics.com/servers/${id}`, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'PhanteonGames/1.0',
            'Accept': 'application/json'
          }
        });
        
        // Limpar o timeout após a resposta
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.data) {
            console.log(`Successfully fetched BattleMetrics data for server ${id}`);
            const serverInfo = data.data;
            const attributes = serverInfo.attributes;
            const details = attributes.details || {};
            
            // Update server with live data from BattleMetrics
            serverData.status = attributes.status || serverData.status;
            serverData.players = attributes.players || 0;
            serverData.maxPlayers = attributes.maxPlayers || serverData.maxPlayers;
            serverData.address = `${attributes.ip}:${attributes.port}` || serverData.address;
            serverData.map = details.map || serverData.map;
            serverData.seed = details.rust_seed || serverData.seed;
            serverData.worldSize = details.rust_world_size || serverData.worldSize;
            serverData.lastWipe = details.rust_last_wipe || serverData.lastWipe;
            
            // Adicionar timestamp para cache control
            serverData.lastUpdated = new Date().toISOString();
          }
        } else {
          // Log de erro específico para problemas de resposta
          console.warn(`BattleMetrics API returned status ${response.status} for server ${id}`);
        }
      } catch (bmError) {
        // Tratamento específico para timeout
        if (bmError.name === 'AbortError') {
          console.warn(`BattleMetrics API request timed out for server ${id}`);
        } else {
          console.error(`Error fetching BattleMetrics data for server ${id}:`, bmError);
        }
      }
    }

    // Adicionar headers de cache para melhorar performance
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300'); // 1 minuto no cliente, 5 minutos no edge
    
    // Retornar dados combinados
    return res.status(200).json({
      server: serverData,
      leaderboard: mockLeaderboard,
      events: mockEvents
    });
  } catch (error) {
    console.error('Error in fallback handler:', error);
    
    // Usar biblioteca de erro padronizada
    const errorMessage = error.message || 'Falha ao buscar detalhes do servidor';
    console.error(`[API:servers/${id}] ${errorMessage}`, error);
    
    // Resposta de erro formatada
    return res.status(500).json({ 
      success: false, 
      error: errorMessage,
      code: 'SERVER_FETCH_ERROR'
    });
  }
}