// src/pages/api/debug-env.ts (remover após resolução do problema)
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Versão segura que não expõe valores sensíveis
  const envStatus = {
    DISCORD_CLIENT_ID: !!process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: !!process.env.DISCORD_CLIENT_SECRET,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV
  };
  
  res.status(200).json({
    status: 'Variables check',
    environment: process.env.NODE_ENV,
    variables: envStatus
  });
}