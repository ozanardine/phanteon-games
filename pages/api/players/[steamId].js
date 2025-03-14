// pages/api/players/[steamId].js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { steamId } = req.query;
  
  if (!steamId || typeof steamId !== 'string') {
    return res.status(400).json({ error: 'SteamID is required' });
  }

  try {
    // Buscar dados do jogador
    const { data: player, error: playerError } = await supabaseAdmin
      .from('players')
      .select('*')
      .eq('steam_id', steamId)
      .single();

    if (playerError) {
      if (playerError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Player not found' });
      }
      throw playerError;
    }

    // Buscar histórico mensal
    const { data: playerHistory, error: historyError } = await supabaseAdmin
      .from('player_history')
      .select('*')
      .eq('steam_id', steamId)
      .order('month', { ascending: false });

    if (historyError) throw historyError;

    // Formatar os dados
    const formattedPlayerData = {
      steamId: player.steam_id,
      name: player.name,
      stats: {
        kills: player.kills || 0,
        deaths: player.deaths || 0,
        headshots: player.headshots || 0,
        suicides: player.suicides || 0,
        kdr: player.deaths > 0 ? (player.kills / player.deaths).toFixed(2) : player.kills.toFixed(2),
        headshotRatio: player.kills > 0 ? ((player.headshots / player.kills) * 100).toFixed(2) : 0,
        timePlayed: Math.round(player.time_played || 0),
        isConnected: player.is_connected || false,
        lastSeen: player.last_seen,
        createdAt: player.created_at,
      },
      monthlyStats: playerHistory.map(history => ({
        month: history.month,
        kills: history.kills || 0,
        deaths: history.deaths || 0,
        headshots: history.headshots || 0,
        suicides: history.suicides || 0,
        kdr: history.deaths > 0 ? (history.kills / history.deaths).toFixed(2) : history.kills.toFixed(2),
        headshotRatio: history.kills > 0 ? ((history.headshots / history.kills) * 100).toFixed(2) : 0,
        timePlayed: Math.round(history.time_played || 0),
        lastSeen: history.last_seen,
      }))
    };

    return res.status(200).json(formattedPlayerData);
  } catch (error) {
    console.error(`Error fetching player data for steamId ${steamId}:`, error);
    return res.status(500).json({ 
      error: 'Failed to fetch player data',
      details: error.message 
    });
  }
}