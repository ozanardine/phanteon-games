import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ServerStatus } from '@/components/ui/ServerStatus';
import { Server } from '@/types/database.types';
import { FiUsers, FiServer, FiClock } from 'react-icons/fi';
import { formatDateTime } from '@/utils/dateUtils';

type ServerCardProps = {
  server: Server;
};

export function ServerCard({ server }: ServerCardProps) {
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${server.ip}:${server.port}`);
    alert('Endereço do servidor copiado para a área de transferência!');
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-white">{server.name}</h2>
          <ServerStatus status={server.status} />
        </div>
        <p className="text-sm text-gray-400">{server.game}</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-phanteon-dark rounded-md p-3">
              <div className="flex items-center text-gray-300 mb-1">
                <FiUsers className="mr-2" />
                <span className="text-sm font-medium">Jogadores</span>
              </div>
              <p className="text-white font-medium">
                {server.players_current} / {server.players_max}
              </p>
            </div>
            
            <div className="bg-phanteon-dark rounded-md p-3">
              <div className="flex items-center text-gray-300 mb-1">
                <FiServer className="mr-2" />
                <span className="text-sm font-medium">Endereço</span>
              </div>
              <p className="text-white font-medium overflow-hidden overflow-ellipsis">
                {server.ip}:{server.port}
              </p>
            </div>
          </div>
          
          <div className="bg-phanteon-dark rounded-md p-3">
            <div className="flex items-center text-gray-300 mb-1">
              <FiClock className="mr-2" />
              <span className="text-sm font-medium">Última atualização</span>
            </div>
            <p className="text-white text-sm">
              {formatDateTime(server.last_online)}
            </p>
          </div>
          
          <Button 
            variant="secondary"
            fullWidth
            onClick={handleCopyAddress}
          >
            Copiar Endereço
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}