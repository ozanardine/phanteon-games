// src/types/server.ts

// Importando os tipos da API do Steam para evitar duplicação
import { 
  ServerInfo, 
  ServerEvent, 
  ServerStatusResponse,
  ServerPlayer
} from '../lib/api/steamApi';

// Re-exportando os tipos importados
export type { ServerInfo, ServerEvent, ServerStatusResponse };

// Alias para ServerPlayer para manter compatibilidade com código existente
export type Player = ServerPlayer;

// Tipos para mapas
export interface MapInfo {
  name: string;
  size: string;
  seed: string;
  salt?: number;
  monuments: string[];
  biomes: {
    desert: number;
    snow: number;
    forest: number;
    plains: number;
  };
  imageUrl?: string;
  hasCustomMap?: boolean;
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