// src/lib/utils/formatUtils.ts

/**
 * Formats a monetary value to Brazilian format
 */
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Formats a number with thousands separator
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('pt-BR');
};

/**
 * Formats playtime for display
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
 * Truncates a long text and adds ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Converts map size to a readable format
 */
export const formatMapSize = (size: string | number): string => {
  const numSize = typeof size === 'string' ? parseInt(size, 10) : size;
  
  if (numSize >= 1000) {
    return `${(numSize / 1000).toFixed(1)}k`;
  }
  
  return `${numSize}`;
};

/**
 * Returns CSS class for event color based on event type
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