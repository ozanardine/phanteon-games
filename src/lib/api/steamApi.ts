// src/lib/api/steamApi.ts

/**
 * Funções para interagir com a Steam API e obter informações do servidor Rust
 * Também implementa suporte para RCON e API do AMP
 */

// Importação de bibliotecas para RCON (você precisará instalar estas dependências)
import WebSocket from 'ws'; // Para implementar RCON via WebSocket

// Constantes para a API
const STEAM_API_URL = 'https://api.steampowered.com';
const STEAM_SERVER_API_URL = 'https://api.steampowered.com/IGameServersService/GetServerList/v1/';
const STEAM_PLAYER_API_URL = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/';

// ID do aplicativo Rust na Steam
const RUST_APP_ID = '252490';

// Endereço padrão do servidor
const DEFAULT_SERVER_ADDRESS = 'game.phanteongames.com:28015';

// Dados de configuração para RCON
const RCON_ENABLED = process.env.NEXT_PUBLIC_RCON_ENABLED === 'true';
const RCON_HOST = process.env.RCON_HOST || 'localhost';
const RCON_PORT = parseInt(process.env.RCON_PORT || '28016', 10);
const RCON_PASSWORD = process.env.RCON_PASSWORD || '';

// Dados de configuração para a API do AMP (Hostinger)
const AMP_API_ENABLED = process.env.NEXT_PUBLIC_AMP_API_ENABLED === 'true';
const AMP_API_URL = process.env.AMP_API_URL || '';
const AMP_API_KEY = process.env.AMP_API_KEY || '';
const AMP_INSTANCE_ID = process.env.AMP_INSTANCE_ID || '';

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
 * Implementação de cliente RCON para Rust
 * Permite executar comandos no console do servidor
 */
class RustRCONClient {
  private socket: WebSocket | null = null;
  private host: string;
  private port: number;
  private password: string;
  private connected: boolean = false;
  private messageId: number = 1;
  private pendingMessages: Map<number, { resolve: Function; reject: Function }> = new Map();

  constructor(host: string, port: number, password: string) {
    this.host = host;
    this.port = port;
    this.password = password;
  }

