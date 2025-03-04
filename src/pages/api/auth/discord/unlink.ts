import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Criar cliente Supabase específico para o servidor
    const supabase = createPagesServerClient({ req, res });
    
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    console.log('Unlinking Discord for user:', session.user.id);

    // Remover conexão do Discord
    const { error } = await supabase
      .from('discord_connections')
      .delete()
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Database error unlinking Discord:', error);
      return res.status(500).json({ error: 'Erro ao desvincular conta do Discord' });
    }

    // Registrar desvinculação
    await supabase
      .from('auth_logs')
      .insert({
        user_id: session.user.id,
        action: 'discord_unlinked',
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        user_agent: req.headers['user-agent'],
        success: true
      });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Discord unlink error:', error);
    return res.status(500).json({ error: 'Erro ao desvincular conta do Discord' });
  }
}