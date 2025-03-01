// src/hooks/useMap.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchMapBySeed, fetchMonuments, fetchBiomes, getMapImageUrl } from '../lib/api/rustMapsApi';

interface UseMapResult {
  mapImage: string | null;
  mapDetails: {
    size: string;
    seed: string;
    monuments: string[];
    biomes: {
      desert: number;
      snow: number;
      forest: number;
      plains: number;
    };
  };
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook personalizado para buscar e gerenciar dados do mapa do Rust
 * @param seed Seed do mapa a ser buscado
 * @param size Tamanho do mapa (opcional, padrão: 4500)
 */
export const useMap = (
  seed: string,
  size: string = '4500'
): UseMapResult => {
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [mapDetails, setMapDetails] = useState({
    size,
    seed,
    monuments: [] as string[],
    biomes: {
      desert: 0,
      snow: 0,
      forest: 0,
      plains: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Função para buscar dados do mapa
  const fetchMapData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Obter URL da imagem do mapa
      const imageUrl = getMapImageUrl(seed, size, 'monuments,roads,tunnels,terrain');
      setMapImage(imageUrl);
      
      // Buscar detalhes do mapa
      const mapData = await fetchMapBySeed(seed, size);
      
      // Buscar monumentos se não estiverem incluídos nos detalhes
      let monumentsList = mapData.monuments;
      if (!monumentsList || monumentsList.length === 0) {
        try {
          const monuments = await fetchMonuments(seed, size);
          monumentsList = monuments.map(m => m.name);
        } catch (monumentError) {
          console.warn('Erro ao buscar monumentos:', monumentError);
          monumentsList = [
            'Airfield',
            'Launch Site',
            'Military Tunnels',
            'Dome',
            'Lighthouse',
            'Harbor',
            'Power Plant'
          ];
        }
      }
      
      // Buscar biomas se não estiverem incluídos nos detalhes
      let biomesData = mapData.biomes;
      if (!biomesData || Object.keys(biomesData).length === 0) {
        try {
          biomesData = await fetchBiomes(seed, size);
        } catch (biomesError) {
          console.warn('Erro ao buscar biomas:', biomesError);
          biomesData = {
            desert: 25,
            snow: 20,
            forest: 40,
            plains: 15
          };
        }
      }
      
      // Atualizar estado com os dados obtidos
      setMapDetails({
        size,
        seed,
        monuments: monumentsList,
        biomes: biomesData
      });
    } catch (err) {
      console.error('Erro ao buscar dados do mapa:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao buscar mapa'));
      
      // Definir dados de fallback em caso de erro
      setMapImage('/images/rust-map-placeholder.jpg');
      setMapDetails({
        size,
        seed,
        monuments: [
          'Airfield',
          'Launch Site',
          'Military Tunnels',
          'Dome',
          'Lighthouse',
          'Harbor',
          'Power Plant'
        ],
        biomes: {
          desert: 25,
          snow: 20,
          forest: 40,
          plains: 15
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [seed, size]);

  // Efeito para buscar dados assim que o componente montar
  // ou quando o seed ou tamanho mudarem
  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  return {
    mapImage,
    mapDetails,
    isLoading,
    error,
    refresh: fetchMapData
  };
};

export default useMap;