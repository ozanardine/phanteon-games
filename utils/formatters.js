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
 * @returns {string} - URL completa da imagem ou SVG base64 para placeholder
 */
export const getItemImageUrl = (shortName) => {
  if (!shortName) {
    // SVG de presente (gift box) codificado em base64 como fallback
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZjNzU4MCI+PHBhdGggZD0iTTMgMi41YTIuNSAyLjUgMCAwIDEgNSAwIDIuNSAyLjUgMCAwIDEgNSAwdi4wMDZjMCAuMDcgMCAuMjctLjAzOC40OTRIMTVhMSAxIDAgMCAxIDEgMXYyYTEgMSAwIDAgMS0xIDF2Ny41YTEuNSAxLjUgMCAwIDEtMS41IDEuNWgtMTFBMS41IDEuNSAwIDAgMSAxIDE0LjVWN2ExIDEgMCAwIDEtMS0xVjRhMSAxIDAgMCAxIDEtMWgyLjAzOEEyLjk2OCAyLjk2OCAwIDAgMSAzIDIuNTA2VjIuNXptMS4wNjguNUg3di0uNWExLjUgMS41IDAgMSAwLTMgMGMwIC4wODUuMDAyLjI3NC4wNDUuNDNhLjUyMi41MjIgMCAwIDAgLjAyMy4wN3pNOSAzaDIuOTMyYS41Ni41NiAwIDAgMCAuMDIzLS4wN2MuMDQzLS4xNTYuMDQ1LS4zNDUuMDQ1LS40M2ExLjUgMS41IDAgMCAwLTMgMFYzek0xIDR2Mmg2VjRIMXptOCAwdjJoNlY0SDl6bTUgM0g5djhoNC41YS41LjUgMCAwIDAgLjUtLjVWN3ptLTcgOFY3SDJ2Ny41YS41LjUgMCAwIDAgLjUuNUg3eiI+PC9wYXRoPjwvc3ZnPg==';
  }
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