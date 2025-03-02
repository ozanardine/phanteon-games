// src/types/database.types.ts
export type User = {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  discord_id?: string;
  is_vip: boolean;
  vip_expires_at?: string;
  created_at: string;
};

export type Server = {
  id: string;
  server_id: string;
  name: string;
  game: string;
  ip: string;
  port: number;
  status: 'online' | 'offline';
  is_online: boolean;
  players_current: number;
  players_max: number;
  online_players?: number;
  max_players?: number;
  map?: string;
  description?: string;
  last_wipe?: string;
  next_wipe?: string;
  world_size?: number;
  wipe_type?: string;
  seed?: string;
  uptime_seconds?: number;
  sleeping_players?: number;
  ping?: number;
  last_online: string;
  battlemetrics_id?: string;
  modded?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type VipPlan = {
  id: string;
  name: string;
  price: number;
  description: string;
  duration_days: number;
  features: string[] | string;
  is_active: boolean;
};

export type OnlinePlayer = {
  steam_id: string;
  server_id: string;
  name: string;
  position_x?: number;
  position_y?: number;
  position_z?: number;
  health?: number;
  is_alive: boolean;
  is_admin: boolean;
  ping: number;
  session_time: number;
  updated_at: string;
};

export type ServerPlugin = {
  id: string;
  server_id: string;
  name: string;
  description: string;
  version: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ServerEvent = {
  event_id: string;
  server_id: string;
  type: string;
  event_type_rust?: string;
  position_x?: number;
  position_y?: number;
  position_z?: number;
  is_active: boolean;
  extra_data?: any;
  updated_at: string;
};

export type ServerTeamMember = {
  id: string;
  user_id: string;
  server_id: string;
  role: string;
  position: number;
  created_at?: string;
  profiles?: {
    id: string;
    username?: string;
    avatar_url?: string;
  };
};

export type LeaderboardEntry = {
  id: string;
  steam_id: string;
  server_id: string;
  name: string;
  type: string;
  score: number;
  secondary_score?: number;
  month: string;
  updated_at: string;
};

export type PerformanceStats = {
  server_id: string;
  fps?: number;
  uptime_seconds?: number;
  players: number;
  entities?: number;
  memory_mb?: number;
  sleepers?: number;
  updated_at: string;
};