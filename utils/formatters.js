/**
 * Utilitários para formatação de dados
 */

// Cache para imagens já verificadas
const validImageCache = typeof window !== 'undefined' ? new Map() : null;
const invalidImageCache = typeof window !== 'undefined' ? new Set() : null;

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
 * Verifica se uma imagem existe no CDN
 * @param {string} url - URL da imagem a verificar
 * @returns {Promise<boolean>} - Promise que resolve para true se a imagem existe
 */
export const checkImageExists = async (url) => {
  // Verificar cache primeiro
  if (validImageCache && validImageCache.has(url)) return true;
  if (invalidImageCache && invalidImageCache.has(url)) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const exists = response.ok;
    
    // Atualizar cache com o resultado
    if (exists && validImageCache) {
      validImageCache.set(url, true);
    } else if (!exists && invalidImageCache) {
      invalidImageCache.add(url);
    }
    
    return exists;
  } catch (error) {
    console.warn(`Erro ao verificar imagem ${url}:`, error);
    // Em caso de erro, presumir que a imagem não existe
    if (invalidImageCache) invalidImageCache.add(url);
    return false;
  }
};

/**
 * Retorna a URL da imagem do item usando o CDN do Rust Help
 * Inclui fallbacks e cache para melhorar performance
 * @param {string} shortName - Nome curto do item
 * @returns {string} - URL completa da imagem ou SVG base64 para placeholder
 */
export const getItemImageUrl = (shortName) => {
  if (!shortName) {
    // SVG de presente (gift box) codificado em base64 como fallback
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZjNzU4MCI+PHBhdGggZD0iTTMgMi41YTIuNSAyLjUgMCAwIDEgNSAwIDIuNSAyLjUgMCAwIDEgNSAwdi4wMDZjMCAuMDcgMCAuMjctLjAzOC40OTRIMTVhMSAxIDAgMCAxIDEgMXYyYTEgMSAwIDAgMS0xIDF2Ny41YTEuNSAxLjUgMCAwIDEtMS41IDEuNWgtMTFBMS41IDEuNSAwIDAgMSAxIDE0LjVWN2ExIDEgMCAwIDEtMS0xVjRhMSAxIDAgMCAxIDEtMWgyLjAzOEEyLjk2OCAyLjk2OCAwIDAgMSAzIDIuNTA2VjIuNXptMS4wNjguNUg3di0uNWExLjUgMS41IDAgMSAwLTMgMGMwIC4wODUuMDAyLjI3NC4wNDUuNDNhLjUyMi41MjIgMCAwIDAgLjAyMy4wN3pNOSAzaDIuOTMyYS41Ni41NiAwIDAgMCAuMDIzLS4wN2MuMDQzLS4xNTYuMDQ1LS4zNDUuMDQ1LS40M2ExLjUgMS41IDAgMCAwLTMgMFYzek0xIDR2Mmg2VjRIMXptOCAwdjJoNlY0SDl6bTUgM0g5djhoNC41YS41LjUgMCAwIDAgLjUtLjVWN3ptLTcgOFY3SDJ2Ny41YS41LjUgMCAwIDAgLjUuNUg3eiI+PC9wYXRoPjwvc3ZnPg==';
  }
  
  // Verificar se temos a URL em cache
  const formattedName = formatItemShortName(shortName);
  const url = `https://cdn.rusthelp.com/images/source/${formattedName}.png`;
  
  // Adicionar uma URL alternativa para item.shortname vs item-shortname
  // Isso ajuda com inconsistências em como os shortnames são armazenados
  const altUrl = shortName.includes('.') 
    ? `https://cdn.rusthelp.com/images/source/${shortName.replace(/\./g, '-')}.png`
    : `https://cdn.rusthelp.com/images/source/${shortName}.png`;
  
  return url;
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
      return 'border-blue-500/50 bg-gradient-to-b from-blue-700/30 to-blue-800/50';
    case 'rare':
      return 'border-teal-500/50 bg-gradient-to-b from-teal-700/30 to-teal-800/50';
    case 'epic':
      return 'border-purple-500/50 bg-gradient-to-b from-purple-700/30 to-purple-800/50';
    case 'legendary':
      return 'border-yellow-500/50 bg-gradient-to-b from-yellow-600/30 to-yellow-700/50';
    default:
      return 'border-gray-500/50 bg-gradient-to-b from-gray-700/30 to-gray-800/50';
  }
};

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