import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]';
import { createClient } from '@supabase/supabase-js';

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

    // Criar cliente Supabase admin
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Buscar dados da conexão para remover o cargo do Discord se necessário
    const { data: discordConnection } = await adminClient
      .from('discord_connections')
      .select('discord_user_id')
      .eq('user_id', session.user.id)
      .single();

    // Se tiver assinatura ativa, remover o cargo do Discord
    if (discordConnection?.discord_user_id) {
      const { data: subscription } = await adminClient
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();

      if (subscription?.plan?.discord_role_id) {
        try {
          await fetch(
            `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordConnection.discord_user_id}/roles/${subscription.plan.discord_role_id}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              },
            }
          );

          // Registrar remoção de cargo
          await adminClient
            .from('discord_role_logs')
            .insert({
              user_id: session.user.id,
              discord_user_id: discordConnection.discord_user_id,
              discord_role_id: subscription.plan.discord_role_id,
              role_name: subscription.plan.name,
              action: 'removed',
              reason: 'account_unlinked'
            });
        } catch (error) {
          console.error('Error removing Discord role:', error);
        }
      }
    }

    // Remover conexão do Discord
    const { error } = await adminClient
      .from('discord_connections')
      .delete()
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Database error unlinking Discord:', error);
      return res.status(500).json({ error: 'Erro ao desvincular conta do Discord' });
    }

    // Registrar desvinculação
    await adminClient
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