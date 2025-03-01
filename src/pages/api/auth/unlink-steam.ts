// src/pages/api/auth/unlink-steam.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    // Criar um cliente do Supabase para o servidor com contexto da requisição
    const supabase = createServerSupabaseClient({ req, res });
    
    // Verificar token de autenticação atual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || session.user.id !== userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Atualizar o registro do usuário
    const { error } = await supabaseAdmin
      .from('users')
      .update({ steam_id: null })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error unlinking Steam:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}