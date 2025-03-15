/**
 * Utilitários para formatação de dados
 */

/**
 * Formata o shortName de um item para uso em URLs
 * Substitui pontos por traços para evitar problemas com URLs
 */
export const formatItemShortName = (shortName) => {
  if (!shortName) return '';
  return shortName.replace(/\./g, '-');
};