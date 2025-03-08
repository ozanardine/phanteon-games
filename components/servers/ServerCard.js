import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiUsers, FiServer, FiMap, FiCalendar, FiHash, FiMaximize2, FiExternalLink, FiClock, FiChevronRight } from 'react-icons/fi';
import { SiRust } from 'react-icons/si';
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
  logo,
  wipeSchedule
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
    <div className="group relative transform transition-all duration-300 hover:-translate-y-1">
      {/* Animated border/glow effect on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/30 group-hover:via-primary/20 group-hover:to-primary/30 rounded-lg opacity-50 group-hover:opacity-100 blur-sm transition-all duration-500"></div>
      
      <Card 
        className="relative h-full flex flex-col border border-dark-200 group-hover:border-primary/30 transition-all duration-300 overflow-hidden"
        shadow={true}
        hoverable={false}
        padding="none"
        variant="darker"
      >
        {/* Server Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          <Card.Badge 
            variant={status === 'online' ? 'success' : 'danger'}
          >
            {status === 'online' ? 'Online' : 'Offline'}
          </Card.Badge>
        </div>
        
        {/* Game Type Badge */}
        <div className="absolute top-4 left-4 z-10">
          <Card.Badge variant="info" className="capitalize flex items-center">
            {game === 'rust' ? (
              <>
                <SiRust className="mr-1" /> Rust
              </>
            ) : game}
          </Card.Badge>
        </div>
        
        {/* Server Image/Banner */}
        <div className="relative w-full h-48 overflow-hidden">
          {logo ? (
            <div className="w-full h-full bg-dark-400 relative">
              <Image
                src={logo}
                alt={`${name} logo`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-dark-400/70 to-transparent"></div>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-dark-300 to-dark-400 flex items-center justify-center">
              <FiServer className="text-4xl text-primary" />
            </div>
          )}
          
          {/* Server name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-400 to-transparent">
            <h3 className="text-xl font-bold text-white">{name}</h3>
          </div>
        </div>
        
        <div className="p-5 flex-grow flex flex-col">
          {/* Description */}
          {description && (
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
              {description}
            </p>
          )}

          {/* Players Bar */}
          <div className="mb-4 bg-dark-400/50 p-3 rounded-lg border border-dark-300/50">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center text-gray-300">
                <FiUsers className="mr-2 text-primary" />
                <span className="text-sm">Jogadores</span>
              </div>
              <span className="text-white font-medium">
                {players}/{maxPlayers}
              </span>
            </div>
            <div className="w-full bg-dark-300 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getPlayerBarColor()} transition-all duration-500`} 
                style={{ width: `${playerPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Server Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-dark-400/50 rounded-lg p-3 border border-dark-300/50">
              <div className="flex items-center text-gray-300 mb-1">
                <FiMap className="mr-2 text-primary" />
                <span className="text-sm">Mapa</span>
              </div>
              <p className="text-white font-medium truncate">
                {map || 'N/A'}
              </p>
            </div>
            
            {seed && (
              <div className="bg-dark-400/50 rounded-lg p-3 border border-dark-300/50">
                <div className="flex items-center text-gray-300 mb-1">
                  <FiHash className="mr-2 text-primary" />
                  <span className="text-sm">Seed</span>
                </div>
                <p className="text-white font-medium truncate">
                  {seed}
                </p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {worldSize && (
              <div className="bg-dark-400/50 rounded-lg p-3 border border-dark-300/50">
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
              <div className="bg-dark-400/50 rounded-lg p-3 border border-dark-300/50">
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
          
          {/* Wipe Schedule */}
          {wipeSchedule && (
            <div className="bg-dark-400/50 rounded-lg p-3 border border-dark-300/50 mb-6">
              <div className="flex items-center text-gray-300 mb-1">
                <FiClock className="mr-2 text-primary" />
                <span className="text-sm">Agenda de Wipe</span>
              </div>
              <p className="text-white font-medium">
                {wipeSchedule}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-dark-300 mt-auto bg-dark-400/50">
          <Link href={`/servers/${id}`} legacyBehavior>
            <a className="w-full bg-primary/90 hover:bg-primary text-white rounded-md py-2 px-4 font-medium flex items-center justify-center transition-all duration-200">
              Detalhes do Servidor
              <FiChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
          </Link>
        </div>
      </Card>
    </div>
  );
}