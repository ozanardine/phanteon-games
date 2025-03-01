// src/lib/api/supabaseApi.ts
import { supabase } from '../supabase/client';
import { getNextWipeDate } from '../utils/dateUtils';

// Re-exportando os tipos da API anterior para manter compatibilidade
import type { 
  ServerInfo, 
  ServerPlayer, 
  ServerEvent, 
  ServerMapInfo, 
  ServerPerformance, 
  ServerStatusResponse 
} from '../types/server';

// ID do servidor fixo (conforme definido no plugin Oxide)
const DEFAULT_SERVER_ID = 'game.phanteongames.com:28015';

/**
 * Busca informações do servidor diretamente do Supabase
 * @param serverId ID do servidor
 */
export const fetchServerInfoFromSupabase = async (
  serverId: string = DEFAULT_SERVER_ID
): Promise<ServerInfo | null> => {
  try {
    const { data, error } = await supabase
      .from('server_info')
      .select('*')
      .eq('server_id', serverId)
      .single();

    if (error) {
      console.error('Erro ao buscar informações do servidor:', error);
      return getOfflineServerInfo(serverId);
    }

    if (!data) {
      console.warn('Dados do servidor não encontrados');
      return getOfflineServerInfo(serverId);
    }

    // Converter dados do Supabase para o formato ServerInfo
    return {
      name: data.name || 'Phanteon Games - Brasil',
      address: serverId,
      ip: data.ip || serverId.split(':')[0],
      port: data.port || parseInt(serverId.split(':')[1] || '28015'),
      players: data.online_players || 0,
      maxPlayers: data.max_players || 200,
      map: data.map || 'Procedural Map',
      secure: true,
      ping: data.ping || 30,
      isOnline: data.is_online === true
    };
  } catch (error) {
    console.error('Erro ao buscar informações do servidor:', error);
    return getOfflineServerInfo(serverId);
  }
};

/**
 * Busca status completo do servidor Rust diretamente do Supabase
 * @param serverId ID do servidor
 */
export const fetchServerStatus = async (
  serverId: string = DEFAULT_SERVER_ID
): Promise<ServerStatusResponse> => {
  try {
    // Buscar informações do servidor
    const serverInfo = await fetchServerInfoFromSupabase(serverId);
    
    // Se o servidor estiver offline, retornar dados offline
    if (!serverInfo || !serverInfo.isOnline) {
      return getOfflineServerStatus(serverId);
    }
    
    // Buscar eventos do servidor
    const events = await fetchServerEvents(serverId);
    
    // Buscar informações detalhadas do mapa
    // Note que o plugin Oxide só sincroniza informações básicas do mapa
    // Podemos complementar com a API do RustMaps se necessário
    const mapInfo: ServerMapInfo = {
      name: serverInfo.map,
      size: await getMapSizeFromDb(serverId) || '4500',
      seed: await getMapSeedFromDb(serverId) || '123456',
      biomes: {
        desert: 25,
        snow: 20,
        forest: 40,
        plains: 15
      }
    };
    
    // Buscar dados de performance
    const performanceData = await fetchPerformanceStats(serverId);
    
    // Buscar datas de wipe do DB (ou calcular se não disponíveis)
    const lastWipe = await getLastWipeFromDb(serverId) || calculateLastWipeDate();
    const nextWipe = await getNextWipeFromDb(serverId) || getNextWipeDate();
    
    // Montar resposta completa
    return {
      info: serverInfo,
      players: {
        online: serverInfo.players,
        max: serverInfo.maxPlayers,
      },
      map: mapInfo,
      events,
      performance: performanceData,
      lastWipe,
      nextWipe,
    };
  } catch (error) {
    console.error('Erro ao buscar status completo do servidor:', error);
    return getOfflineServerStatus(serverId);
  }
};

/**
 * Busca eventos ativos no servidor Rust diretamente do Supabase
 * @param serverId ID do servidor
 */
export const fetchServerEvents = async (serverId: string = DEFAULT_SERVER_ID): Promise<ServerEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('server_events')
      .select('*')
      .eq('server_id', serverId)
      .eq('is_active', true);

    if (error) {
      console.error('Erro ao buscar eventos do servidor:', error);
      return [];
    }

    // Converter dados do Supabase para o formato ServerEvent
    return data.map(event => ({
      id: event.event_id || `event-${Date.now()}-${Math.random()}`,
      name: getEventName(event.type),
      type: mapEventType(event.type),
      location: getEventLocation(event),
      timeRemaining: calculateEventTimeRemaining(event),
      active: event.is_active === true,
      startedAt: event.created_at ? new Date(event.created_at) : undefined,
      estimatedEndAt: calculateEstimatedEndTime(event)
    }));
  } catch (error) {
    console.error('Erro ao buscar eventos do servidor:', error);
    return [];
  }
};

