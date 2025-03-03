import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Remover conexão do Discord
    const { error } = await supabase
      .from('discord_connections')
      .delete()
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Database error unlinking Discord:', error);
      return res.status(500).json({ error: 'Erro ao desvincular conta do Discord' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Discord unlink error:', error);
    return res.status(500).json({ error: 'Erro ao desvincular conta do Discord' });
  }
}