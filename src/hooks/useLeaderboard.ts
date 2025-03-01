// src/hooks/useLeaderboard.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';

interface LeaderboardEntry {
  id: string;
  steam_id: string;
  name: string;
  type: string;
  score: number;
  secondary_score: number;
  month: string;
  server_id: string;
}

interface UseLeaderboardResult {
  data: LeaderboardEntry[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook personalizado para buscar dados de leaderboard do servidor
 * @param serverId ID do servidor (opcional)
 * @param leaderboardType Tipo de leaderboard (kills, playtime, deaths)
 * @param month Mês no formato YYYY-MM (opcional, usa o mês atual por padrão)
 * @param limit Limite de resultados (opcional, 10 por padrão)
 */
export const useLeaderboard = (
  serverId: string = 'game.phanteongames.com:28015',
  leaderboardType: string = 'kills',
  month?: string,
  limit: number = 10
): UseLeaderboardResult => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Determinar o mês atual se não for fornecido
  const currentMonth = month || (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();

  // Função para buscar dados do leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('server_id', serverId)
        .eq('month', currentMonth)
        .eq('type', leaderboardType)
        .order('score', { ascending: false })
        .limit(limit);
      
      if (leaderboardError) {
        throw new Error(`Erro ao buscar leaderboard: ${leaderboardError.message}`);
      }
      
      setData(leaderboardData || []);
    } catch (err) {
      console.error('Erro ao buscar leaderboard:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao buscar leaderboard'));
    } finally {
      setIsLoading(false);
    }
  }, [serverId, leaderboardType, currentMonth, limit]);

  // Efeito para buscar dados inicialmente
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchLeaderboard
  };
};

export default useLeaderboard;