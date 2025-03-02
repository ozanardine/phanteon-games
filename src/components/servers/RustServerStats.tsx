import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Server } from '@/types/database.types';
import { formatDate } from '@/utils/dateUtils';
import { 
  FiCpu, 
  FiMap, 
  FiCalendar, 
  FiClock, 
  FiUsers, 
  FiPieChart, 
  FiServer, 
  FiBell
} from 'react-icons/fi';
import { SiRust } from 'react-icons/si';
import { GiSleepingBag } from "react-icons/gi";

type RustServerStatsProps = {
  server: Server;
  extraData?: any;
};

export function RustServerStats({ server, extraData }: RustServerStatsProps) {
  // Dados extras que podem vir da API BattleMetrics
  const battlemetricsData = extraData || {};
  
  // Interface para as props do StatItem
  interface StatItemProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    bgColor?: string;
  }

  // Componente para exibir uma estatística individual
  const StatItem: React.FC<StatItemProps> = ({ icon, label, value, bgColor = 'bg-phanteon-light' }) => (
    <div className={`rounded-lg p-3 ${bgColor}`}>
      <div className="flex items-center text-gray-300 mb-1">
        {icon}
        <span className="text-sm font-medium ml-2">{label}</span>
      </div>
      <p className="text-white font-medium">{value}</p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Estatísticas do Servidor</h2>
          <SiRust className="text-phanteon-orange text-xl" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatItem 
            icon={<FiUsers className="text-blue-400" />}
            label="Jogadores"
            value={`${server.players_current} / ${server.players_max}`}
            bgColor="bg-blue-900/20"
          />
          
          <StatItem 
            icon={<GiSleepingBag className="text-indigo-400" />}
            label="Dormindo"
            value={server.sleeping_players || battlemetricsData.sleepers || '0'}
            bgColor="bg-indigo-900/20"
          />
          
          <StatItem 
            icon={<FiCpu className="text-green-400" />}
            label="FPS do Servidor"
            value={battlemetricsData.fps || '60+'}
            bgColor="bg-green-900/20"
          />
          
          <StatItem 
            icon={<FiClock className="text-yellow-400" />}
            label="Tempo Online"
            value={server.uptime_seconds 
              ? `${Math.floor(server.uptime_seconds / 3600)}h ${Math.floor((server.uptime_seconds % 3600) / 60)}m` 
              : 'N/A'}
            bgColor="bg-yellow-900/20"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatItem 
            icon={<FiMap className="text-purple-400" />}
            label="Mapa"
            value={server.map || 'Procedural Map'}
            bgColor="bg-purple-900/20"
          />
          
          <StatItem 
            icon={<FiPieChart className="text-red-400" />}
            label="Tamanho do Mundo"
            value={server.world_size ? `${server.world_size}x${server.world_size}` : 'Padrão'}
            bgColor="bg-red-900/20"
          />
          
          <StatItem 
            icon={<FiServer className="text-cyan-400" />}
            label="Seed"
            value={server.seed || 'Aleatório'}
            bgColor="bg-cyan-900/20"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <StatItem 
            icon={<FiCalendar className="text-orange-400" />}
            label="Último Wipe"
            value={server.last_wipe ? formatDate(server.last_wipe) : 'Desconhecido'}
            bgColor="bg-orange-900/20"
          />
          
          <StatItem 
            icon={<FiBell className="text-pink-400" />}
            label="Próximo Wipe"
            value={server.next_wipe ? formatDate(server.next_wipe) : 'Não Agendado'}
            bgColor="bg-pink-900/20"
          />
        </div>
        
        <div className="p-3 rounded-lg bg-phanteon-light">
          <h3 className="text-white font-medium mb-2">Informações Adicionais</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Tipo de Wipe:</span>
              <span className="text-white">{server.wipe_type === 'map' ? 'Apenas Mapa' : 'Mapa e BP'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Modificado:</span>
              <span className="text-white">{server.modded ? 'Sim' : 'Não'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Ping:</span>
              <span className="text-white">{server.ping || 'N/A'} ms</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Entidades:</span>
              <span className="text-white">{battlemetricsData.entities || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Fila:</span>
              <span className="text-white">{battlemetricsData.queue || '0'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Memória:</span>
              <span className="text-white">{battlemetricsData.memory_mb ? `${battlemetricsData.memory_mb} MB` : 'N/A'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}