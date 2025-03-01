import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    // Verificar token de autenticação atual
    const { data: sessionData } = await supabaseAdmin.auth.getSession({
      req: { headers: req.headers as HeadersInit },
    });
    
    if (!sessionData.session || sessionData.session.user.id !== userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Atualizar o registro do usuário
    const { error } = await supabaseAdmin
      .from('users')
      .update({ discord_id: null })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error unlinking Discord:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}