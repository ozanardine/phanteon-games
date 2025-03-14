// pages/api/players/monthly-ranking.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = parseInt(req.query.limit) || 30;
    const orderBy = req.query.orderBy || 'kills';
    const month = req.query.month; // Formato: 'YYYY-MM'
    
    const validOrderFields = ['kills', 'deaths', 'time_played', 'headshots'];
    if (!validOrderFields.includes(orderBy)) {
      return res.status(400).json({ error: 'Invalid orderBy parameter' });
    }

    // Se não foi fornecido um mês, usar o mês atual
    const currentDate = new Date();
    const currentMonth = !month 
      ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}` 
      : month;

    // Buscar jogadores do Supabase
    const { data: players, error } = await supabaseAdmin
      .from('player_history')
      .select('*')
      .eq('month', currentMonth)
      .order(orderBy, { ascending: orderBy === 'deaths' ? true : false }) // Para deaths, menor é melhor
      .limit(limit);

    if (error) {
      throw error;
    }

    // Formatar os dados
    const formattedPlayers = players.map((player, index) => ({
      rank: index + 1,
      playerId: player.steam_id,
      playerName: player.name,
      kills: player.kills || 0,
      deaths: player.deaths || 0,
      headshots: player.headshots || 0,
      kd: player.deaths > 0 ? (player.kills / player.deaths).toFixed(2) : player.kills.toFixed(2),
      playtime: Math.round(player.time_played || 0),
      isConnected: player.is_connected || false,
      lastSeen: player.last_seen,
      month: player.month
    }));

    return res.status(200).json({
      players: formattedPlayers,
      total: formattedPlayers.length,
      month: currentMonth,
      orderBy
    });
  } catch (error) {
    console.error('Error fetching monthly player ranking:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch monthly player ranking',
      details: error.message 
    });
  }
}