/**
 * Busca jogadores online no servidor diretamente do Supabase
 * @param serverId ID do servidor
 */
export const fetchOnlinePlayers = async (serverId: string = DEFAULT_SERVER_ID): Promise<ServerPlayer[]> => {
  try {
    const { data, error } = await supabase
      .from('online_players')
      .select('*')
      .eq('server_id', serverId);

    if (error) {
      console.error('Erro ao buscar jogadores online:', error);
      return [];
    }

    // Converter dados do Supabase para o formato ServerPlayer
    return data.map(player => ({
      id: player.steam_id,
      name: player.name || 'Jogador Desconhecido',
      playTime: player.session_time || 0,
      steamId: player.steam_id
    }));
  } catch (error) {
    console.error('Erro ao buscar jogadores online:', error);
    return [];
  }
};

/**
 * Busca dados de performance do servidor diretamente do Supabase
 * @param serverId ID do servidor
 */
export const fetchPerformanceStats = async (serverId: string = DEFAULT_SERVER_ID): Promise<ServerPerformance | null> => {
  try {
    const { data, error } = await supabase
      .from('performance_stats')
      .select('*')
      .eq('server_id', serverId)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar dados de performance:', error);
      return null;
    }

    return {
      fps: data.fps || 60,
      memory: data.memory_mb || 0,
      uptime: data.uptime_seconds || 0,
      entityCount: data.entities || 0
    };
  } catch (error) {
    console.error('Erro ao buscar dados de performance:', error);
    return null;
  }
};

/**
 * Busca leaderboard do servidor diretamente do Supabase
 * @param serverId ID do servidor
 * @param month Mês para filtrar (formato "YYYY-MM")
 * @param type Tipo de leaderboard (kills, deaths, playtime)
 * @param limit Limite de resultados
 */
export const fetchLeaderboard = async (
  serverId: string = DEFAULT_SERVER_ID,
  month: string = getCurrentMonth(),
  type: string = 'kills',
  limit: number = 20
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('server_id', serverId)
      .eq('month', month)
      .eq('type', type)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar leaderboard:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar leaderboard:', error);
    return [];
  }
};

/**
 * Busca estatísticas de jogador diretamente do Supabase
 * @param steamId ID Steam do jogador
 * @param serverId ID do servidor
 */
export const fetchPlayerStats = async (
  steamId: string,
  serverId: string = DEFAULT_SERVER_ID
): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('steam_id', steamId)
      .eq('server_id', serverId)
      .single();

    if (error) {
      console.error('Erro ao buscar estatísticas do jogador:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar estatísticas do jogador:', error);
    return null;
  }
};

// Funções auxiliares

/**
 * Retorna informações básicas para um servidor offline (fallback)
 */
const getOfflineServerInfo = (serverId: string): ServerInfo => {
  return {
    name: 'Phanteon Games - Brasil',
    address: serverId,
    ip: serverId.split(':')[0],
    port: parseInt(serverId.split(':')[1] || '28015'),
    players: 0,
    maxPlayers: 200,
    map: 'Procedural Map',
    secure: true,
    ping: 999,
    isOnline: false
  };
};

/**
 * Retorna status offline para o servidor (fallback)
 */
const getOfflineServerStatus = (serverId: string): ServerStatusResponse => {
  const serverInfo = getOfflineServerInfo(serverId);
  
  return {
    info: serverInfo,
    players: {
      online: 0,
      max: 200,
    },
    map: {
      name: 'Procedural Map',
      size: '4500',
      seed: '123456',
    },
    events: [],
    lastWipe: calculateLastWipeDate(),
    nextWipe: getNextWipeDate(),
  };
};

/**
 * Calcula a data do último wipe (primeiro dia do mês atual)
 */
const calculateLastWipeDate = (): Date => {
  const today = new Date();
  // Primeiro dia do mês atual
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

/**
 * Busca o tamanho do mapa do servidor no banco de dados
 */
const getMapSizeFromDb = async (serverId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('server_info')
      .select('world_size')
      .eq('server_id', serverId)
      .single();
      
    if (error || !data) return null;
    return data.world_size?.toString() || null;
  } catch (error) {
    console.error('Erro ao buscar tamanho do mapa:', error);
    return null;
  }
};

