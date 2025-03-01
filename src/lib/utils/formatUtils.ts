// src/lib/utils/formatUtils.ts

/**
 * Formata um valor monetário para o formato brasileiro
 */
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Formata um número com separador de milhares
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('pt-BR');
};

/**
 * Formata tempo de jogo para exibição
 */
export const formatPlaytime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return `${days}d${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
};

/**
 * Trunca um texto longo e adiciona reticências
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Converte tamanho do mapa para um formato legível
 */
export const formatMapSize = (size: string | number): string => {
  const numSize = typeof size === 'string' ? parseInt(size, 10) : size;
  
  if (numSize >= 1000) {
    return `${(numSize / 1000).toFixed(1)}k`;
  }
  
  return `${numSize}`;
};

/**
 * Retorna classe CSS para cor do evento baseado no tipo
 */
export const getEventColor = (eventType: string): string => {
  switch (eventType) {
    case 'cargo':
      return 'bg-blue-600';
    case 'airdrop':
      return 'bg-amber-500';
    case 'heli':
      return 'bg-red-600';
    case 'bradley':
      return 'bg-green-600';
    default:
      return 'bg-zinc-600';
  }
};