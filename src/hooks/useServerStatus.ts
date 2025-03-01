// src/hooks/useServerStatus.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchServerStatus, fetchServerEvents } from '../lib/api/supabaseApi';
import { ServerInfo, ServerStatusResponse, ServerEvent } from '../types/server';
import { getNextWipeDate } from '../lib/utils/dateUtils';

interface UseServerStatusResult {
  serverStatus: ServerStatusResponse | null;
  isOnline: boolean;
  playerCount: number;
  maxPlayers: number;
  mapSize: string;
  seed: string;
  currentEvents: ServerEvent[];
  lastWipe: Date | null;
  nextWipe: Date | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useServerStatus = (
  serverAddress: string = '82.29.62.21:28015',
  refreshInterval: number = 60000 // Atualizar a cada 1 minuto por padrão
): UseServerStatusResult => {
  const [serverData, setServerData] = useState<ServerStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Função para buscar dados do servidor
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar dados do servidor diretamente do Supabase
      const status = await fetchServerStatus(serverAddress);
      
      // Verificar se o servidor está online
      if (!status.info.isOnline) {
        setServerData(status);
        return;
      }
      
      // Buscar dados adicionais se necessário
      if (!status.events || status.events.length === 0) {
        status.events = await fetchServerEvents(serverAddress);
      }
      
      // Se não tiver informações de wipe, calcular
      if (!status.nextWipe) {
        status.nextWipe = getNextWipeDate();
      }
      
      if (!status.lastWipe) {
        // Calcular último wipe com base no próximo (aproximadamente)
        const lastWipe = new Date(status.nextWipe);
        lastWipe.setMonth(lastWipe.getMonth() - 1);
        status.lastWipe = lastWipe;
      }
      
      setServerData(status);
      setLastFetched(new Date());
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar status do servidor:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao buscar dados do servidor'));
    } finally {
      setLoading(false);
    }
  }, [serverAddress]);

  // Efeito para buscar dados inicialmente e configurar intervalo
  useEffect(() => {
    // Buscar dados assim que o componente montar
    fetchData();
    
    // Configurar intervalo para atualizações periódicas
    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);
    
    // Limpar intervalo quando o componente desmontar
    return () => clearInterval(intervalId);
  }, [fetchData, refreshInterval]);

  // Extrair valores relevantes do estado para facilitar uso
  const isOnline = serverData?.info.isOnline || false;
  const playerCount = serverData?.players.online || 0;
  const maxPlayers = serverData?.players.max || 0;
  const mapSize = serverData?.map.size || '4500';
  const seed = serverData?.map.seed || '123456';
  const currentEvents = serverData?.events || [];
  const lastWipe = serverData?.lastWipe || null;
  const nextWipe = serverData?.nextWipe || null;

  return {
    serverStatus: serverData,
    isOnline,
    playerCount,
    maxPlayers,
    mapSize,
    seed,
    currentEvents,
    lastWipe,
    nextWipe,
    loading,
    error,
    refresh: fetchData
  };
};

export default useServerStatus;