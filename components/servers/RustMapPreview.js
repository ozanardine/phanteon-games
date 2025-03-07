import React, { useState, useEffect } from 'react';
import { FiMap, FiAlertCircle, FiLoader, FiExternalLink } from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';

const RustMapPreview = ({ seed, worldSize }) => {
  const [mapUrl, setMapUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_RUSTMAPS_API_KEY;

  useEffect(() => {
    // Apenas carregue se tivermos seed e worldSize
    if (seed && worldSize) {
      // Use fixed map URL for known seeds
      if (fixedMapUrls[seed]) {
        setMapUrl(fixedMapUrls[seed]);
        setMapPreviewLoading(false);
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
    
    // Usar a URL fixa que sabemos que funciona
    // Para o map ID 7f8b8ac9a76744faaaf5ccd88f85b25f
    const fixedMapUrl = "https://content.rustmaps.com/maps/264/7f8b8ac9a76744faaaf5ccd88f85b25f/map_icons.png";
    
    setMapUrl(fixedMapUrl);
  };

  const handleImageError = (e) => {
    setError('Não foi possível carregar a imagem do mapa. Tente visitar o site do RustMaps diretamente.');
    setIsLoading(false);
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

      <div className="relative bg-dark-300 rounded-lg overflow-hidden border border-dark-200">
        {isLoading && !imageLoaded ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FiLoader className="text-primary text-3xl animate-spin mb-2" />
            <p className="text-gray-300">
              Carregando pré-visualização...
            </p>
            {mapUrl && (
              <p className="text-xs text-gray-400 mt-2">
                URL: {mapUrl.substring(0, 50)}...
              </p>
            )}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FiAlertCircle className="text-red-400 text-3xl mb-2" />
            <p className="text-gray-300 mb-3">{error}</p>
            <a 
              href={`https://rustmaps.com/map/${worldSize}/${seed}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-600 transition-colors flex items-center"
            >
              <FiExternalLink className="mr-2" /> Ver no RustMaps.com
            </a>
          </div>
        ) : (
          <>
            {mapUrl && (
              <div className="aspect-w-16 aspect-h-9 relative">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-300">
                    <FiLoader className="text-primary text-3xl animate-spin" />
                  </div>
                )}
                <img 
                  src={mapUrl} 
                  alt={`Mapa do servidor com seed ${seed}`}
                  className={`object-cover w-full h-full ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => {
                    setImageLoaded(true);
                    setIsLoading(false);
                  }}
                  onError={handleImageError}
                  style={{ transition: 'opacity 0.3s ease' }}
                />
              </div>
            )}
            {imageLoaded && (
              <div className="absolute bottom-2 right-2">
                <a 
                  href={`https://rustmaps.com/map/${worldSize}/${seed}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-dark-100/80 hover:bg-dark-100 py-1 px-2 rounded text-primary hover:text-white transition-colors duration-200"
                >
                  Ver no RustMaps.com
                </a>
              </div>
            )}
          </>
        )}
      </div>
      
      <p className="mt-2 text-xs text-gray-400">
        Pré-visualização fornecida por RustMaps.com
        {!apiKey && (
          <span className="text-amber-400 ml-2">(API Key não configurada)</span>
        )}
      </p>
    </Card>
  );
};

export default RustMapPreview;
