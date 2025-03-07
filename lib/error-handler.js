/**
 * Utilitário para padronizar o tratamento de erros nas APIs
 */

/**
 * Loga um erro com um prefixo padronizado e retorna uma resposta de erro formatada
 * @param {Response} res - Objeto Response do Next.js
 * @param {string} context - Contexto da API (ex: "update-steam-id", "webhook")
 * @param {string} message - Mensagem amigável de erro para o usuário
 * @param {Error|any} error - Objeto de erro original ou mensagem
 * @param {number} status - Código HTTP de status (padrão: 500)
 * @returns {Response} Resposta formatada
 */
export function handleApiError(res, context, message, error, status = 500) {
  // Constrói a mensagem de log com prefixo consistente
  const logPrefix = `[API:${context}]`;
  
  // Loga o erro com detalhes para o console do servidor
  console.error(`${logPrefix} ${message}:`, error);
  
  // Determina se deve incluir detalhes técnicos na resposta
  // Em produção, detalhes são ocultados por segurança
  let errorDetails = null;
  if (process.env.NODE_ENV === 'development') {
    errorDetails = error instanceof Error ? error.message : String(error);
  }
  
  // Retorna resposta padronizada
  return res.status(status).json({
    success: false,
    message,
    details: errorDetails,
    code: context.toUpperCase().replace(/-/g, '_')
  });
}

/**
 * Loga uma mensagem de sucesso com um prefixo padronizado
 * @param {string} context - Contexto da API
 * @param {string} message - Mensagem de sucesso
 */
export function logApiSuccess(context, message) {
  const logPrefix = `[API:${context}]`;
  console.log(`${logPrefix} ${message}`);
}

/**
 * Retorna uma resposta de sucesso formatada
 * @param {Response} res - Objeto Response do Next.js
 * @param {string} message - Mensagem de sucesso
 * @param {Object} data - Dados adicionais para incluir na resposta
 * @param {number} status - Código HTTP de status (padrão: 200)
 * @returns {Response} Resposta formatada
 */
export function handleApiSuccess(res, message, data = {}, status = 200) {
  return res.status(status).json({
    success: true,
    message,
    ...data
  });
}