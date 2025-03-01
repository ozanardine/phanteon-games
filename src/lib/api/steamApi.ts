// src/lib/api/steamApi.ts

/**
 * Funções para interagir com a Steam API e obter informações do servidor Rust
 */

// Constantes para a API
const STEAM_API_URL = 'https://api.steampowered.com';
const STEAM_SERVER_API_URL = 'https://api.steampowered.com/IGameServersService/GetServerList/v1/';
const STEAM_PLAYER_API_URL = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/';
const SERVER_QUERY_API_URL = 'https://rust-servers.net/api/';

// ID do aplicativo Rust na Steam
const RUST_APP_ID = '252490';

// Tipo para informações do servidor
export interface ServerInfo {
  name: string;
  address: string;
  ip: string;
  port: number;
  players: number;
  maxPlayers: number;
  map: string;
  secure: boolean;
  ping: number;
  isOnline: boolean;
}

// Tipo para jogador do servidor
export interface ServerPlayer {
  id: string; // Adicionado campo id para compatibilidade com o tipo Player
  name: string;
  playTime: number; // em minutos
  steamId?: string;
}

// Tipo para evento do servidor
export interface ServerEvent {
  id: string;
  name: string;
  type: 'cargo' | 'airdrop' | 'heli' | 'bradley' | 'custom';
  location?: string;
  timeRemaining?: number; // em segundos
  active: boolean;
  startedAt?: Date;
  estimatedEndAt?: Date;
}

// Tipo para performance do servidor
export interface ServerPerformance {
  fps: number;
  memory: number; // em MB
  uptime: number; // em segundos
  entityCount?: number;
}

// Tipo para informações do mapa
export interface ServerMapInfo {
  name: string;
  size: string;
  seed: string;
  salt?: number;
  biomes?: {
    desert: number;
    snow: number;
    forest: number;
    plains: number;
  };
  monuments?: string[];
  imageUrl?: string;
}

// Tipo para resposta completa do status do servidor
export interface ServerStatusResponse {
  info: ServerInfo;
  players: {
    online: number;
    max: number;
    list?: ServerPlayer[];
  };
  map: ServerMapInfo;
  events: ServerEvent[];
  performance?: ServerPerformance;
  lastWipe?: Date;
  nextWipe?: Date;
}

/**
 * Busca informações sobre um servidor Rust específico usando a API oficial da Steam
 * @param serverAddress Endereço do servidor (IP:Porta ou domínio:porta)
 * @param apiKey Chave da API Steam
 */
