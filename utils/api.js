/**
 * Utilitário para chamadas à API com autenticação
 */

/**
 * Fazer uma chamada autenticada à API
 * @param {string} endpoint - Endpoint da API (sem a URL base)
 * @param {Object} options - Opções para fetch (method, body, etc)
 * @returns {Promise<Object>} - Resposta da API em JSON
 */
export async function fetchAPI(endpoint, options = {}) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
  
  // Mesclar headers padrão com os fornecidos
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.RUST_API_KEY || 'tpTM35o1Oe57ktRfbLYButef8gMEmRLwVMYTLwnNDZkGoOeLu1Y3o0K6KC0okI8F'}`,
    ...options.headers
  };
  
  // Mesclar opções padrão com as fornecidas
  const fetchOptions = {
    ...options,
    headers
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching API endpoint ${endpoint}:`, error);
    throw error;
  }
} 