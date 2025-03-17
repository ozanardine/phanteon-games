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
  // Garantir que o endpoint comece com barra se não for fornecido
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${process.env.NEXT_PUBLIC_API_URL}${formattedEndpoint}`;
  
  // Obter o token de API
  const apiKey = process.env.RUST_API_KEY || 'tpTM35o1Oe57ktRfbLYButef8gMEmRLwVMYTLwnNDZkGoOeLu1Y3o0K6KC0okI8F';
  
  // Mesclar headers padrão com os fornecidos
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    ...options.headers
  };
  
  // Mesclar opções padrão com as fornecidas
  const fetchOptions = {
    ...options,
    headers
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    // Verificar o status da resposta
    if (!response.ok) {
      // Tentar obter mais detalhes do erro
      let errorDetails = '';
      try {
        const errorText = await response.text();
        errorDetails = errorText.substring(0, 200); // Limitando para não logar demais
        console.error(`API error details: ${errorDetails}`);
      } catch (err) {
        // Silenciar erro secundário
      }
      
      console.error(`API request failed with status ${response.status} for endpoint ${endpoint}`);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Verificar o tipo de conteúdo
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`API returned non-JSON response: ${contentType} for endpoint ${endpoint}`);
      
      // Tentar ler a resposta para depuração
      const responseText = await response.text();
      console.error(`Non-JSON response received: ${responseText.substring(0, 200)}...`);
      
      throw new Error(`API returned non-JSON response: ${contentType}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching API endpoint ${endpoint}:`, error);
    throw error;
  }
} 