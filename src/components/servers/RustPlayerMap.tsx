import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { FiUser } from 'react-icons/fi';

type Position = {
  x: number;
  y: number;
  name: string;
  is_admin: boolean;
  steam_id: string;
};

type RustPlayerMapProps = {
  players: any[];
  mapName: string;
  worldSize: number;
};

export function RustPlayerMap({ players, mapName, worldSize = 4500 }: RustPlayerMapProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  
  useEffect(() => {
    // Converter coordenadas dos jogadores para posições no mapa
    if (players && players.length > 0) {
      const processedPositions = players
        .filter(player => player.position_x != null && player.position_z != null)
        .map(player => ({
          x: ((player.position_x + worldSize / 2) / worldSize) * 100, // Converter para percentagem
          y: ((player.position_z + worldSize / 2) / worldSize) * 100, // Usar position_z como coordenada Y
          name: player.name,
          is_admin: player.is_admin,
          steam_id: player.steam_id
        }));
      
      setPositions(processedPositions);
    }
  }, [players, worldSize]);
  
  // Determinar o URL do mapa com base no nome
  const getMapImageUrl = (mapName: string): string => {
    // Em uma implementação real, você teria imagens reais dos mapas
    // Para este exemplo, usamos uma imagem genérica
    return '/images/maps/rust_default_map.jpg';
  };
  
  const handlePlayerHover = (steamId: string): void => {
    setHoveredPlayer(steamId);
  };
  
  const handlePlayerLeave = (): void => {
    setHoveredPlayer(null);
  };
  
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold text-white">Mapa do Servidor</h2>
      </CardHeader>
      <CardContent>
        <div className="relative w-full" style={{ paddingBottom: '100%' }}>
          {/* Container do mapa */}
          <div 
            className="absolute inset-0 rounded-lg overflow-hidden bg-phanteon-dark"
            style={{ backgroundImage: `url(${getMapImageUrl(mapName)})`, backgroundSize: 'cover' }}
          >
            {/* Jogadores no mapa */}
            {positions.map((pos) => (
              <div
                key={pos.steam_id}
                className={`absolute w-3 h-3 rounded-full 
                  ${pos.is_admin ? 'bg-red-500' : 'bg-green-500'} 
                  ${hoveredPlayer === pos.steam_id ? 'w-4 h-4 -mt-0.5 -ml-0.5 z-10 ring-2 ring-white' : ''}
                  cursor-pointer transition-all`}
                style={{ 
                  left: `${pos.x}%`, 
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseEnter={() => handlePlayerHover(pos.steam_id)}
                onMouseLeave={handlePlayerLeave}
              >
                {hoveredPlayer === pos.steam_id && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 whitespace-nowrap bg-black bg-opacity-75 text-white text-xs py-1 px-2 rounded">
                    {pos.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <span>Jogadores</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            <span>Administradores</span>
          </div>
          <div>
            <span>Tamanho do Mundo: {worldSize}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}