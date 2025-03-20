import React, { useState, useEffect } from 'react';
import { FiMap, FiAlertCircle, FiLoader, FiExternalLink, FiZoomIn, FiSearch } from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';

// Define the fixed map URLs object with known seed-to-URL mappings
const fixedMapUrls = {
  // Format: 'seedNumber': 'URL to map image'
  '328564061': 'https://content.rustmaps.com/maps/265/f888cf9ea6454502a6816893b82dbac6/map_icons.png',
  '328564061': 'https://content.rustmaps.com/maps/265/f888cf9ea6454502a6816893b82dbac6/map_icons.png',
  '328564061': 'https://content.rustmaps.com/maps/265/f888cf9ea6454502a6816893b82dbac6/map_icons.png'
  // Add more seed mappings as needed
};

const RustMapPreview = ({ seed, worldSize }) => {
  const [mapUrl, setMapUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_RUSTMAPS_API_KEY;
  const [currentFallbackIndex, setCurrentFallbackIndex] = useState(0);

  useEffect(() => {
    // Only load if we have seed and worldSize
    if (seed && worldSize) {
      // Use fixed map URL for known seeds
      if (fixedMapUrls[seed]) {
        setMapUrl(fixedMapUrls[seed]);
        setIsLoading(false);
        return;
      }
      loadMapPreview();
    }
  }, [seed, worldSize]);

  const loadMapPreview = async () => {
    if (!seed || !worldSize) {
      setError('Seed ou tamanho do mundo não fornecidos');
      return;
    }

    setIsLoading(true);
    setError(null);
    setImageLoaded(false);
    
    try {
      // Melhoria na lógica para gerar URLs confiáveis
      let generatedMapUrl;
      
      if (apiKey) {
        // Se temos a chave da API, use a API oficial
        generatedMapUrl = `https://api.rustmaps.com/v3/maps/${worldSize}/${seed}/preview?apiKey=${apiKey}`;
        console.log('Usando API oficial RustMaps com chave');
      } else {
        // Sem chave de API, tente diferentes abordagens
        // Primeiro tente o endpoint público do content
        generatedMapUrl = `https://content.rustmaps.com/maps/${worldSize}/${seed}/map_icons.png`;
        console.log('Usando URL pública RustMaps content');
      }
      
      // Definimos nossos fallbacks em ordem de preferência
      const fallbackUrls = [
        generatedMapUrl,
        // Backup para diferentes tamanhos
        `https://content.rustmaps.com/maps/${worldSize === 3000 ? '3500' : '3000'}/${seed}/map_icons.png`,
        // Fallbacks confiáveis para diferentes tamanhos de mapa
        "https://content.rustmaps.com/maps/265/f888cf9ea6454502a6816893b82dbac6/map_icons.png",
        "https://content.rustmaps.com/maps/264/7f8b8ac9a76744faaaf5ccd88f85b25f/map_icons.png"
      ];
      
      // Começamos com a primeira opção
      setMapUrl(fallbackUrls[0]);
      setCurrentFallbackIndex(0); // Rastreie qual fallback estamos usando
      
    } catch (err) {
      console.error('Error generating map URL:', err);
      setError('Erro ao gerar URL do mapa. Tente novamente mais tarde.');
      setIsLoading(false);
    }
  };

  const handleImageError = (e) => {
    console.error('Failed to load map image, trying fallback');
    
    // Lista dos fallbacks disponíveis
    const fallbackUrls = [
      mapUrl, // A atual que falhou (para referência)
      // Backup para diferentes tamanhos
      `https://content.rustmaps.com/maps/${worldSize === 3000 ? '3500' : '3000'}/${seed}/map_icons.png`,
      // Fallbacks confiáveis
      "https://content.rustmaps.com/maps/265/f888cf9ea6454502a6816893b82dbac6/map_icons.png",
      "https://content.rustmaps.com/maps/264/7f8b8ac9a76744faaaf5ccd88f85b25f/map_icons.png"
    ];
    
    // Tente o próximo fallback se disponível
    const nextIndex = currentFallbackIndex + 1;
    if (nextIndex < fallbackUrls.length) {
      setCurrentFallbackIndex(nextIndex);
      setMapUrl(fallbackUrls[nextIndex]);
    } else {
      // Se já tentamos todos os fallbacks
      setError('Não foi possível carregar a imagem do mapa. O servidor de mapas pode estar temporariamente indisponível.');
      setIsLoading(false);
    }
  };

  const toggleZoom = () => {
    setIsZoomed(prev => !prev);
  };

  if (!seed || !worldSize) {
    return (
      <Card variant="darker" className="p-4 text-center text-gray-400">
        <FiMap className="mx-auto text-2xl mb-2" />
        <p>Informações de mapa não disponíveis</p>
      </Card>
    );
  }

  return (
    <Card variant="darker" className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-white">Pré-visualização do Mapa</h3>
        <div className="flex items-center text-sm text-gray-300">
          <span className="mr-4">
            <span className="text-gray-400 mr-1">Seed:</span> {seed}
          </span>
          <span>
            <span className="text-gray-400 mr-1">Tamanho:</span> {worldSize}
          </span>
        </div>
      </div>

      <div className="relative bg-dark-300 rounded-lg overflow-hidden border border-dark-200 group">
        {isLoading && !imageLoaded ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FiLoader className="text-primary text-3xl animate-spin mb-2" />
            <p className="text-gray-300">
              Carregando pré-visualização...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FiAlertCircle className="text-red-400 text-3xl mb-2" />
            <p className="text-gray-300 mb-3">{error}</p>
            <a 
              href={`https://rustmaps.com/map/${worldSize}/${seed}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors flex items-center"
            >
              <FiExternalLink className="mr-2" /> Ver no RustMaps.com
            </a>
          </div>
        ) : (
          <>
            {mapUrl && (
              <div className={`relative overflow-hidden ${isZoomed ? 'h-[600px]' : 'aspect-w-16 aspect-h-9'} transition-all duration-300`}>
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-300">
                    <FiLoader className="text-primary text-3xl animate-spin" />
                  </div>
                )}
                <img 
                  src={mapUrl} 
                  alt={`Mapa do servidor com seed ${seed}`}
                  className={`object-contain w-full h-full ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'} transition-all duration-300`}
                  onLoad={() => {
                    setImageLoaded(true);
                    setIsLoading(false);
                  }}
                  onError={handleImageError}
                  onClick={toggleZoom}
                  style={{ transition: 'opacity 0.3s ease' }}
                />
              </div>
            )}
            {imageLoaded && (
              <div className="absolute bottom-3 right-3 z-10">
                <a 
                  href={`https://rustmaps.com/map/${worldSize}/${seed}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-dark-300/80 hover:bg-dark-300 py-1.5 px-3 rounded text-primary hover:text-white transition-colors duration-200 backdrop-blur-sm flex items-center"
                >
                  <FiExternalLink className="mr-1.5" />
                  Ver no RustMaps.com
                </a>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="mt-2 flex justify-between items-center">
        <p className="text-xs text-gray-400">
          Pré-visualização fornecida por RustMaps.com
          {!apiKey && (
            <span className="text-amber-400 ml-2">(API Key não configurada)</span>
          )}
        </p>
        
        {imageLoaded && (
          <Button
            variant="ghost"
            size="xs"
            onClick={toggleZoom}
            className="text-gray-400 hover:text-primary"
          >
            {isZoomed ? 'Reduzir mapa' : 'Expandir mapa'}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default RustMapPreview;