// Endpoint para verificação segura das variáveis de ambiente
// IMPORTANTE: Esta rota só deve ser acessível para administradores!

import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  // Verificar autenticação do usuário
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Não autorizado'
    });
  }

  // Verificar se o usuário é administrador
  const userRole = session.user?.role;
  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito a administradores'
    });
  }

  // Lista das variáveis de ambiente a verificar
  const envVars = [
    'MERCADOPAGO_ACCESS_TOKEN',
    'MERCADOPAGO_PUBLIC_KEY',
    'MERCADOPAGO_WEBHOOK_SECRET',
    'NEXT_PUBLIC_BASE_URL',
    'NODE_ENV'
  ];

  // Coleta informações sobre as variáveis (sem expor valores completos)
  const envInfo = {};
  
  for (const varName of envVars) {
    const value = process.env[varName];
    
    if (!value) {
      envInfo[varName] = 'não definido';
    } else if (varName.includes('TOKEN') || varName.includes('SECRET') || varName.includes('KEY')) {
      // Oculta valores sensíveis, mostrando apenas os primeiros caracteres
      envInfo[varName] = `${value.substring(0, 5)}...${value.substring(value.length - 3)} (${value.length} caracteres)`;
    } else {
      envInfo[varName] = value;
    }
  }

  // Verifica especificamente o token do Mercado Pago
  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  let mpTokenCheck = 'Não definido';
  
  if (mpToken) {
    if (mpToken.startsWith('TEST-')) {
      mpTokenCheck = 'Formato válido (TEST) - Ambiente de Sandbox';
    } else if (mpToken.startsWith('APP_USR-')) {
      mpTokenCheck = 'Formato válido (APP_USR) - Ambiente de Produção';
    } else {
      mpTokenCheck = 'Formato desconhecido - Potencialmente inválido';
    }
  }

  // Verifica a versão do Mercado Pago SDK
  let mpSdkVersion;
  try {
    const pkg = require('mercadopago/package.json');
    mpSdkVersion = pkg.version;
  } catch (error) {
    mpSdkVersion = 'Não encontrado: ' + error.message;
  }

  return res.status(200).json({
    success: true,
    environment: process.env.NODE_ENV,
    variáveis: envInfo,
    mercadopago: {
      token_check: mpTokenCheck,
      sdk_version: mpSdkVersion
    },
    vercel_info: {
      region: process.env.VERCEL_REGION || 'Não disponível',
      env: process.env.VERCEL_ENV || 'Não disponível'
    }
  });
} 