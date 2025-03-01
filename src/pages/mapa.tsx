// src/pages/mapa.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Card from '../components/common/Card';
import { useServerStatus } from '../hooks/useServerStatus';
import { useMap } from '../hooks/useMap';
import { FaDownload, FaSearch, FaExpand, FaCompress } from 'react-icons/fa';
import { formatMapSize } from '../lib/utils/formatUtils';
import { getNextWipeDate, formatDateBR } from '../lib/utils/dateUtils';

const MapPage = () => {
  const { seed, mapSize, isOnline, lastWipe, nextWipe } = useServerStatus();
  const { mapImage, mapDetails, isLoading } = useMap(seed, mapSize);
  
  const [isZoomed, setIsZoomed] = useState(false);
  const [selectedMonument, setSelectedMonument] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar monumentos baseado na busca
  const filteredMonuments = mapDetails.monuments.filter(monument => 
    monument.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar monumentos por tipo
  const groupedMonuments = filteredMonuments.reduce((acc, monument) => {
    const type = getMonumentType(monument);
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(monument);
    return acc;
  }, {} as Record<string, string[]>);

  // Legenda para tipos de monumentos
  const monumentTypes = {
    'high-tier': 'Alto Nível',
    'medium-tier': 'Médio Nível',
    'low-tier': 'Baixo Nível',
    'military': 'Militar',
    'industrial': 'Industrial',
    'generic': 'Genérico'
  };

  return (
    <Layout 
      title="Mapa do Servidor - Phanteon Games"
      description="Veja o mapa atual do servidor Phanteon Games, com todos os monumentos e coordenadas."
    >
      <Head>
        <meta property="og:image" content={mapImage || '/images/rust-map-placeholder.jpg'} />
      </Head>

      <div className="container mx-auto px-4 py-8 mt-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Mapa do Servidor</h1>
        <p className="text-zinc-400 mb-8">
          Último Wipe: {lastWipe ? formatDateBR(lastWipe) : 'Desconhecido'} | 
          Próximo Wipe: {nextWipe ? formatDateBR(nextWipe) : formatDateBR(getNextWipeDate())}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mapa - Coluna dupla na versão desktop */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {isLoading ? (
                <div className="aspect-[4/3] w-full flex items-center justify-center">
                  <LoadingSpinner size="lg" color="amber" text="Carregando mapa..." />
                </div>
              ) : (
                <div className="relative">
                  <div 
                    className={`relative aspect-[4/3] w-full cursor-pointer transition-all duration-300 ${
                      isZoomed ? 'overflow-auto' : 'overflow-hidden'
                    }`}
                    onClick={() => !isZoomed && setIsZoomed(true)}
                  >
                    {mapImage ? (
                      <div className={`relative ${isZoomed ? 'w-[200%] h-[200%]' : 'w-full h-full'}`}>
                        <Image 
                          src={mapImage}
                          alt="Mapa do servidor Phanteon Games"
                          layout="fill"
                          objectFit="contain"
                          priority
                          className="bg-zinc-900"
                        />
                        
                        {selectedMonument && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-amber-500 rounded-full h-6 w-6 animate-ping-slow"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <p className="text-zinc-500">Mapa não disponível</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Controles do mapa */}
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button 
                      className="bg-black/70 backdrop-blur-sm p-2 rounded text-zinc-200 hover:text-white"
                      onClick={() => setIsZoomed(!isZoomed)}
                      title={isZoomed ? "Reduzir" : "Ampliar"}
                    >
                      {isZoomed ? <FaCompress /> : <FaExpand />}
                    </button>
                    
                    <a 
                      href={mapImage || '#'}
                      download={`phanteon-games-map-${seed}.jpg`}
                      className="bg-black/70 backdrop-blur-sm p-2 rounded text-zinc-200 hover:text-white"
                      title="Baixar Mapa"
                    >
                      <FaDownload />
                    </a>
                  </div>

                  {/* Status do servidor */}
                  <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-sm flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>{isOnline ? 'Servidor Online' : 'Servidor Offline'}</span>
                  </div>
                </div>
              )}
              
              {/* Informações do mapa */}
              <div className="p-4 border-t border-zinc-700 bg-zinc-800/50">
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex items-center mr-4">
                    <span className="text-zinc-400 mr-2">Seed:</span>
                    <span className="font-mono">{seed}</span>
                  </div>
                  
                  <div className="flex items-center mr-4">
                    <span className="text-zinc-400 mr-2">Tamanho:</span>
                    <span>{formatMapSize(mapSize)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-zinc-400 mr-2">Tipo:</span>
                    <span>Gerado Proceduralmente</span>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Biomas */}
            <Card className="mt-6">
              <h2 className="text-xl font-bold mb-4">Biomas</h2>
              
              <div className="space-y-4">
                {Object.entries(mapDetails.biomes).map(([biome, percentage]) => (
                  <div key={biome} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="capitalize">
                        {biome === 'desert' ? 'Deserto' : 
                         biome === 'snow' ? 'Neve' :
                         biome === 'forest' ? 'Floresta' :
                         biome === 'plains' ? 'Planícies' : biome}
                      </span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getBiomeColor(biome)}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          
          {/* Monumentos e Filtros - Coluna lateral */}
          <div>
            <Card className="sticky top-24">
              <h2 className="text-xl font-bold mb-4">Monumentos</h2>
              
              {/* Campo de busca */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Buscar monumento..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
              </div>
              
              {/* Lista de monumentos agrupados por tipo */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {filteredMonuments.length === 0 ? (
                  <p className="text-zinc-500 text-center py-4">Nenhum monumento encontrado</p>
                ) : (
                  Object.entries(groupedMonuments).map(([type, monuments]) => (
                    <div key={type} className="mb-4">
                      <h3 className="text-md font-semibold mb-2 text-zinc-300">
                        {monumentTypes[type as keyof typeof monumentTypes] || type}
                      </h3>
                      <div className="space-y-1">
                        {monuments.map((monument) => (
                          <div 
                            key={monument}
                            className={`flex items-center py-2 px-3 rounded-md cursor-pointer transition-colors ${
                              selectedMonument === monument 
                                ? 'bg-amber-500/20 border border-amber-500/50' 
                                : 'hover:bg-zinc-700'
                            }`}
                            onClick={() => setSelectedMonument(
                              selectedMonument === monument ? null : monument
                            )}
                          >
                            <div className={`w-2 h-2 rounded-full mr-2 ${getMonumentColor(monument)}`}></div>
                            <span>
                              {translateMonumentName(monument)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Legenda */}
              <div className="mt-6 pt-4 border-t border-zinc-700">
                <h3 className="text-sm font-semibold mb-2 text-zinc-400">Legenda</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm">Radiação</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm">Água</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-sm">Deserto</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Floresta</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Função auxiliar para traduzir nome de monumentos
function translateMonumentName(monument: string): string {
  const translations: Record<string, string> = {
    'Airfield': 'Campo de Aviação',
    'Launch Site': 'Plataforma de Lançamento',
    'Military Tunnels': 'Túneis Militares', 
    'Dome': 'Domo',
    'Lighthouse': 'Farol',
    'Harbor': 'Porto',
    'Power Plant': 'Usina Elétrica',
    'Water Treatment': 'Estação de Tratamento',
    'Satellite Dish': 'Antena Parabólica',
    'Junkyard': 'Ferro-velho',
    'Gas Station': 'Posto de Gasolina',
    'Supermarket': 'Supermercado',
    'Oxum\'s': 'Oxum',
    'Outpost': 'Posto Avançado',
    'Bandit Camp': 'Acampamento Bandido',
    'Train Yard': 'Estação de Trem',
    'Sewer Branch': 'Estação de Esgoto'
  };

  return translations[monument] || monument;
}

// Função auxiliar para determinar o tipo de monumento
const getMonumentType = (monument: string): string => {
  const lowerName = monument.toLowerCase();
  
  // Monumentos por tier
  if (lowerName.includes('launch') || lowerName.includes('militar') || lowerName.includes('military')) {
    return 'high-tier';
  } else if (lowerName.includes('airfield') || lowerName.includes('dome') || lowerName.includes('power')) {
    return 'medium-tier';
  } else if (lowerName.includes('gas') || lowerName.includes('harbor') || lowerName.includes('lighthouse')) {
    return 'low-tier';
  }
  
  // Monumentos por categoria
  if (lowerName.includes('militar') || lowerName.includes('military') || lowerName.includes('tunnel')) {
    return 'military';
  } else if (lowerName.includes('power') || lowerName.includes('water') || lowerName.includes('sewage')) {
    return 'industrial';
  }
  
  return 'generic';
};

// Função auxiliar para definir cores dos monumentos
const getMonumentColor = (monument: string): string => {
  const lowerName = monument.toLowerCase();
  
  if (lowerName.includes('launch') || lowerName.includes('military') || lowerName.includes('tunnels')) {
    return 'bg-red-500'; // Alta radiação
  } else if (lowerName.includes('power') || lowerName.includes('water')) {
    return 'bg-yellow-500'; // Radiação média
  } else if (lowerName.includes('harbor') || lowerName.includes('lighthouse')) {
    return 'bg-blue-500'; // Água
  } else if (lowerName.includes('gas') || lowerName.includes('supermarket')) {
    return 'bg-green-400'; // Baixo tier
  }
  
  return 'bg-zinc-400'; // Genérico
};

// Função auxiliar para definir cores dos biomas
const getBiomeColor = (biome: string): string => {
  switch (biome.toLowerCase()) {
    case 'desert':
      return 'bg-yellow-600';
    case 'snow':
      return 'bg-blue-200';
    case 'forest':
      return 'bg-green-600';
    case 'plains':
      return 'bg-green-400';
    default:
      return 'bg-gray-500';
  }
};

export default MapPage;