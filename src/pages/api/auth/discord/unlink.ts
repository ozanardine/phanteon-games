import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar se o usuário está autenticado
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    console.log('Unlinking Discord for user:', session.user.id);

    // Buscar dados da conexão para remover o cargo do Discord se necessário
    const { data: discordConnection } = await supabase
      .from('discord_connections')
      .select('discord_user_id')
      .eq('user_id', session.user.id)
      .single();

    // Se tiver assinatura ativa, remover o cargo do Discord
    if (discordConnection?.discord_user_id) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();

      if (subscription?.plan?.discord_role_id) {
        try {
          // Aqui você pode adicionar a lógica para remover o cargo do Discord
          console.log('Would remove Discord role:', {
            userId: session.user.id,
            discordId: discordConnection.discord_user_id,
            roleId: subscription.plan.discord_role_id
          });
        } catch (error) {
          console.error('Error removing Discord role:', error);
        }
      }
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