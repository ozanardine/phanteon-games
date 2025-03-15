// pages/api/community-stats.js
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Buscar estatísticas da comunidade
    const stats = {
      registeredPlayers: 0,
      activeServers: 0,
      completedEvents: 0,
      vipSubscriptions: 0
    };

    // 1. Contar jogadores registrados
    const { count: playersCount, error: playersError } = await supabaseAdmin
      .from('players')
      .select('*', { count: 'exact', head: true });

    if (playersError) throw playersError;
    stats.registeredPlayers = playersCount || 0;

    // 2. Contar servidores ativos
    const { data: servers, error: serversError } = await supabaseAdmin
      .from('servers')
      .select('status');

    if (serversError) throw serversError;
    stats.activeServers = servers?.filter(server => server.status === 'online').length || 0;

    // 3. Contar eventos realizados
    const { count: eventsCount, error: eventsError } = await supabaseAdmin
      .from('server_events')
      .select('*', { count: 'exact', head: true });

    if (eventsError) throw eventsError;
    stats.completedEvents = eventsCount || 0;

    // 4. Contar assinaturas VIP ativas
    const { count: subscriptionsCount, error: subscriptionsError } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (subscriptionsError) throw subscriptionsError;
    stats.vipSubscriptions = subscriptionsCount || 0;

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return res.status(500).json({ 
      error: 'Falha ao buscar estatísticas da comunidade',
      details: error.message 
    });
  }
}