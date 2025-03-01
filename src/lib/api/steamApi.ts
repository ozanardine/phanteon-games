// src/lib/api/steamApi.ts

/**
 * Funções para interagir com a Steam API e obter informações do servidor Rust
 */

// Constantes para a API
const STEAM_API_URL = 'https://api.steampowered.com';
const STEAM_SERVER_API_URL = 'https://api.steampowered.com/IGameServersService/GetServerList/v1/';
const STEAM_PLAYER_API_URL = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/';

// ID do aplicativo Rust na Steam
const RUST_APP_ID = '252490';

// Endereço padrão do servidor
const DEFAULT_SERVER_ADDRESS = 'game.phanteongames.com:28015';

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
  id: string;
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
  serverAddress: string = DEFAULT_SERVER_ADDRESS,
  apiKey: string = process.env.NEXT_PUBLIC_STEAM_API_KEY || ''
): Promise<ServerInfo | null> => {
  try {
    // Se não tiver API key, usar dados de fallback
    if (!apiKey) {
      console.warn('Chave da API Steam não configurada, usando dados simulados');
      return getOfflineServerInfo(serverAddress);
    }

    // Separar IP e porta
    const [ip, portStr] = serverAddress.split(':');
    const port = parseInt(portStr || '28015');

    if (!ip) {
      throw new Error('Endereço de servidor inválido');
    }

    // Filtro específico para buscar o servidor Rust
    const filter = `\\appid\\${RUST_APP_ID}\\addr\\${ip}:${port}`;
    
    // Fazer requisição para a API da Steam
    const response = await fetch(`${STEAM_SERVER_API_URL}?key=${apiKey}&filter=${encodeURIComponent(filter)}`);
    
    if (!response.ok) {
      console.warn(`Erro na requisição à API Steam: ${response.statusText}`);
      return getOfflineServerInfo(serverAddress);
    }
    
    const data = await response.json();
    
    // Verificar se encontrou o servidor
    if (!data.response || !data.response.servers || data.response.servers.length === 0) {
      console.warn('Servidor não encontrado na API Steam');
      return getOfflineServerInfo(serverAddress);
    }
    
    const serverData = data.response.servers[0];
    
    // Converter dados para o nosso formato
    return {
      name: serverData.name || 'Phanteon Games - Brasil',
      address: serverAddress,
      ip: serverData.addr.split(':')[0],
      port: parseInt(serverData.addr.split(':')[1]),
      players: serverData.players || 0,
      maxPlayers: serverData.max_players || 200,
      map: serverData.map || 'Procedural Map',
      secure: serverData.secure === 1,
      ping: serverData.ping || 30,
      isOnline: true
    };
  } catch (error) {
    console.error('Erro ao buscar informações do servidor via Steam API:', error);
    return getOfflineServerInfo(serverAddress);
  }
};

/**
 * Retorna informações básicas para um servidor offline (fallback)
 */
const getOfflineServerInfo = (serverAddress: string): ServerInfo => {
  return {
    name: 'Phanteon Games - Brasil',
    address: serverAddress,
    ip: serverAddress.split(':')[0],
    port: parseInt(serverAddress.split(':')[1] || '28015'),
    players: 0,
    maxPlayers: 200,
    map: 'Procedural Map',
    secure: true,
    ping: 999,
    isOnline: false
  };
};

/**
 * Busca status completo do servidor Rust
 * @param serverAddress Endereço do servidor (IP:Porta)
 */
export const fetchServerStatus = async (
  serverAddress: string = DEFAULT_SERVER_ADDRESS
): Promise<ServerStatusResponse> => {
  try {
    // Tentar buscar informações do servidor via API Steam
    const serverInfo = await fetchServerInfoFromSteam(serverAddress);
    
    // Se o servidor estiver offline, retornar dados offline
    if (!serverInfo || !serverInfo.isOnline) {
      return getOfflineServerStatus(serverAddress);
    }
    
    // Buscar eventos ativos
    const events = await fetchServerEvents(serverAddress);
    
    // Calcular datas de wipe
    const lastWipe = calculateLastWipeDate();
    const nextWipe = calculateNextWipeDate();
    
    // Montar resposta completa
    return {
      info: serverInfo,
      players: {
        online: serverInfo.players,
        max: serverInfo.maxPlayers,
      },
      map: {
        name: serverInfo.map,
        size: '4500', // Tamanho padrão
        seed: extractSeedFromMap(serverInfo.map),
      },
      events,
      lastWipe,
      nextWipe,
    };
  } catch (error) {
    console.error('Erro ao buscar status completo do servidor:', error);
    return getOfflineServerStatus(serverAddress);
  }
};

/**
 * Extrai o número da seed a partir do nome do mapa
 */
