/**
 * Utilitário para chamadas à API com autenticação
 */

/**
 * Fazer uma chamada à API externa com a chave de autenticação correta
 * @param {string} endpoint - Endpoint da API (com ou sem a barra inicial)
 * @param {Object} options - Opções para fetch (method, body, etc)
 * @returns {Promise<Object>} - Resposta da API em JSON
 */
export async function fetchAPI(endpoint, options = {}) {
  // Garantir que o endpoint comece com barra se não for fornecido
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Determinar se é um URL completo ou relativo
  const isAbsoluteUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://');
  
  // Base URL para APIs internas
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.phanteongames.com';
  
  // Construir URL final
  const url = isAbsoluteUrl ? endpoint : `${baseUrl}${normalizedEndpoint}`;
  
  // Extrair parâmetros específicos da nossa implementação
  const { 
    token,
    contentType = 'application/json',
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    ...fetchOptions 
  } = options;
  
  // Construir headers
  const headers = {
    'Content-Type': contentType,
    ...fetchOptions.headers
  };
  
  // Adicionar token de autenticação se fornecido
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Configuração final para o fetch
  const finalOptions = {
    ...fetchOptions,
    headers
  };
  
  let attempt = 0;
  let lastError = null;
  
  while (attempt <= retries) {
    try {
      // Criar controller para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Log de diagnóstico (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] Requisição para: ${url}`, { 
          method: finalOptions.method || 'GET',
          headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined }
        });
      }
      
      // Executar a requisição
      const response = await fetch(url, {
        ...finalOptions,
        signal: controller.signal
      });
      
      // Limpar timeout
      clearTimeout(timeoutId);
      
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
        console.error(`[API] Falha na requisição (tentativa ${attempt+1}/${retries+1}): ${response.status} ${response.statusText} - ${url}`, 
          process.env.NODE_ENV === 'development' ? errorDetails : '');
        
        // Construir erro com informações úteis
        const error = new Error(`API request failed with status ${response.status}`);
        error.status = response.status;
        error.statusText = response.statusText;
        error.url = url;
        error.details = errorDetails;
        error.isRetryable = response.status >= 500 || response.status === 429;
        
        // Se for um erro server-side (5xx) ou rate-limit (429), tentamos novamente
        if (error.isRetryable && attempt < retries) {
          lastError = error;
          attempt++;
          
          // Aguardar antes de tentar novamente (com backoff exponencial)
          const delay = retryDelay * Math.pow(2, attempt - 1);
          console.log(`[API] Aguardando ${delay}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
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
      // Caso especial para timeout
      if (error.name === 'AbortError') {
        console.error(`[API] Timeout ao chamar endpoint ${endpoint} (tentativa ${attempt+1}/${retries+1})`);
        
        if (attempt < retries) {
          lastError = error;
          attempt++;
          
          // Aguardar antes de tentar novamente (com backoff exponencial)
          const delay = retryDelay * Math.pow(2, attempt - 1);
          console.log(`[API] Aguardando ${delay}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Se chegou aqui, já tentamos o número máximo de vezes
        const timeoutError = new Error(`API request timed out after ${timeout}ms`);
        timeoutError.isTimeout = true;
        timeoutError.url = url;
        throw timeoutError;
      }
      
      // Para outros erros, verificar se ainda pode tentar novamente
      if (attempt < retries) {
        lastError = error;
        attempt++;
        
        // Aguardar antes de tentar novamente (com backoff exponencial)
        const delay = retryDelay * Math.pow(2, attempt - 1);
        console.log(`[API] Aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Log do erro para diagnóstico
      console.error(`[API] Erro ao chamar endpoint ${endpoint} (tentativa ${attempt+1}/${retries+1}):`, error);
      
      // Propagar o erro para que seja tratado pelo chamador
      throw error;
    }
  }
  
  // Se chegamos aqui, todas as tentativas falharam
  throw lastError || new Error(`Falha ao chamar API após ${retries+1} tentativas`);
}