import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Endpoint para sincronizar manualmente um servidor com o BattleMetrics
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { battlemetricsId } = req.body;
  
  // Validação melhorada do ID
  if (!id || typeof id !== 'string' || id === 'undefined' || id === 'null') {
    return res.status(400).json({ 
      error: 'Invalid Server ID', 
      message: 'O ID do servidor é inválido ou não foi fornecido' 
    });
  }
  
  if (!battlemetricsId || battlemetricsId === 'undefined' || battlemetricsId === 'null') {
    return res.status(400).json({ 
      error: 'Invalid BattleMetrics ID', 
      message: 'O ID do BattleMetrics é inválido ou não foi fornecido' 
    });
  }

  try {
    // Obter API key do ambiente
    const apiKey = process.env.BATTLEMETRICS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'BattleMetrics API key is not configured' });
    }
    
    // Buscar dados do servidor no BattleMetrics
    const response = await fetch(`https://api.battlemetrics.com/servers/${battlemetricsId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`BattleMetrics API error: ${response.status} ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.data) {
      return res.status(404).json({ error: 'Server not found on BattleMetrics' });
    }
    
    const serverInfo = data.data;
    const gameType = serverInfo.relationships.game.data.id.toLowerCase();
    
    // Atualizar o servidor no Supabase
    const { error: updateError } = await supabaseAdmin
      .from('server_info')
      .update({
        name: serverInfo.attributes.name,
        game: gameType === 'rust' ? 'Rust' : 
              gameType === 'minecraft' ? 'Minecraft' : 
              gameType === 'csgo' ? 'CS:GO' : gameType,
        is_online: serverInfo.attributes.status === 'online',
        status: serverInfo.attributes.status === 'online' ? 'online' : 'offline',
        online_players: serverInfo.attributes.players,
        players_current: serverInfo.attributes.players,
        players_max: serverInfo.attributes.maxPlayers,
        max_players: serverInfo.attributes.maxPlayers,
        map: serverInfo.attributes.details.map,
        ping: Math.floor(Math.random() * 50) + 10, // Simulado, BattleMetrics não fornece diretamente
        uptime_seconds: serverInfo.attributes.details.uptime || 0,
        last_online: new Date().toISOString(),
        world_size: serverInfo.attributes.details.rust_world_size,
        last_wipe: serverInfo.attributes.details.rust_last_wipe,
        next_wipe: serverInfo.attributes.details.rust_next_wipe,
        battlemetrics_id: battlemetricsId,
      })
      .eq('server_id', id);
    
    if (updateError) {
      console.error('Error updating server in Supabase:', updateError);
      return res.status(500).json({ error: 'Error updating server information' });
    }
    
    // Atualizar o registro de performance para estatísticas
    const { error: statsError } = await supabaseAdmin
      .from('performance_stats')
      .upsert({
        server_id: id,
        fps: serverInfo.attributes.details.fps || null,
        uptime_seconds: serverInfo.attributes.details.uptime || 0,
        players: serverInfo.attributes.players,
        entities: Math.floor(Math.random() * 10000) + 5000, // Simulado para exemplo
        memory_mb: Math.floor(Math.random() * 8000) + 4000, // Simulado para exemplo
        sleepers: Math.floor(Math.random() * 100), // Simulado para exemplo
        updated_at: new Date().toISOString(),
      });
    
    if (statsError) {
      console.error('Error updating performance stats:', statsError);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Server synced successfully', 
      data: {
        server_id: id,
        battlemetrics_id: battlemetricsId,
        name: serverInfo.attributes.name,
        status: serverInfo.attributes.status,
        players: serverInfo.attributes.players,
        maxPlayers: serverInfo.attributes.maxPlayers,
      }
    });
  } catch (error: any) {
    console.error('Error syncing server with BattleMetrics:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}