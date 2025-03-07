import React from 'react';
import Link from 'next/link';
import { FiUsers, FiServer, FiMap, FiCalendar, FiHash, FiMaximize2, FiExternalLink, FiClock } from 'react-icons/fi';
import Card from '../ui/Card';

export function ServerCard({ 
  id, 
  name, 
  game, 
  status, 
  players, 
  maxPlayers, 
  map, 
  seed, 
  worldSize, 
  lastWipe, 
  address,
  description,
  logo
}) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Calculate player percentage for progress bar
  const playerPercentage = Math.min(Math.round((players / maxPlayers) * 100), 100);
  const getPlayerBarColor = () => {
    if (playerPercentage < 30) return 'bg-green-500';
    if (playerPercentage < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card 
      hoverable 
      variant="darker"
      className="h-full transition-all duration-300 hover:border-primary/30 flex flex-col"
    >
      <div className="p-5">
        {/* Status Badge */}
        <div className="flex justify-between items-start mb-4">
          <Card.Badge 
            variant={status === 'online' ? 'success' : 'danger'}
            className="mb-2"
          >
            {status === 'online' ? 'Online' : 'Offline'}
          </Card.Badge>
          
          <Card.Badge variant="info" className="capitalize">
            {game}
          </Card.Badge>
        </div>
        
        <div className="flex items-start mb-4">
          {logo && (
            <div className="w-16 h-16 mr-4 rounded-md bg-dark-400 overflow-hidden flex-shrink-0 border border-dark-200">
              <img 
                src={logo} 
                alt={`${name} logo`} 
                className="w-full h-full object-cover" 
              />
            </div>
          )}
          <div className="flex-grow">
            <h3 className="text-xl font-bold text-white break-words">{name}</h3>
          </div>
        </div>
        
        {description && (
          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Players Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center text-gray-300">
              <FiUsers className="mr-2 text-primary" />
              <span className="text-sm">Jogadores</span>
            </div>
            <span className="text-white font-medium">
              {players}/{maxPlayers}
            </span>
          </div>
          <div className="w-full bg-dark-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${getPlayerBarColor()}`} 
              style={{ width: `${playerPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-dark-400 rounded-lg p-3">
            <div className="flex items-center text-gray-300 mb-1">
              <FiMap className="mr-2 text-primary" />
              <span className="text-sm">Mapa</span>
            </div>
            <p className="text-white font-medium truncate">
              {map}
            </p>
          </div>
          
          {seed && (
            <div className="bg-dark-400 rounded-lg p-3">
              <div className="flex items-center text-gray-300 mb-1">
                <FiHash className="mr-2 text-primary" />
                <span className="text-sm">Seed</span>
              </div>
              <p className="text-white font-medium">
                {game === 'rust' ? (
                  <Link href={`/servers/${id}?tab=info`} legacyBehavior>
                    <a className="text-primary hover:underline flex items-center">
                      <span className="truncate">{seed}</span>
                      <FiExternalLink className="ml-1 text-xs flex-shrink-0" />
                    </a>
                  </Link>
                ) : seed}
              </p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-3">
          {worldSize && (
            <div className="bg-dark-400 rounded-lg p-3">
              <div className="flex items-center text-gray-300 mb-1">
                <FiMaximize2 className="mr-2 text-primary" />
                <span className="text-sm">Tamanho</span>
              </div>
              <p className="text-white font-medium">
                {worldSize}
              </p>
            </div>
          )}
          
          {lastWipe && (
            <div className="bg-dark-400 rounded-lg p-3">
              <div className="flex items-center text-gray-300 mb-1">
                <FiCalendar className="mr-2 text-primary" />
                <span className="text-sm">Último Wipe</span>
              </div>
              <p className="text-white font-medium">
                {formatDate(lastWipe)}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-dark-200 bg-dark-400/50">
        <Link href={`/servers/${id}`} legacyBehavior>
          <a className="w-full bg-primary hover:bg-primary/90 text-white rounded-md py-2 px-4 font-medium flex items-center justify-center transition-all duration-200">
            <FiServer className="mr-2" />
            Detalhes do Servidor
          </a>
        </Link>
      </div>
    </Card>
  );
}