const extractSeedFromMap = (mapName: string): string => {
  // Tenta extrair o número da seed do nome do mapa (formato comum: "Procedural Map_123456")
  const seedMatch = mapName.match(/[\d]+/);
  if (seedMatch) {
    return seedMatch[0];
  }
  
  // Se não conseguir extrair, gera uma seed aleatória estável
  const date = new Date();
  const seedBase = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return seedBase.toString();
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
 * Calcula a data do próximo wipe (primeira quinta-feira do próximo mês)
 */
const calculateNextWipeDate = (): Date => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Mês seguinte, dia 1
  const nextMonth = new Date(currentYear, currentMonth + 1, 1);
  
  // Encontrar a primeira quinta-feira (4) do próximo mês
  const dayOfWeek = nextMonth.getDay(); // 0 (Dom) a 6 (Sáb)
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
  
  nextMonth.setDate(1 + daysUntilThursday);
  return nextMonth;
};

/**
 * Retorna status offline para o servidor (fallback)
 */
const getOfflineServerStatus = (serverAddress: string): ServerStatusResponse => {
  const serverInfo = getOfflineServerInfo(serverAddress);
  
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
    nextWipe: calculateNextWipeDate(),
  };
};

/**
 * Busca eventos ativos no servidor Rust
 */
export const fetchServerEvents = async (serverAddress: string): Promise<ServerEvent[]> => {
  try {
    // Em uma implementação real, você buscaria eventos ativos de uma API ou banco de dados
    // Como é uma simulação, vamos gerar eventos aleatórios

    const events: ServerEvent[] = [];
    
    // Probabilidade de 30% de ter um Cargo Ship ativo
    if (Math.random() < 0.3) {
      events.push({
        id: `cargo-${Date.now()}`,
        name: 'Navio de Carga',
        type: 'cargo',
        location: 'Oceano (L24)',
        timeRemaining: Math.floor(Math.random() * 900) + 300, // 5-20 minutos
        active: true,
        startedAt: new Date(Date.now() - 600000), // Começou há 10 minutos
        estimatedEndAt: new Date(Date.now() + 1200000), // Termina em 20 minutos
      });
    }
    
    // Probabilidade de 20% de ter um Airdrop ativo
    if (Math.random() < 0.2) {
      events.push({
        id: `airdrop-${Date.now()}`,
        name: 'Airdrop',
        type: 'airdrop',
        location: 'Perto de Launch Site',
        timeRemaining: Math.floor(Math.random() * 180) + 60, // 1-4 minutos
        active: true,
      });
    }
    
    // Probabilidade de 15% de ter um Helicopter
    if (Math.random() < 0.15) {
      events.push({
        id: `heli-${Date.now()}`,
        name: 'Helicóptero de Ataque',
        type: 'heli',
        timeRemaining: Math.floor(Math.random() * 120) + 60, // 1-3 minutos
        active: Math.random() < 0.5, // 50% de chance de estar ativo
      });
    }
    
    // Probabilidade de 10% de ter Bradley
    if (Math.random() < 0.1) {
      events.push({
        id: `bradley-${Date.now()}`,
        name: 'Bradley APC',
        type: 'bradley',
        location: 'Launch Site',
        active: true,
      });
    }
    
    return events;
  } catch (error) {
    console.error('Erro ao buscar eventos do servidor:', error);
    return [];
  }
};

/**
 * Gera URL para conectar via Steam
 */
export const generateConnectUrl = (serverAddress: string): string => {
  return `steam://connect/${serverAddress}`;
};

/**
 * Busca jogadores online no servidor
 */
export const fetchOnlinePlayers = async (serverAddress: string): Promise<ServerPlayer[]> => {
  try {
    // Em uma implementação real, você buscaria esta informação via RCON ou API do servidor
    // Como é uma simulação, vamos gerar alguns jogadores aleatórios
    
    const playerCount = Math.floor(Math.random() * 15) + 5; // 5-20 jogadores
    const players: ServerPlayer[] = [];
    
    const playerNames = [
      'FalcãoBR', 'MatadorDeNoob', 'CaçadorRust', 'SnipeiroDaSelva', 'LoboSolitario',
      'Destruidor99', 'BRBuilder', 'RustGuerreira', 'FarmerPRO', 'BolaDeFogo',
      'PVPMaster', 'ColetorDeRecursos', 'SniperElite', 'ConstrutoraBR', 'RaidMaster'
    ];
    
    // Gerar jogadores aleatórios
    for (let i = 0; i < playerCount; i++) {
      const randomNameIndex = Math.floor(Math.random() * playerNames.length);
      players.push({
        id: `player${i + 1}`,
        name: playerNames[randomNameIndex],
        playTime: Math.floor(Math.random() * 10000) + 100, // 100-10100 minutos
      });
    }
    
    return players;
  } catch (error) {
    console.error('Erro ao buscar jogadores online:', error);
    return [];
  }
};