/**
 * Endpoint simplificado para compatibilidade com Vercel
 * A funcionalidade real foi movida para a API principal
 */
export default async function handler(req, res) {
  // Verificar se é uma solicitação autorizada por chave de API
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const isAuthorized = apiKey === process.env.INTERNAL_API_KEY;
  
  if (!isAuthorized) {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }
  
  return res.status(200).json({
    success: true,
    message: 'Este endpoint foi transferido para a API principal. O Bot do Discord está configurado para chamar diretamente a API.'
  });
}

export const config = {
  api: {
    bodyParser: true,
  }
}; 