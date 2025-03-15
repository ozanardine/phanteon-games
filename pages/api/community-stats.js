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

    // 1. Contar jogadores registrados (usuários do sistema)
    const { count: usersCount, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;
    stats.registeredPlayers = usersCount || 0;

    // 2. Contar servidores ativos a partir da tabela server_stats
    const { data: serverStats, error: serversError } = await supabaseAdmin
      .from('server_stats')
      .select('server_id, status')
      .order('timestamp', { ascending: false });

    if (serversError) throw serversError;
    
    // Agrupar por server_id para ter apenas o registro mais recente de cada servidor
    const uniqueServers = {};
    serverStats?.forEach(stat => {
      if (!uniqueServers[stat.server_id]) {
        uniqueServers[stat.server_id] = stat;
      }
    });
    
    // Contar servidores com status 'online'
    stats.activeServers = Object.values(uniqueServers).filter(server => server.status === 'online').length || 0;

    // 3. Contar eventos realizados (eventos com status 'completed')
    const { count: eventsCount, error: eventsError } = await supabaseAdmin
      .from('server_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

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