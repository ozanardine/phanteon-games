/**
 * Utilitário para requisições API que funciona em ambiente local e produção
 */

/**
 * Executa uma requisição fetch com a URL base adequada ao ambient
 * @param {string} endpoint - Endpoint da API (começando com /)
 * @param {Object} options - Opções do fetch
 * @returns {Promise<Response>} - Resposta da requisição
 */
export const fetchWithBaseUrl = async (endpoint, options = {}) => {
  // Verifica o ambiente: em produção usa a URL completa, localmente usa relativo
  const isProduction = typeof window !== 'undefined' && 
                      window.location.hostname !== 'localhost' && 
                      !window.location.hostname.includes('127.0.0.1');
                      
  const baseUrl = isProduction 
    ? (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.phanteongames.com')
    : '';
    
  const url = `${baseUrl}${endpoint}`;
  
  console.log(`[API] Fazendo requisição para: ${url}`);
  
  return fetch(url, options);
};
