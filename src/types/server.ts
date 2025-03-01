// src/types/server.ts

// Tipos para informações do servidor
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

// Tipos para histórico de wipes
export interface WipeHistory {
  date: Date;
  isForceWipe: boolean;
  mapSize: string;
  seed: string;
  reason?: string;
}

// Tipos para monumentos
export interface Monument {
  name: string;
  type: string;
  tier: 'low' | 'medium' | 'high';
  coords?: {
    x: number;
    y: number;
  };
}

// Tipos para regras do servidor
export interface ServerRule {
  id: number;
  category: string;
  title: string;
  description: string;
  priority: number;
}