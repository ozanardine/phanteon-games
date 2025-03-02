import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ServerStatus } from '@/components/ui/ServerStatus';
import { Server } from '@/types/database.types';
import { formatDateTime } from '@/utils/dateUtils';
import { FiUsers, FiServer, FiClock, FiMap, FiExternalLink } from 'react-icons/fi';
import { GiEarthAmerica } from 'react-icons/gi';

type ServerCardProps = {
  server: Server;
  onViewDetails?: () => void;
};

export function ServerCard({ server, onViewDetails }: ServerCardProps) {
  // Garantir valores padrão seguros para todas as propriedades que podem ser undefined
  const serverName = server.name || 'Sem nome';
  const serverStatus = server.status || 'offline';
  const serverGame = server.game || 'Desconhecido';
  const serverIp = server.ip || 'localhost';
  const serverPort = server.port || 0;
  const serverMap = server.map || 'Desconhecido';
  const serverLastOnline = server.last_online || new Date().toISOString();
  
  // Valores numéricos com fallback
  const playersMax = server.players_max || 0;
  const playersCurrent = server.players_current || 0;

  const handleCopyAddress = (e: React.MouseEvent): void => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${serverIp}:${serverPort}`);
    alert('Endereço do servidor copiado para a área de transferência!');
  };

  // Determinar a taxa de ocupação e cor correspondente
  const occupancyRate = playersMax > 0 ? (playersCurrent / playersMax) * 100 : 0;
  const occupancyColor = 
    occupancyRate > 80 ? 'bg-red-500' :
    occupancyRate > 50 ? 'bg-yellow-500' :
    'bg-green-500';

  // Adicionar classes para hover e cliques
  const cardClasses = onViewDetails 
    ? 'cursor-pointer transition-transform hover:scale-[1.01] hover:shadow-xl' 
    : '';
  
  // Envolve o Card em uma div que recebe o onClick
  return (
    <div onClick={onViewDetails} className={`h-full ${cardClasses}`}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-white">{serverName}</h2>
            <ServerStatus status={serverStatus} />
          </div>
          <p className="text-sm text-gray-400">{serverGame}</p>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Players & Map Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-phanteon-dark rounded-md p-3">
                <div className="flex items-center text-gray-300 mb-1">
                  <FiUsers className="mr-2" />
                  <span className="text-sm font-medium">Jogadores</span>
                </div>
                <div className="flex items-center">
                  <p className="text-white font-medium">
                    {playersCurrent} / {playersMax}
                  </p>
                  {playersMax > 0 && (
                    <div className="ml-auto h-2 w-16 bg-phanteon-light rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${occupancyColor}`} 
                        style={{ width: `${occupancyRate}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-phanteon-dark rounded-md p-3">
                <div className="flex items-center text-gray-300 mb-1">
                  <GiEarthAmerica className="mr-2" />
                  <span className="text-sm font-medium">Mapa</span>
                </div>
                <p className="text-white font-medium truncate">
                  {serverMap}
                </p>
              </div>
            </div>
            
            {/* Server Address & Last Update */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-phanteon-dark rounded-md p-3">
                <div className="flex items-center text-gray-300 mb-1">
                  <FiServer className="mr-2" />
                  <span className="text-sm font-medium">Endereço</span>
                </div>
                <p className="text-white font-medium overflow-hidden overflow-ellipsis">
                  {serverIp}:{serverPort}
                </p>
              </div>
              
              <div className="bg-phanteon-dark rounded-md p-3">
                <div className="flex items-center text-gray-300 mb-1">
                  <FiClock className="mr-2" />
                  <span className="text-sm font-medium">Última atualização</span>
                </div>
                <p className="text-white text-sm">
                  {formatDateTime(serverLastOnline)}
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button 
                variant="secondary"
                fullWidth
                onClick={handleCopyAddress}
                className="flex-1"
              >
                Copiar IP
              </Button>
              
              {onViewDetails && (
                <Button 
                  variant="primary"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails();
                  }}
                  className="flex-1"
                >
                  Detalhes
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}