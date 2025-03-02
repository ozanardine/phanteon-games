import { Server } from '@/types/database.types';
import { supabase } from '@/lib/supabase';

// Tipos para integração com BattleMetrics
export type BattleMetricsServer = {
  id: string;
  type: string;
  attributes: {
    id: string;
    name: string;
    ip: string;
    port: number;
    players: number;
    maxPlayers: number;
    rank: number;
    location: string;
    status: string;
    details: {
      map: string;
      fps?: number;
      uptime?: number;
      official?: boolean;
      modded?: boolean;
      gamemode?: string;
      secure?: boolean;
      pve?: boolean;
      rust_world_size?: string;
      rust_last_wipe?: string;
      rust_next_wipe?: string;
    };
    createdAt: string;
    updatedAt: string;
    country: string;
  };
  relationships?: {
    game: {
      data: {
        id: string;
        type: string;
      }
    }
  }
};

export type BattleMetricsResponse = {
  data: BattleMetricsServer | BattleMetricsServer[];
  included?: any[];
};

// Plugin do servidor
export type ServerPlugin = {
  id: string;
  name: string;
  description: string;
  version: string;
};

// Função para buscar servidores do Supabase com cache e integração com BattleMetrics
export async function fetchServers(): Promise<Server[]> {
  try {
    // Buscar servidores do Supabase
    const { data, error } = await supabase
      .from('server_info')
      .select('*')
      .order('name');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching servers from Supabase:', error);
    throw error;
  }
}

// Função para buscar detalhes de um servidor específico
export async function fetchServerDetails(serverId: string): Promise<Server | null> {
  try {
    const { data, error } = await supabase
      .from('server_info')
      .select('*')
      .eq('server_id', serverId)
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error fetching server details for ${serverId}:`, error);
    return null;
  }
}

// Buscar dados do BattleMetrics para um servidor Rust
export async function fetchBattleMetricsData(battlemetricsId: string): Promise<BattleMetricsServer | null> {
  try {
    // Esta função seria chamada através de uma rota de API em Next.js
    // para não expor a chave de API do BattleMetrics no cliente
    const response = await fetch(`/api/servers/battlemetrics/${battlemetricsId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch BattleMetrics data: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching BattleMetrics data:', error);
    return null;
  }
}

// Buscar plugins instalados em um servidor
export async function fetchServerPlugins(serverId: string): Promise<ServerPlugin[]> {
  try {
    const { data, error } = await supabase
      .from('server_plugins')
      .select('*')
      .eq('server_id', serverId)
      .order('name');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error fetching plugins for server ${serverId}:`, error);
    return [];
  }
}

// Buscar leaderboard do servidor
export async function fetchServerLeaderboard(serverId: string, type: string = 'kills'): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('server_id', serverId)
      .eq('type', type)
      .order('score', { ascending: false })
      .limit(100);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error fetching leaderboard for server ${serverId}:`, error);
    return [];
  }
}

// Buscar eventos do servidor
export async function fetchServerEvents(serverId: string, limit: number = 50): Promise<any[]> {
  try {
    const response = await fetch(`/api/servers/${serverId}/events?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching server events: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching events for server ${serverId}:`, error);
    return [];
  }
}

// Buscar jogadores online
export async function fetchOnlinePlayers(serverId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('online_players')
      .select('*')
      .eq('server_id', serverId);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error fetching online players for server ${serverId}:`, error);
    return [];
  }
}

// Buscar usuários VIP
export async function fetchVipUsers(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .eq('is_vip', true)
      .limit(20);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching VIP users:', error);
    return [];
  }
}

// Buscar equipe do servidor
export async function fetchServerTeam(serverId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('server_team')
      .select('*, profiles:user_id(*)')
      .eq('server_id', serverId)
      .order('position');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error fetching team for server ${serverId}:`, error);
    return [];
  }
}

// Sincronizar dados de um servidor com o BattleMetrics
export async function syncServerWithBattleMetrics(serverId: string, battlemetricsId: string): Promise<boolean> {
  try {
    // Esta função seria chamada através de uma rota de API em Next.js
    const response = await fetch(`/api/servers/${serverId}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ battlemetricsId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync server: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing server with BattleMetrics:', error);
    return false;
  }
}