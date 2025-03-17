/**
 * Utilitário para chamadas à API com autenticação
 */

/**
 * Fazer uma chamada à API com a URL base adequada ao ambiente
 * @param {string} endpoint - Endpoint da API (com ou sem a barra inicial)
 * @param {Object} options - Opções para fetch (method, body, etc)
 * @returns {Promise<Object>} - Resposta da API em JSON
 */
export async function fetchAPI(endpoint, options = {}) {
  // Garantir que o endpoint comece com barra se não for fornecido
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Determinar URL base baseado no ambiente
  let baseUrl = '';
  
  // Em ambiente de produção ou ao executar no servidor, usar a URL completa
  if (typeof window === 'undefined' || 
      process.env.NEXT_PUBLIC_API_URL || 
      (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'))) {
    baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.phanteongames.com';
  }
  
  // Construir URL completa
  const url = `${baseUrl}${formattedEndpoint}`;
  
  // Criar cabeçalhos com padrões de segurança
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Mesclar opções, garantindo que headers sejam preservados
  const fetchOptions = {
    ...options,
    headers
  };
  
  try {
    // Log de diagnóstico (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Requisição para: ${url}`, { 
        method: fetchOptions.method || 'GET',
        headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined }
      });
    }
    
    // Executar a requisição
    const response = await fetch(url, fetchOptions);
    
    // Verificar por erros comuns
    if (!response.ok) {
      // Obter detalhes do erro se disponíveis
      let errorDetails = '';
      try {
        const errorText = await response.text();
        errorDetails = errorText.substring(0, 500); // Limitando para evitar logs muito grandes
      } catch (e) {
        errorDetails = 'Não foi possível obter detalhes do erro';
      }
      
      // Loggar erro para diagnóstico
      console.error(`[API] Falha na requisição: ${response.status} ${response.statusText} - ${url}`, 
        process.env.NODE_ENV === 'development' ? errorDetails : '');
      
      // Construir erro com informações úteis
      const error = new Error(`API request failed with status ${response.status}`);
      error.status = response.status;
      error.statusText = response.statusText;
      error.url = url;
      error.details = errorDetails;
      throw error;
    }
    
    // Verificar o tipo de conteúdo
    const contentType = response.headers.get('content-type');
    
    // Se não for JSON, retornar o texto bruto
    if (!contentType || !contentType.includes('application/json')) {
      // Em desenvolvimento, avise sobre resposta não-JSON
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[API] Resposta não-JSON recebida de ${url} - Content-Type: ${contentType}`);
        const text = await response.text();
        console.warn(`[API] Conteúdo: ${text.substring(0, 200)}...`);
      }
      
      // Tentar processar como texto
      const text = await response.text();
      try {
        // Mesmo que o Content-Type não seja JSON, tentar parsear
        return JSON.parse(text);
      } catch (e) {
        // Se não for JSON válido, retornar o texto como está
        return { success: true, message: text };
      }
    }
    
    // Processar resposta JSON normalmente
    const data = await response.json();
    return data;
  } catch (error) {
    // Log do erro para diagnóstico
    console.error(`[API] Erro ao chamar endpoint ${endpoint}:`, error);
    
    // Propagar o erro para que seja tratado pelo chamador
    throw error;
  }
}