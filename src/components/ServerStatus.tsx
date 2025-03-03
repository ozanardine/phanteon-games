// src/components/ServerStatus.tsx
import React, { useState, useEffect } from 'react';
import { FiUsers, FiServer, FiMap, FiCalendar, FiHash, FiMaximize2 } from 'react-icons/fi';

type ServerData = {
  name: string;
  status: string;
  players: number;
  maxPlayers: number;
  address: string;
  map: string;
  seed?: string;
  worldSize?: string;
  lastWipe?: string;
};

export function ServerStatusBox() {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServerData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/server-status');
        
        if (!response.ok) {
          throw new Error('Failed to fetch server data');
        }
        
        const data = await response.json();
        setServerData(data);
      } catch (err: any) {
        console.error('Error fetching server data:', err);
        setError(err.message || 'Failed to fetch server data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServerData();
    
    // Auto refresh a cada 2 minutos
    const interval = setInterval(fetchServerData, 120000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-phanteon-gray rounded-lg p-6 border border-phanteon-light animate-pulse">
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-4 border-phanteon-orange border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !serverData) {
    return (
      <div className="bg-phanteon-gray rounded-lg p-6 border border-phanteon-light">
        <h3 className="text-xl font-bold text-white mb-3">Status do Servidor</h3>
        <p className="text-red-400 text-center">
          Não foi possível carregar as informações do servidor.
        </p>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-phanteon-gray rounded-lg p-6 border border-phanteon-light">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <FiServer className="mr-2 text-phanteon-orange" />
        Status do Servidor
      </h3>

      <div className="bg-phanteon-dark rounded-lg p-4 mb-4">
        <h4 className="font-bold text-lg text-white truncate">{serverData.name}</h4>
        <div className="flex items-center mt-2">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
            serverData.status === 'online' ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          <span className="text-gray-300">
            {serverData.status === 'online' ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-phanteon-dark rounded-lg p-3">
          <div className="flex items-center text-gray-300 mb-1">
            <FiUsers className="mr-2 text-phanteon-orange" />
            <span className="text-sm">Jogadores</span>
          </div>
          <p className="text-white font-medium">
            {serverData.players} / {serverData.maxPlayers}
          </p>
        </div>
        
        <div className="bg-phanteon-dark rounded-lg p-3">
          <div className="flex items-center text-gray-300 mb-1">
            <FiMap className="mr-2 text-phanteon-orange" />
            <span className="text-sm">Mapa</span>
          </div>
          <p className="text-white font-medium truncate">
            {serverData.map}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {serverData.seed && (
          <div className="bg-phanteon-dark rounded-lg p-3">
            <div className="flex items-center text-gray-300 mb-1">
              <FiHash className="mr-2 text-phanteon-orange" />
              <span className="text-sm">Seed</span>
            </div>
            <p className="text-white font-medium">
              <a 
                href="https://rustmaps.com/map/4500_1708110947" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-phanteon-orange hover:underline"
              >
                {serverData.seed}
              </a>
            </p>
          </div>
        )}
        
        {serverData.worldSize && (
          <div className="bg-phanteon-dark rounded-lg p-3">
            <div className="flex items-center text-gray-300 mb-1">
              <FiMaximize2 className="mr-2 text-phanteon-orange" />
              <span className="text-sm">Tamanho</span>
            </div>
            <p className="text-white font-medium">
              {serverData.worldSize}
            </p>
          </div>
        )}
      </div>
      
      {serverData.lastWipe && (
        <div className="bg-phanteon-dark rounded-lg p-3 mt-3">
          <div className="flex items-center text-gray-300 mb-1">
            <FiCalendar className="mr-2 text-phanteon-orange" />
            <span className="text-sm">Último Wipe</span>
          </div>
          <p className="text-white font-medium">
            {formatDate(serverData.lastWipe)}
          </p>
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-phanteon-light">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Endereço:</span>
          <span className="text-gray-300">{serverData.address}</span>
        </div>
      </div>
    </div>
  );
}