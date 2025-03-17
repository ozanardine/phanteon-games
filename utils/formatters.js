/**
 * Utilitários para formatação de dados
 */

/**
 * Formata o shortName de um item para uso em URLs do CDN
 * Substitui pontos por traços para evitar problemas com URLs
 * @param {string} shortName - Nome curto do item
 * @returns {string} - Nome formatado para URL
 */
export const formatItemShortName = (shortName) => {
  if (!shortName) return '';
  return shortName.replace(/\./g, '-');
};

/**
 * Retorna a URL da imagem do item usando o CDN do Rust Help
 * @param {string} shortName - Nome curto do item
 * @returns {string} - URL completa da imagem
 */
export const getItemImageUrl = (shortName) => {
  if (!shortName) return '/images/items/placeholder.png';
  return `https://cdn.rusthelp.com/images/source/${formatItemShortName(shortName)}.png`;
};

/**
 * Retorna uma classe CSS baseada na raridade do item
 * @param {string} rarity - Raridade do item (common, uncommon, rare, epic, legendary)
 * @returns {string} - Classe CSS correspondente à raridade
 */
export const getRarityClass = (rarity) => {
  switch (rarity?.toLowerCase()) {
    case 'common':
      return 'border-gray-500/50 bg-gradient-to-b from-gray-700/30 to-gray-800/50';
    case 'uncommon':
      return 'border-green-500/50 bg-gradient-to-b from-green-700/30 to-green-800/50';
    case 'rare':
      return 'border-blue-500/50 bg-gradient-to-b from-blue-700/30 to-blue-800/50';
    case 'epic':
      return 'border-purple-500/50 bg-gradient-to-b from-purple-700/30 to-purple-800/50';
    case 'legendary':
      return 'border-yellow-500/50 bg-gradient-to-b from-yellow-600/30 to-yellow-700/50';
    default:
      return 'border-gray-500/50 bg-gradient-to-b from-gray-700/30 to-gray-800/50';
  }
}; 