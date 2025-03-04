import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Obter sessão do NextAuth
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    // Fazer login no Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email: session.user.email || '',
      password: req.body.password || '',
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(200).json({ message: 'Sessão sincronizada com sucesso' });
  } catch (error) {
    console.error('Error syncing session:', error);
    return res.status(500).json({ error: 'Erro interno ao sincronizar sessão' });
  }
}