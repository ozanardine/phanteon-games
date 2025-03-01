import React, { useState, useEffect } from 'react';
import { formatDateBR } from '../../lib/utils/dateUtils';
import { supabase } from '../../lib/supabase/client';

interface ServerStatusProps {
  isOnline: boolean;
  playerCount: number;
  maxPlayers?: number;
  mapSize: string;
  seed: string;
}

const ServerStatus = ({ 
  isOnline, 
  playerCount, 
  maxPlayers = 200, 
  mapSize, 
  seed 
}: ServerStatusProps) => {
  const [lastWipe, setLastWipe] = useState<Date | null>(null);
  const [nextWipe, setNextWipe] = useState<Date | null>(null);
  const [ping, setPing] = useState<number>(30);
  
  // Buscar dados de wipe e ping diretamente do Supabase
  useEffect(() => {
    const fetchServerDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('server_info')
          .select('last_wipe, next_wipe, ping')
          .eq('server_id', 'game.phanteongames.com:28015')
          .single();
          
        if (!error && data) {
          if (data.last_wipe) setLastWipe(new Date(data.last_wipe));
          if (data.next_wipe) setNextWipe(new Date(data.next_wipe));
          if (data.ping) setPing(data.ping);
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes do servidor:', err);
      }
    };
    
    fetchServerDetails();
  }, []);
  
  // Calcular datas de wipe se não disponíveis no banco
  if (!lastWipe) {
    const tempLastWipe = new Date();
    tempLastWipe.setDate(1); // Primeiro dia do mês atual
    setLastWipe(tempLastWipe);
  }
  
  if (!nextWipe) {
    const tempNextWipe = new Date();
    tempNextWipe.setMonth(tempNextWipe.getMonth() + 1, 1); // Primeiro dia do próximo mês
    
    // Encontrar a primeira quinta-feira do próximo mês (dia 4 da semana)
    const dayOfWeek = tempNextWipe.getDay(); // 0 (Dom) a 6 (Sáb)
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    tempNextWipe.setDate(tempNextWipe.getDate() + daysUntilThursday);
    
    setNextWipe(tempNextWipe);
  }

  return (
    <div className="bg-zinc-800/90 backdrop-blur-md border border-zinc-700 rounded-lg p-6 w-full max-w-xl shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-2xl">Status do Servidor</h3>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Player Count com barra de progresso */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-zinc-400">Jogadores</span>
            <span className="font-semibold">{playerCount}/{maxPlayers}</span>
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-2.5">
            <div 
              className="bg-amber-500 h-2.5 rounded-full" 
              style={{ width: `${(playerCount / maxPlayers) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Informações do Mapa */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-zinc-400 text-sm mb-1">Tamanho do Mapa</div>
            <div className="font-semibold">{mapSize}</div>
          </div>
          <div>
            <div className="text-zinc-400 text-sm mb-1">Seed</div>
            <div className="font-semibold font-mono">{seed}</div>
          </div>
        </div>
        
        {/* Datas de Wipe */}
        <div>
          <div className="text-zinc-400 text-sm mb-1">Último Wipe</div>
          <div className="font-semibold">{lastWipe ? formatDateBR(lastWipe) : 'Carregando...'} (Force Wipe)</div>
        </div>
        
        <div>
          <div className="text-zinc-400 text-sm mb-1">Próximo Wipe</div>
          <div className="font-semibold">{nextWipe ? formatDateBR(nextWipe) : 'Carregando...'} (Force Wipe)</div>
        </div>
        
        {/* Ping estimado */}
        <div>
          <div className="text-zinc-400 text-sm mb-1">Localização do Servidor</div>
          <div className="font-semibold">Brasil (São Paulo) - Ping ~{ping}ms</div>
        </div>
      </div>
    </div>
  );
};

export default ServerStatus;