  /**
   * Conecta ao servidor RCON
   */
  async connect(): Promise<boolean> {
    if (this.connected) return true;
    
    return new Promise((resolve, reject) => {
      try {
        // WebRCON usa protocolo WebSocket
        this.socket = new WebSocket(`ws://${this.host}:${this.port}/${this.password}`);
        
        this.socket.on('open', () => {
          this.connected = true;
          console.log('RCON connection established');
          resolve(true);
        });
        
        this.socket.on('message', (data: any) => {
          try {
            const response = JSON.parse(data.toString());
            if (response.Identifier && this.pendingMessages.has(response.Identifier)) {
              const { resolve } = this.pendingMessages.get(response.Identifier)!;
              resolve(response.Message);
              this.pendingMessages.delete(response.Identifier);
            }
          } catch (error) {
            console.error('Error processing RCON response:', error);
          }
        });
        
        this.socket.on('error', (error) => {
          console.error('RCON connection error:', error);
          this.connected = false;
          reject(error);
        });
        
        this.socket.on('close', () => {
          console.log('RCON connection closed');
          this.connected = false;
        });
        
        // Timeout para conexão
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('RCON connection timeout'));
          }
        }, 5000);
      } catch (error) {
        console.error('Failed to connect to RCON:', error);
        reject(error);
      }
    });
  }

  /**
   * Executa um comando RCON no servidor
   */
  async executeCommand(command: string): Promise<string> {
    try {
      if (!this.connected) {
        await this.connect();
      }
      
      if (!this.socket || !this.connected) {
        throw new Error('RCON not connected');
      }
      
      const messageId = this.messageId++;
      
      return new Promise((resolve, reject) => {
        this.pendingMessages.set(messageId, { resolve, reject });
        
        // Formato esperado pelo WebRCON do Rust
        const message = JSON.stringify({
          Identifier: messageId,
          Message: command,
          Name: 'WebRcon'
        });
        
        this.socket!.send(message);
        
        // Timeout para comando
        setTimeout(() => {
          if (this.pendingMessages.has(messageId)) {
            this.pendingMessages.delete(messageId);
            reject(new Error('RCON command timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error(`RCON command error (${command}):`, error);
      throw error;
    }
  }

  /**
   * Fecha a conexão RCON
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
  }
}

// Instância global do cliente RCON
let rconClient: RustRCONClient | null = null;

/**
 * Obtém uma instância do cliente RCON
 */
function getRconClient(): RustRCONClient {
  if (!rconClient) {
    rconClient = new RustRCONClient(RCON_HOST, RCON_PORT, RCON_PASSWORD);
  }
  return rconClient;
}

/**
 * Busca informações do servidor via RCON
 */
async function getServerInfoViaRCON(): Promise<ServerInfo | null> {
  if (!RCON_ENABLED || !RCON_PASSWORD) {
    return null;
  }

  try {
    const client = getRconClient();
    
    // Comando para obter informações do servidor
    const serverInfoResponse = await client.executeCommand('server.status');
    
    // Exemplo de formato de resposta (pode variar dependendo da versão do Rust):
    // hostname: "Phanteon Games - Brasil"
    // version : 2385 secure (official)
    // map     : Procedural Map
    // players : 45 (150 max)
    
    // Parsear resposta
    const hostnameMatch = serverInfoResponse.match(/hostname\s*:\s*"([^"]+)"/);
    const mapMatch = serverInfoResponse.match(/map\s*:\s*([^\n]+)/);
    const playersMatch = serverInfoResponse.match(/players\s*:\s*(\d+)\s*\((\d+)\s*max\)/);
    
    if (!hostnameMatch || !mapMatch || !playersMatch) {
      console.warn('Failed to parse RCON server.status response');
      return null;
    }
    
    const name = hostnameMatch[1];
    const map = mapMatch[1].trim();
    const players = parseInt(playersMatch[1], 10);
    const maxPlayers = parseInt(playersMatch[2], 10);
    
    // Separar endereço em IP e porta
    const [ip, portStr] = DEFAULT_SERVER_ADDRESS.split(':');
    const port = parseInt(portStr || '28015', 10);
    
    return {
      name,
      address: DEFAULT_SERVER_ADDRESS,
      ip: ip || '',
      port,
      players,
      maxPlayers,
      map,
      secure: true,
      ping: 10, // Não é possível obter via RCON, valor arbitrário baixo
      isOnline: true
    };
  } catch (error) {
    console.error('Error fetching server info via RCON:', error);
    return null;
  }
}

/**
 * Busca jogadores online via RCON
 */
async function getPlayersViaRCON(): Promise<ServerPlayer[]> {
  if (!RCON_ENABLED || !RCON_PASSWORD) {
    return [];
  }

  try {
    const client = getRconClient();
    
    // Comando para listar jogadores
    const playersResponse = await client.executeCommand('players');
    
    // Exemplo de formato:
    // 76561198040845016 "Player1" (XYZ.xyz.xyz.xyz:12345) 1h45m
    // 76561198072034382 "Player2" (ABC.abc.abc.abc:23456) 2h30m
    
    const players: ServerPlayer[] = [];
    const playerLines = playersResponse.split('\n');
    
    for (const line of playerLines) {
      // Regex para extrair id, nome, e tempo de jogo
      const playerMatch = line.match(/(\d+)\s+"([^"]+)".+\s+(\d+)h(\d+)m/);
      if (playerMatch) {
        const steamId = playerMatch[1];
        const name = playerMatch[2];
        const hours = parseInt(playerMatch[3], 10);
        const minutes = parseInt(playerMatch[4], 10);
        const playTime = hours * 60 + minutes;
        
        players.push({
          id: `player-${steamId}`,
          name,
          playTime,
          steamId
        });
      }
    }
    
    return players;
  } catch (error) {
    console.error('Error fetching players via RCON:', error);
    return [];
  }
}

/**
 * Busca eventos do servidor via RCON
 */
async function getEventsViaRCON(): Promise<ServerEvent[]> {
  if (!RCON_ENABLED || !RCON_PASSWORD) {
    return [];
  }

  try {
    const client = getRconClient();
    
    // Infelizmente, o RCON do Rust não fornece diretamente informações sobre eventos
    // como cargo ship ou helicóptero, portanto precisamos utilizar comandos específicos
    // ou plugins que forneçam essa informação
    
    // Tentativa de obter informações do evento cargo ship
    const cargoResponse = await client.executeCommand('cargoship.info');
    const heliResponse = await client.executeCommand('heli.info');
    
    const events: ServerEvent[] = [];
    
    // Parsear resposta (formato hipotético, pode variar dependendo de plugins)
    if (cargoResponse.includes('active') || cargoResponse.includes('spawned')) {
      events.push({
        id: `cargo-${Date.now()}`,
        name: 'Navio de Carga',
        type: 'cargo',
        location: 'Oceano',
        active: true,
        startedAt: new Date(Date.now() - 600000), // Estimativa: começou há 10 minutos
        estimatedEndAt: new Date(Date.now() + 1200000), // Estimativa: termina em 20 minutos
      });
    }
    
    if (heliResponse.includes('active') || heliResponse.includes('spawned')) {
      events.push({
        id: `heli-${Date.now()}`,
        name: 'Helicóptero de Ataque',
        type: 'heli',
        active: true,
      });
    }
    
    return events;
  } catch (error) {
    console.error('Error fetching events via RCON:', error);
    return [];
  }
}

/**
 * Busca status do servidor via API do AMP (Hostinger)
 */
async function getServerStatusViaAMP(): Promise<ServerStatusResponse | null> {
  if (!AMP_API_ENABLED || !AMP_API_URL || !AMP_API_KEY) {
    return null;
  }

  try {
    // Montar URL para a API do AMP
    const url = `${AMP_API_URL}/API/ADSModule/Servers/${AMP_INSTANCE_ID}/Status`;
    
    // Fazer requisição à API do AMP
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AMP_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`AMP API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Verificar se o servidor está online
    const isOnline = data.Running || false;
    
    // Se não estiver online, retornar status offline
    if (!isOnline) {
      return getOfflineServerStatus(DEFAULT_SERVER_ADDRESS);
    }
    
    // Extrair informações relevantes da resposta da API
    const name = data.ServerName || 'Phanteon Games - Brasil';
    const maxPlayers = data.MaxUsers || 200;
    const currentPlayers = data.CurrentUsers || 0;
    const mapName = data.Map || 'Procedural Map';
    
    // Extrair seed do mapa (se disponível)
    const seed = extractSeedFromMap(mapName);
    
    // Separar endereço em IP e porta
    const [ip, portStr] = DEFAULT_SERVER_ADDRESS.split(':');
    const port = parseInt(portStr || '28015', 10);
    
    // Montar resposta com as informações disponíveis
    const serverInfo: ServerInfo = {
      name,
      address: DEFAULT_SERVER_ADDRESS,
      ip: ip || '',
      port,
      players: currentPlayers,
      maxPlayers,
      map: mapName,
      secure: true,
      ping: 20, // Valor arbitrário baixo (considerando que está no mesmo provedor)
      isOnline: true
    };
    
    // Calcular datas de wipe
    const lastWipe = calculateLastWipeDate();
    const nextWipe = calculateNextWipeDate();
    
    // Buscar eventos ou simular se não disponíveis
    const events = await fetchServerEvents(DEFAULT_SERVER_ADDRESS);
    
    return {
      info: serverInfo,
      players: {
        online: currentPlayers,
        max: maxPlayers,
      },
      map: {
        name: mapName,
        size: '4500', // Tamanho padrão (pode não estar disponível na API)
        seed,
      },
      events,
      lastWipe,
      nextWipe,
    };
  } catch (error) {
    console.error('Error fetching server status via AMP API:', error);
    return null;
  }
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
    // 1. Tentar obter via RCON primeiro (mais preciso e em tempo real)
    if (RCON_ENABLED && RCON_PASSWORD) {
      const rconInfo = await getServerInfoViaRCON();
      if (rconInfo) {
        return rconInfo;
      }
    }
    
    // 2. Tentar via API do AMP se disponível
    if (AMP_API_ENABLED && AMP_API_URL && AMP_API_KEY) {
      const ampStatus = await getServerStatusViaAMP();
      if (ampStatus) {
        return ampStatus.info;
      }
    }

    // 3. Se não foi possível via RCON ou AMP, tentar via API Steam
    // Se não tiver API key, usar dados de fallback
    if (!apiKey) {
      console.warn('Steam API key not configured, using fallback data');
      return getOfflineServerInfo(serverAddress);
    }

    // Separar IP e porta
    const [ip, portStr] = serverAddress.split(':');
    const port = parseInt(portStr || '28015');

    if (!ip) {
      throw new Error('Invalid server address');
    }

    // Filtro específico para buscar o servidor Rust
    const filter = `\\appid\\${RUST_APP_ID}\\addr\\${ip}:${port}`;
    
    // Fazer requisição para a API da Steam
    const response = await fetch(`${STEAM_SERVER_API_URL}?key=${apiKey}&filter=${encodeURIComponent(filter)}`);
    
    if (!response.ok) {
      console.warn(`Error in Steam API request: ${response.statusText}`);
      return getOfflineServerInfo(serverAddress);
    }
    
    const data = await response.json();
    
    // Verificar se encontrou o servidor
    if (!data.response || !data.response.servers || data.response.servers.length === 0) {
      console.warn('Server not found in Steam API');
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
    console.error('Error fetching server info via Steam API:', error);
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
    // 1. Tentar obter via API do AMP primeiro (dados mais completos)
    if (AMP_API_ENABLED && AMP_API_URL && AMP_API_KEY) {
      const ampStatus = await getServerStatusViaAMP();
      if (ampStatus) {
        return ampStatus;
      }
    }
    
    // 2. Tentar obter dados usando RCON + API Steam
    let serverInfo: ServerInfo | null = null;
    let playersList: ServerPlayer[] = [];
    let events: ServerEvent[] = [];
    
    // Obter informações básicas do servidor (preferindo RCON, depois Steam)
    serverInfo = await fetchServerInfoFromSteam(serverAddress);
    
    // Se o servidor estiver offline, retornar dados offline
    if (!serverInfo || !serverInfo.isOnline) {
      return getOfflineServerStatus(serverAddress);
    }
    
    // Tentar obter lista de jogadores via RCON
    if (RCON_ENABLED && RCON_PASSWORD) {
      playersList = await getPlayersViaRCON();
    }
    
    // Tentar obter eventos via RCON
    if (RCON_ENABLED && RCON_PASSWORD) {
      events = await getEventsViaRCON();
    }
    
    // Se não conseguiu eventos via RCON, tentar buscar de outra forma
    if (events.length === 0) {
      events = await fetchServerEvents(serverAddress);
    }
    
    // Calcular datas de wipe
    const lastWipe = calculateLastWipeDate();
    const nextWipe = calculateNextWipeDate();
    
    // Montar resposta completa
    return {
      info: serverInfo,
      players: {
        online: serverInfo.players,
        max: serverInfo.maxPlayers,
        list: playersList.length > 0 ? playersList : undefined
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
    console.error('Error fetching complete server status:', error);
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
    // 1. Tentar obter eventos via RCON
    if (RCON_ENABLED && RCON_PASSWORD) {
      const rconEvents = await getEventsViaRCON();
      if (rconEvents.length > 0) {
        return rconEvents;
      }
    }
    
    // 2. Se não conseguiu via RCON, simular eventos com probabilidade
    // Em uma implementação real, você buscaria eventos ativos de uma API ou banco de dados
    // Como é uma simulação, vamos gerar eventos aleatórios com probabilidade
    
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
    console.error('Error fetching server events:', error);
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
    // 1. Tentar obter via RCON (dados reais)
    if (RCON_ENABLED && RCON_PASSWORD) {
      const rconPlayers = await getPlayersViaRCON();
      if (rconPlayers.length > 0) {
        return rconPlayers;
      }
    }
    
    // 2. Se não conseguiu via RCON, buscar jogadores de outra forma
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
    console.error('Error fetching online players:', error);
    return [];
  }
};

/**
 * Busca dados de desempenho do servidor via RCON
 */
export const fetchServerPerformance = async (): Promise<ServerPerformance | null> => {
  if (!RCON_ENABLED || !RCON_PASSWORD) {
    return null;
  }

  try {
    const client = getRconClient();
    
    // Comando para obter informações de FPS
    const perfResponse = await client.executeCommand('fps');
    
    // Exemplo de resposta: "fps: 60 (min=55, max=90, avg=60)"
    const fpsMatch = perfResponse.match(/fps:\s*(\d+)/);
    
    if (!fpsMatch) {
      return null;
    }
    
    const fps = parseInt(fpsMatch[1], 10);
    
    // Comando para obter informações de memória
    const memResponse = await client.executeCommand('mem');
    
    // Memória em MB
    const memMatch = memResponse.match(/(\d+)MB/);
    const memory = memMatch ? parseInt(memMatch[1], 10) : 0;
    
    // Comando para obter tempo de atividade
    const uptimeResponse = await client.executeCommand('uptime');
    const uptimeMinutes = parseInt(uptimeResponse.trim(), 10) || 0;
    
    return {
      fps,
      memory,
      uptime: uptimeMinutes * 60, // Converter para segundos
      entityCount: 0 // Não disponível diretamente
    };
  } catch (error) {
    console.error('Error fetching server performance via RCON:', error);
    return null;
  }
};