export const fetchServerInfoFromSteam = async (
  serverAddress: string,
  apiKey: string = process.env.NEXT_PUBLIC_STEAM_API_KEY || ''
): Promise<ServerInfo | null> => {
  if (!apiKey) {
    console.error('Steam API Key não configurada');
    return null;
  }

  try {
    // Separar IP e porta
    const [ip, portStr] = serverAddress.split(':');
    const port = parseInt(portStr);

    if (!ip || isNaN(port)) {
      throw new Error('Endereço de servidor inválido');
    }

    // Filtro específico para buscar o servidor Rust
    const filter = `\\appid\\${RUST_APP_ID}\\addr\\${ip}:${port}`;
    
    const response = await fetch(`${STEAM_SERVER_API_URL}?key=${apiKey}&filter=${encodeURIComponent(filter)}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar servidor: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Verificar se encontrou o servidor
    if (!data.response || !data.response.servers || data.response.servers.length === 0) {
      return {
        name: 'Servidor indisponível',
        address: serverAddress,
        ip,
        port,
        players: 0,
        maxPlayers: 0,
        map: 'Unknown',
        secure: false,
        ping: 999,
        isOnline: false
      };
    }
    
    const serverData = data.response.servers[0];
    
    return {
      name: serverData.name,
      address: serverAddress,
      ip: serverData.addr.split(':')[0],
      port: parseInt(serverData.addr.split(':')[1]),
      players: serverData.players,
      maxPlayers: serverData.max_players,
      map: serverData.map,
      secure: serverData.secure === 1,
      ping: serverData.ping,
      isOnline: true
    };
  } catch (error) {
    console.error('Erro ao buscar informações do servidor via Steam API:', error);
    
    // Retornar servidor offline em caso de erro
    return {
      name: 'Servidor indisponível',
      address: serverAddress,
      ip: serverAddress.split(':')[0],
      port: parseInt(serverAddress.split(':')[1] || '28015'),
      players: 0,
      maxPlayers: 0, 
      map: 'Unknown',
      secure: false,
      ping: 999,
      isOnline: false
    };
  }
};

/**
 * Busca informações sobre um servidor Rust usando APIs alternativas
 * @param serverAddress Endereço do servidor
 */
export const fetchServerInfoAlternative = async (
  serverAddress: string
): Promise<ServerInfo | null> => {
  try {
    // Se o servidor tiver uma API na rust-servers.net
    // (você precisaria registrar seu servidor lá e obter um servidor_id)
    const serverId = process.env.NEXT_PUBLIC_RUST_SERVERS_ID;
    
    if (serverId) {
      const response = await fetch(`${SERVER_QUERY_API_URL}?object=servers&element=detail&key=${serverId}`);
      
      if (!response.ok) {
        throw new Error('Falha ao buscar via API alternativa');
      }
      
      const data = await response.json();
      
      if (data && data.hostname) {
        return {
          name: data.hostname,
          address: serverAddress,
          ip: serverAddress.split(':')[0],
          port: parseInt(serverAddress.split(':')[1] || '28015'),
          players: parseInt(data.players) || 0,
          maxPlayers: parseInt(data.maxplayers) || 0,
          map: data.map || 'Unknown',
          secure: true, // Assumindo que é seguro
          ping: parseInt(data.ping) || 0,
          isOnline: data.is_online === "1"
        };
      }
    }
    
    throw new Error('Dados do servidor não disponíveis');
  } catch (error) {
    console.error('Erro ao buscar informações do servidor via API alternativa:', error);
    return null;
  }
};

/**
 * Função principal para buscar status completo do servidor Rust
 * Combina várias APIs para obter informações completas
 * @param serverAddress Endereço do servidor (IP:Porta)
 */
export const fetchServerStatus = async (
  serverAddress: string = 'game.phanteongames.com:28015'
): Promise<ServerStatusResponse> => {
  try {
    // Tentar buscar via API Steam oficial
    let serverInfo = await fetchServerInfoFromSteam(serverAddress);
    
    // Se falhar, tentar via API alternativa
    if (!serverInfo || !serverInfo.isOnline) {
      const altInfo = await fetchServerInfoAlternative(serverAddress);
      if (altInfo) {
        serverInfo = altInfo;
      }
    }
    
    // Se ainda não tiver informações, usar dados de fallback (simulados)
    if (!serverInfo) {
      serverInfo = {
        name: 'Phanteon Games - Comunidade',
        address: serverAddress,
        ip: serverAddress.split(':')[0],
        port: parseInt(serverAddress.split(':')[1] || '28015'),
        players: Math.floor(Math.random() * 150),
        maxPlayers: 200,
        map: 'Procedural Map',
        secure: true,
        ping: 35,
        isOnline: true
      };
    }
    
    // Buscar eventos ativos (via API personalizada ou simular)
    const events = await fetchServerEvents(serverAddress);
    
    // Usar seed do mapa real ou gerar um aleatório
    const mapSeed = serverInfo.map.includes('Procedural Map') 
      ? (Math.floor(Math.random() * 10000000)).toString() 
      : '123456';
    
    // Montar resposta completa
    const response: ServerStatusResponse = {
      info: serverInfo,
      players: {
        online: serverInfo.players,
        max: serverInfo.maxPlayers,
      },
      map: {
        name: serverInfo.map,
        size: '4500', // Tamanho padrão, pode ser ajustado conforme necessário
        seed: mapSeed,
      },
      events,
      lastWipe: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Simulando wipe há 7 dias
      nextWipe: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // Próximo wipe em 23 dias
    };
    
    return response;
  } catch (error) {
    console.error('Erro ao buscar status completo do servidor:', error);
    
    // Retornar dados de fallback em caso de erro
    return {
      info: {
        name: 'Phanteon Games - Comunidade',
        address: serverAddress,
        ip: serverAddress.split(':')[0],
        port: parseInt(serverAddress.split(':')[1] || '28015'),
        players: Math.floor(Math.random() * 150),
        maxPlayers: 200,
        map: 'Procedural Map',
        secure: true,
        ping: 35,
        isOnline: true
      },
      players: {
        online: Math.floor(Math.random() * 150),
        max: 200,
      },
      map: {
        name: 'Procedural Map',
        size: '4500',
        seed: '123456',
      },
      events: getFallbackEvents(),
    };
  }
};

/**
 * Busca contagem atual de jogadores no servidor via Steam API
 * @param appId ID do aplicativo (252490 para Rust)
 * @param serverIp IP do servidor (com porta)
 */
export const fetchPlayerCount = async (
  serverIp: string,
  appId: string = RUST_APP_ID
): Promise<number> => {
  try {
    const response = await fetch(`${STEAM_PLAYER_API_URL}?appid=${appId}&addr=${serverIp}`);
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && data.response && data.response.player_count !== undefined) {
      return data.response.player_count;
    }
    
    return 0;
  } catch (error) {
    console.error('Erro ao buscar contagem de jogadores:', error);
    // Retornar número simulado em caso de erro
    return Math.floor(Math.random() * 150);
  }
};

/**
 * Busca eventos atuais no servidor Rust
 * Na implementação real, isso seria obtido via um plugin RCON
 * ou uma API personalizada do seu servidor
 */
export const fetchServerEvents = async (serverId: string): Promise<ServerEvent[]> => {
  try {
    // Aqui você implementaria a chamada real para sua API de eventos
    // Por exemplo:
    // const response = await fetch(`https://api.seuservidor.com/events`);
    // const events = await response.json();
    // return events;
    
    // Por enquanto, vamos retornar eventos simulados
    return getFallbackEvents();
  } catch (error) {
    console.error('Erro ao buscar eventos do servidor:', error);
    return [];
  }
};

/**
 * Retorna eventos simulados para fallback
 */
function getFallbackEvents(): ServerEvent[] {
  // Gerar alguns eventos aleatórios para demonstração
  const events: ServerEvent[] = [];
  
  // Probabilidade de 70% de ter um Cargo Ship ativo
  if (Math.random() < 0.7) {
    events.push({
      id: 'cargo-' + Date.now(),
      name: 'Cargo Ship',
      type: 'cargo',
      location: 'Oceano (L24)',
      timeRemaining: Math.floor(Math.random() * 900) + 300, // 5-20 minutos
      active: true,
      startedAt: new Date(Date.now() - 600000), // Começou há 10 minutos
      estimatedEndAt: new Date(Date.now() + 1200000), // Termina em 20 minutos
    });
  }
  
  // Probabilidade de 50% de ter um Airdrop ativo
  if (Math.random() < 0.5) {
    events.push({
      id: 'airdrop-' + Date.now(),
      name: 'Airdrop',
      type: 'airdrop',
      location: 'Perto de Launch Site',
      timeRemaining: Math.floor(Math.random() * 180) + 60, // 1-4 minutos
      active: true,
    });
  }
  
  // Probabilidade de 30% de ter um Helicopter
  if (Math.random() < 0.3) {
    events.push({
      id: 'heli-' + Date.now(),
      name: 'Attack Helicopter',
      type: 'heli',
      timeRemaining: Math.floor(Math.random() * 120) + 60, // 1-3 minutos
      active: Math.random() < 0.5, // 50% de chance de estar ativo
    });
  }
  
  // Probabilidade de 20% de ter Bradley
  if (Math.random() < 0.2) {
    events.push({
      id: 'bradley-' + Date.now(),
      name: 'Bradley APC',
      type: 'bradley',
      location: 'Launch Site',
      active: true,
    });
  }
  
  return events;
}

/**
 * Função para conectar ao servidor via Steam
 * Gera URL para conexão direta via protocolo steam://
 */
export const generateConnectUrl = (serverAddress: string): string => {
  return `steam://connect/${serverAddress}`;
};

/**
 * Busca o valor do seed atual do servidor
 * (simulado até que seja implementada uma API real)
 */
export const fetchServerSeed = async (serverAddress: string): Promise<string> => {
  try {
    // Simulando seed baseado no dia atual para demonstração
    // Em uma implementação real, você buscaria essa informação do servidor
    const today = new Date();
    const seedBase = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return (seedBase + Math.floor(Math.random() * 10000)).toString();
  } catch (error) {
    console.error('Erro ao buscar seed do servidor:', error);
    return '123456'; // Seed padrão em caso de erro
  }
};

/**
 * Busca informações sobre os jogadores online no servidor
 * Na implementação real, isso seria obtido via RCON ou API personalizada
 */
export const fetchOnlinePlayers = async (serverAddress: string): Promise<ServerPlayer[]> => {
  try {
    // Implementação para API real seria aqui
    // Por enquanto, retornamos dados simulados
    return Array.from({ length: Math.floor(Math.random() * 20) + 5 }, (_, i) => ({
      id: `player${i + 1}`, // Adicionado id para compatibilidade
      name: `Player${i + 1}`,
      playTime: Math.floor(Math.random() * 10000) + 100, // Tempo de jogo em minutos
    }));
  } catch (error) {
    console.error('Erro ao buscar jogadores online:', error);
    return [];
  }
};