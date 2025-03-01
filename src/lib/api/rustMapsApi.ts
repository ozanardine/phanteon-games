// src/lib/api/rustMapsApi.ts

/**
 * Funções para interagir com a API do RustMaps.com
 * A API oficial permite buscar informações e imagens de mapas do Rust por seed
 * Requer uma chave API obtida em https://rustmaps.com/api
 */

// Importar tipos do módulo server.ts
import { Monument } from '../../types/server';

// Interface para detalhes do mapa
export interface MapDetails {
  id: string;
  seed: string;
  size: string;
  salt: number;
  monuments: string[];
  url: string;
  imageUrl: string;
  biomes: {
    desert: number;
    snow: number;
    forest: number;
    plains: number;
  };
  createdAt: string;
  updatedAt?: string;
}

// URL base da API RustMaps
const RUSTMAPS_API_URL = 'https://rustmaps.com/api/v2';
const RUSTMAPS_IMG_URL = 'https://rustmaps.com/api/v2/maps';

/**
 * Busca detalhes de um mapa pelo seed usando a API do RustMaps
 * @param seed O seed do mapa
 * @param size O tamanho do mapa (opcional, padrão: 4500)
 * @param apiKey Chave da API RustMaps
 */
export const fetchMapBySeed = async (
  seed: string,
  size: string = '4500',
  apiKey: string = process.env.NEXT_PUBLIC_RUSTMAPS_API_KEY || ''
): Promise<MapDetails> => {
  try {
    if (!apiKey) {
      console.warn('RustMaps API Key não fornecida, usando dados simulados');
      return getFallbackMapDetails(seed, size);
    }

    // URL para buscar detalhes do mapa pelo seed
    const url = `${RUSTMAPS_API_URL}/maps/seed/${seed}?size=${size}&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Falha na chamada à API RustMaps: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Se a API não retornar dados válidos
    if (!data || !data.seed) {
      throw new Error('Dados inválidos recebidos da API RustMaps');
    }
    
    // Formatar resposta da API para nosso formato de dados
    return {
      id: data.id || `map-${seed}`,
      seed: data.seed,
      size: data.size || size,
      salt: data.salt || 0,
      monuments: data.monuments?.map((m: any) => m.name) || [],
      url: `https://rustmaps.com/map/${seed}`,
      imageUrl: `${RUSTMAPS_IMG_URL}/${data.id || seed}/image?key=${apiKey}`,
      biomes: {
        desert: data.biomes?.desert || 25,
        snow: data.biomes?.snow || 20,
        forest: data.biomes?.forest || 40,
        plains: data.biomes?.plains || 15
      },
      createdAt: data.createdAt || new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao buscar mapa da API RustMaps:', error);
    
    // Em caso de erro, retornar dados simulados
    return getFallbackMapDetails(seed, size);
  }
};

/**
 * Constrói a URL para imagem do mapa na API RustMaps
 * @param seed O seed do mapa
 * @param size O tamanho do mapa
 * @param layers Camadas a incluir na imagem (monuments, roads, etc)
 * @param apiKey Chave da API RustMaps
 */
export const getMapImageUrl = (
  seed: string,
  size: string = '4500',
  layers: string = 'monuments,roads,tunnels',
  apiKey: string = process.env.NEXT_PUBLIC_RUSTMAPS_API_KEY || ''
): string => {
  if (!apiKey) {
    // Retornar URL de placeholder se não tiver API key
    return '/images/rust-map-placeholder.jpg';
  }
  
  // Construir URL para a imagem do mapa
  return `${RUSTMAPS_IMG_URL}/seed/${seed}/image?size=${size}&layers=${layers}&key=${apiKey}`;
};

/**
 * Busca monumentos existentes em um mapa específico
 * @param seed O seed do mapa
 * @param size O tamanho do mapa
 * @param apiKey Chave da API RustMaps
 */
