// src/hooks/usePlayerStats.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';

interface PlayerStats {
  steam_id: string;
  name: string;
  is_online: boolean;
  last_connected: string;
  last_disconnected: string | null;
  total_playtime: number;
  monthly_playtime: number;
  total_kills: number;
  total_deaths: number;
  monthly_kills: number;
  monthly_deaths: number;
  server_id: string;
  last_position_x: number | null;
  last_position_y: number | null;
  last_position_z: number | null;
}

interface UsePlayerStatsResult {
  playerStats: PlayerStats | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook personalizado para buscar estatísticas de um jogador específico
 * @param steamId ID da Steam do jogador
 * @param serverId ID do servidor (opcional)
 */
export const usePlayerStats = (
  steamId: string,
  serverId: string = 'game.phanteongames.com:28015'
): UsePlayerStatsResult => {
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Função para buscar estatísticas do jogador
  const fetchPlayerStats = useCallback(async () => {
    if (!steamId) {
      setError(new Error('ID Steam não fornecido'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: queryError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('steam_id', steamId)
        .eq('server_id', serverId)
        .single();
      
      if (queryError) {
        if (queryError.code === 'PGRST116') {
          // Código para "não encontrado" - não lançar erro, apenas retornar null
          setPlayerStats(null);
        } else {
          throw new Error(`Erro ao buscar estatísticas: ${queryError.message}`);
        }
      } else {
        setPlayerStats(data);
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas do jogador:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao buscar estatísticas'));
    } finally {
      setIsLoading(false);
    }
  }, [steamId, serverId]);

  // Efeito para buscar dados inicialmente
  useEffect(() => {
    fetchPlayerStats();
  }, [fetchPlayerStats]);

  return {
    playerStats,
    isLoading,
    error,
    refresh: fetchPlayerStats
  };
};

export default usePlayerStats;