/**
 * Busca a seed do mapa do servidor no banco de dados
 */
const getMapSeedFromDb = async (serverId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('server_info')
      .select('seed')
      .eq('server_id', serverId)
      .single();
      
    if (error || !data) return null;
    return data.seed?.toString() || null;
  } catch (error) {
    console.error('Erro ao buscar seed do mapa:', error);
    return null;
  }
};

/**
 * Busca a data do último wipe do servidor no banco de dados
 */
const getLastWipeFromDb = async (serverId: string): Promise<Date | null> => {
  try {
    const { data, error } = await supabase
      .from('server_info')
      .select('last_wipe')
      .eq('server_id', serverId)
      .single();
      
    if (error || !data || !data.last_wipe) return null;
    return new Date(data.last_wipe);
  } catch (error) {
    console.error('Erro ao buscar data do último wipe:', error);
    return null;
  }
};

/**
 * Busca a data do próximo wipe do servidor no banco de dados
 */
const getNextWipeFromDb = async (serverId: string): Promise<Date | null> => {
  try {
    const { data, error } = await supabase
      .from('server_info')
      .select('next_wipe')
      .eq('server_id', serverId)
      .single();
      
    if (error || !data || !data.next_wipe) return null;
    return new Date(data.next_wipe);
  } catch (error) {
    console.error('Erro ao buscar data do próximo wipe:', error);
    return null;
  }
};

/**
 * Retorna o nome de um evento com base no tipo
 */
const getEventName = (type: string): string => {
  switch (type) {
    case 'cargo_ship':
    case 'cargo':
      return 'Navio de Carga';
    case 'patrol_helicopter':
    case 'heli':
      return 'Helicóptero de Ataque';
    case 'bradley_apc':
    case 'bradley':
      return 'Bradley APC';
    case 'airdrop':
      return 'Airdrop';
    case 'chinook':
      return 'Chinook';
    default:
      return 'Evento Desconhecido';
  }
};

/**
 * Mapeia os tipos de evento do banco para os tipos definidos na interface
 */
const mapEventType = (type: string): 'cargo' | 'airdrop' | 'heli' | 'bradley' | 'custom' => {
  switch (type) {
    case 'cargo_ship':
      return 'cargo';
    case 'patrol_helicopter':
      return 'heli';
    case 'bradley_apc':
      return 'bradley';
    case 'airdrop':
      return 'airdrop';
    default:
      return 'custom';
  }
};

/**
 * Obtém a localização de um evento
 */
const getEventLocation = (event: any): string | undefined => {
  if (!event.position_x || !event.position_y) return undefined;
  
  // Converter coordenadas em grid do mapa (ex: B10)
  const gridSize = 146.3; // Tamanho aproximado de uma grid no Rust
  const gridLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXY';
  
  const worldSize = 4500; // Tamanho padrão do mundo
  const halfWorld = worldSize / 2;
  
  // Ajustar coordenadas para referencial do grid
  const adjustedX = event.position_x + halfWorld;
  const adjustedZ = event.position_z + halfWorld;
  
  // Calcular grid
  const gridX = Math.floor(adjustedX / gridSize);
  const gridZ = Math.floor(adjustedZ / gridSize);
  
  // Letra + Número
  const gridLetter = gridLetters[gridX] || 'Z';
  const gridNumber = gridZ + 1;
  
  return `${gridLetter}${gridNumber}`;
};

/**
 * Calcula tempo restante estimado para evento (em segundos)
 */
const calculateEventTimeRemaining = (event: any): number | undefined => {
  const eventType = event.type;
  
  switch (eventType) {
    case 'cargo_ship':
      return 900; // 15 minutos
    case 'patrol_helicopter':
      return 600; // 10 minutos
    case 'airdrop':
      return 300; // 5 minutos
    default:
      return undefined;
  }
};

/**
 * Calcula tempo de fim estimado para evento
 */
const calculateEstimatedEndTime = (event: any): Date | undefined => {
  const timeRemaining = calculateEventTimeRemaining(event);
  if (!timeRemaining) return undefined;
  
  const now = new Date();
  return new Date(now.getTime() + timeRemaining * 1000);
};

/**
 * Retorna o mês atual no formato "YYYY-MM"
 */
const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Exportar as funções como substitutos do steamApi
export { generateConnectUrl } from './steamApi'; // Essa função não muda, podemos reutilizar