export const fetchMonuments = async (
  seed: string,
  size: string = '4500',
  apiKey: string = process.env.NEXT_PUBLIC_RUSTMAPS_API_KEY || ''
): Promise<Monument[]> => {
  try {
    if (!apiKey) {
      console.warn('RustMaps API Key não fornecida, usando dados simulados');
      return getFallbackMonuments();
    }

    // URL para buscar monumentos do mapa
    const url = `${RUSTMAPS_API_URL}/maps/seed/${seed}/monuments?size=${size}&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Falha ao buscar monumentos: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Formato de dados de monumentos inválido');
    }
    
    // Mapear resposta da API para nosso formato
    return data.map((monument: any) => ({
      name: monument.name,
      coords: {  // Alterado de position para coords
        x: monument.position?.x || 0,
        y: monument.position?.y || 0
      },
      type: getMonumentType(monument.name),
      tier: getMonumentTier(monument.name),
    }));
  } catch (error) {
    console.error('Erro ao buscar monumentos:', error);
    
    // Retornar dados simulados em caso de erro
    return getFallbackMonuments();
  }
};

/**
 * Busca biomas de um mapa específico
 * @param seed O seed do mapa
 * @param size O tamanho do mapa
 * @param apiKey Chave da API RustMaps
 */
export const fetchBiomes = async (
  seed: string,
  size: string = '4500',
  apiKey: string = process.env.NEXT_PUBLIC_RUSTMAPS_API_KEY || ''
): Promise<{ desert: number; snow: number; forest: number; plains: number }> => {
  try {
    if (!apiKey) {
      return { desert: 25, snow: 20, forest: 40, plains: 15 };
    }

    // Na implementação real, você buscaria os biomas da API
    // Alguns endpoints da API RustMaps podem incluir essa informação na resposta do mapa
    
    const mapDetails = await fetchMapBySeed(seed, size, apiKey);
    return mapDetails.biomes;
  } catch (error) {
    console.error('Erro ao buscar biomas:', error);
    return { desert: 25, snow: 20, forest: 40, plains: 15 };
  }
};

/**
 * Identifica o tipo de monumento com base no nome
 */
function getMonumentType(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('launch') || lowerName.includes('military') || lowerName.includes('junkyard')) {
    return 'military';
  } else if (lowerName.includes('lighthouse') || lowerName.includes('harbor') || lowerName.includes('fishing')) {
    return 'naval';
  } else if (lowerName.includes('power') || lowerName.includes('water') || lowerName.includes('sewer')) {
    return 'industrial';
  } else if (lowerName.includes('satellite') || lowerName.includes('dome')) {
    return 'scientific';
  } else if (lowerName.includes('gas') || lowerName.includes('supermarket') || lowerName.includes('mining')) {
    return 'civilian';
  }
  
  return 'generic';
}

/**
 * Determina o tier de um monumento com base no nome
 */
function getMonumentTier(name: string): 'low' | 'medium' | 'high' {
  const lowerName = name.toLowerCase();
  
  // Monumentos Tier 3 (alto nível)
  if (lowerName.includes('launch') || 
      lowerName.includes('military') || 
      lowerName.includes('oil rig') ||
      lowerName.includes('cargo')) {
    return 'high';
  } 
  
  // Monumentos Tier 2 (médio nível)
  else if (lowerName.includes('power') || 
           lowerName.includes('airfield') || 
           lowerName.includes('water') || 
           lowerName.includes('train') ||
           lowerName.includes('dome')) {
    return 'medium';
  }
  
  // Monumentos Tier 1 (baixo nível)
  return 'low';
}

/**
 * Fornece detalhes simulados do mapa quando a API não está disponível
 */
function getFallbackMapDetails(seed: string, size: string): MapDetails {
  return {
    id: `map-${seed}`,
    seed,
    size,
    salt: parseInt(seed) || 1234567890,
    monuments: [
      'Airfield',
      'Launch Site',
      'Military Tunnels',
      'Dome',
      'Lighthouse',
      'Harbor',
      'Power Plant',
      'Water Treatment',
      'Satellite Dish',
      'Junkyard',
      'Gas Station',
      'Supermarket'
    ],
    url: `https://rustmaps.com/map/${seed}`,
    imageUrl: '/images/rust-map-placeholder.jpg',
    biomes: {
      desert: 25,
      snow: 20,
      forest: 40,
      plains: 15
    },
    createdAt: new Date().toISOString()
  };
}

/**
 * Fornece monumentos simulados quando a API não está disponível
 */
function getFallbackMonuments(): Monument[] {
  return [
    {
      name: 'Launch Site',
      coords: { x: 1250, y: 1500 },  // Alterado de position para coords
      type: 'military',
      tier: 'high'
    },
    {
      name: 'Airfield',
      coords: { x: 2300, y: 1800 },  // Alterado de position para coords
      type: 'military',
      tier: 'medium'
    },
    {
      name: 'Military Tunnels',
      coords: { x: 2800, y: 2200 },  // Alterado de position para coords
      type: 'military',
      tier: 'high'
    },
    {
      name: 'Power Plant',
      coords: { x: 1800, y: 2600 },  // Alterado de position para coords
      type: 'industrial',
      tier: 'medium'
    },
    {
      name: 'Water Treatment',
      coords: { x: 900, y: 2100 },  // Alterado de position para coords
      type: 'industrial',
      tier: 'medium'
    },
    {
      name: 'Dome',
      coords: { x: 3200, y: 1200 },  // Alterado de position para coords
      type: 'scientific',
      tier: 'medium'
    },
    {
      name: 'Harbor',
      coords: { x: 500, y: 3000 },  // Alterado de position para coords
      type: 'naval',
      tier: 'low'
    },
    {
      name: 'Lighthouse',
      coords: { x: 350, y: 350 },  // Alterado de position para coords
      type: 'naval',
      tier: 'low'
    },
    {
      name: 'Gas Station',
      coords: { x: 2100, y: 1000 },  // Alterado de position para coords
      type: 'civilian',
      tier: 'low'
    },
    {
      name: 'Supermarket',
      coords: { x: 1500, y: 3200 },  // Alterado de position para coords
      type: 'civilian',
      tier: 'low'
    },
    {
      name: 'Satellite Dish',
      coords: { x: 2800, y: 900 },  // Alterado de position para coords
      type: 'scientific',
      tier: 'low'
    },
    {
      name: 'Junkyard',
      coords: { x: 1100, y: 2800 },  // Alterado de position para coords
      type: 'civilian',
      tier: 'low'
    }
  ];
}