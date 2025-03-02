// Utilitário para conexão WebSocket com o servidor
// Isso será usado futuramente para receber eventos em tempo real

import { ServerEvent, OnlinePlayer } from '@/types/database.types';

type ServerWebsocketOptions = {
  serverId: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onPlayerUpdate?: (players: OnlinePlayer[]) => void;
  onEventUpdate?: (events: ServerEvent[]) => void;
  onServerStatusUpdate?: (status: { online: boolean, players: number }) => void;
};

// Definir os tipos de eventos permitidos
type EventType = 'cargo_ship' | 'patrol_helicopter' | 'bradley_apc' | 'airdrop' | 'player_kill' | 'player_raid';

export class ServerWebsocket {
  private socket: WebSocket | null = null;
  private options: ServerWebsocketOptions;
  private reconnectAttempts = 0;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private connected = false;

  constructor(options: ServerWebsocketOptions) {
    this.options = options;
  }

  public connect(): void {
    // O endpoint WebSocket real deve ser configurado quando implementado
    // Isso é apenas um exemplo de como será a implementação
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/servers/${this.options.serverId}`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      this.handleError(error);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
    }
    
    this.stopPing();
    this.stopReconnect();
  }

  public isConnected(): boolean {
    return this.connected;
  }

  // Simulação de conexão para teste
  // Isso deve ser removido quando o WebSocket real for implementado
  public simulateConnection(): void {
    console.log('Simulando conexão WebSocket para o servidor:', this.options.serverId);
    this.connected = true;
    
    if (this.options.onConnect) {
      this.options.onConnect();
    }
    
    // Simular atualizações de jogadores a cada 10 segundos
    setInterval(() => {
      if (this.options.onPlayerUpdate) {
        this.options.onPlayerUpdate(this.generateSimulatedPlayers());
      }
    }, 10000);
    
    // Simular eventos ocasionais
    setInterval(() => {
      if (this.options.onEventUpdate && Math.random() > 0.7) { // 30% de chance
        this.options.onEventUpdate([this.generateSimulatedEvent()]);
      }
    }, 15000);
    
    // Simular atualizações de status
    setInterval(() => {
      if (this.options.onServerStatusUpdate) {
        const online = Math.random() > 0.1; // 90% de chance de estar online
        this.options.onServerStatusUpdate({
          online,
          players: online ? Math.floor(Math.random() * 50) + 1 : 0
        });
      }
    }, 20000);
  }

  private handleOpen(): void {
    this.connected = true;
    this.reconnectAttempts = 0;
    this.stopReconnect();
    this.startPing();
    
    if (this.options.onConnect) {
      this.options.onConnect();
    }
  }

  private handleClose(event: CloseEvent): void {
    this.connected = false;
    this.stopPing();
    
    if (this.options.onDisconnect) {
      this.options.onDisconnect();
    }
    
    // Tentar reconectar automaticamente
    this.startReconnect();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'player_update' && this.options.onPlayerUpdate) {
        this.options.onPlayerUpdate(data.players);
      } else if (data.type === 'event_update' && this.options.onEventUpdate) {
        this.options.onEventUpdate(data.events);
      } else if (data.type === 'server_status' && this.options.onServerStatusUpdate) {
        this.options.onServerStatusUpdate(data.status);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleError(error: any): void {
    console.error('WebSocket error:', error);
    
    if (this.options.onError) {
      this.options.onError(error);
    }
  }

  private startPing(): void {
    this.stopPing();
    
    // Enviar ping a cada 30 segundos para manter a conexão
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private startReconnect(): void {
    this.stopReconnect();
    
    // Exponential backoff para reconexão
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectInterval = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private stopReconnect(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  // Métodos para simulação - remover quando o WebSocket real for implementado
  private generateSimulatedPlayers(): OnlinePlayer[] {
    const numPlayers = Math.floor(Math.random() * 10) + 1;
    const players: OnlinePlayer[] = [];
    
    for (let i = 0; i < numPlayers; i++) {
      players.push({
        steam_id: `7656119${Math.floor(Math.random() * 90000000) + 10000000}`,
        server_id: this.options.serverId,
        name: this.getRandomName(),
        position_x: Math.random() * 4500 - 2250,
        position_y: Math.random() * 100 + 50,
        position_z: Math.random() * 4500 - 2250,
        health: Math.floor(Math.random() * 50) + 50,
        is_alive: Math.random() > 0.1,
        is_admin: Math.random() > 0.9,
        ping: Math.floor(Math.random() * 100) + 10,
        session_time: Math.floor(Math.random() * 600),
        updated_at: new Date().toISOString()
      });
    }
    
    return players;
  }

  private generateSimulatedEvent(): ServerEvent {
    const eventTypes: EventType[] = [
      'cargo_ship',
      'patrol_helicopter',
      'bradley_apc',
      'airdrop',
      'player_kill',
      'player_raid'
    ];
    
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    // Usar tipo Record para definir explicitamente o mapeamento de nomes
    const eventNames: Record<EventType, string> = {
      'cargo_ship': 'Navio de Carga',
      'patrol_helicopter': 'Helicóptero de Patrulha',
      'bradley_apc': 'Bradley APC',
      'airdrop': 'Airdrop',
      'player_kill': 'Jogador Morto',
      'player_raid': 'Raid de Jogador'
    };
    
    let extraData = {};
    
    if (eventType === 'player_kill') {
      extraData = {
        killer: this.getRandomName(),
        victim: this.getRandomName(),
        weapon: this.getRandomWeapon(),
        distance: Math.floor(Math.random() * 300) + 1,
        headshot: Math.random() < 0.3
      };
    }
    
    return {
      event_id: `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      server_id: this.options.serverId,
      type: eventNames[eventType],
      event_type_rust: eventType,
      position_x: Math.random() * 4500 - 2250,
      position_y: Math.random() * 100 + 50,
      position_z: Math.random() * 4500 - 2250,
      is_active: Math.random() > 0.5,
      extra_data: extraData,
      updated_at: new Date().toISOString()
    };
  }

  private getRandomName(): string {
    const names = [
      'RustPlayer123', 'IronWarrior', 'SaltyRaider', 'MetalHead', 
      'BaseBuilder', 'RaidMaster', 'LootLord', 'RadiationKing',
      'BoltAction', 'HeadShotter', 'RockThrower', 'BluePrints'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomWeapon(): string {
    const weapons = [
      'AK-47', 'Bolt Action Rifle', 'Custom SMG', 'Thompson', 
      'MP5A4', 'LR-300', 'M249', 'L96 Rifle'
    ];
    return weapons[Math.floor(Math.random() * weapons.length)];
  }
}