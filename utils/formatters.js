/**
 * Utilitários para formatação de dados
 */

// Cache para imagens já verificadas
const validImageCache = typeof window !== 'undefined' ? new Map() : null;
const invalidImageCache = typeof window !== 'undefined' ? new Set() : null;

/**
 * Formata um timestamp em formato legível
 * @param {string} timestamp - Timestamp ISO
 * @returns {string} - Data formatada
 */
export const formatDate = (timestamp) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return timestamp || '';
  }
};

/**
 * Limpa o cache de imagens
 * Útil para testes e quando você quer forçar uma nova verificação
 */
export const clearImageCache = () => {
  if (validImageCache) validImageCache.clear();
  if (invalidImageCache) invalidImageCache.clear();
};