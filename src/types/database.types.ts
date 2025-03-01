// src/types/database.types.ts
export type User = {
    id: string;
    email?: string;
    username?: string;
    avatar_url?: string;
    discord_id?: string;
    steam_id?: string;
    is_vip: boolean;
    vip_expires_at?: string;
    created_at: string;
  };
  
  export type Server = {
    id: string;
    name: string;
    game: string;
    ip: string;
    port: number;
    status: 'online' | 'offline';
    players_current: number;
    players_max: number;
    last_online: string;
  };
  
  export type VipPlan = {
    id: string;
    name: string;
    price: number;
    description: string;
    duration_days: number;
    features: string[];
  };
  