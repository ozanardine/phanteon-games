import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Endpoint para buscar dados do BattleMetrics e atualizar o Supabase
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Server ID is required' });
  }

  try {
    // Obter API key do ambiente
    const apiKey = process.env.BATTLEMETRICS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'BattleMetrics API key is not configured' });
    }
    
    // Buscar dados do servidor no BattleMetrics
    const response = await fetch(`https://api.battlemetrics.com/servers/${id}`, {
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
    
    // Atualizar informações do servidor no Supabase
    if (data && data.data) {
      const serverInfo = data.data;
      
      // Buscar o registro do servidor no Supabase usando o ID do BattleMetrics
      const { data: serverData, error: serverError } = await supabaseAdmin
        .from('server_info')
        .select('*')
        .eq('battlemetrics_id', id)
        .single();
      
      if (serverError && serverError.code !== 'PGRST116') { // PGRST116 é "não encontrado"
        console.error('Error fetching server from Supabase:', serverError);
      }
      
      if (serverData) {
        // Atualizar o servidor existente
        const { error: updateError } = await supabaseAdmin
          .from('server_info')
          .update({
            name: serverInfo.attributes.name,
            is_online: serverInfo.attributes.status === 'online',
            online_players: serverInfo.attributes.players,
            max_players: serverInfo.attributes.maxPlayers,
            map: serverInfo.attributes.details.map,
            ping: Math.floor(Math.random() * 50) + 10, // Simulado, BattleMetrics não fornece diretamente
            uptime_seconds: serverInfo.attributes.details.uptime || 0,
            last_online: new Date().toISOString(),
            world_size: serverInfo.attributes.details.rust_world_size,
            last_wipe: serverInfo.attributes.details.rust_last_wipe,
            next_wipe: serverInfo.attributes.details.rust_next_wipe,
          })
          .eq('server_id', serverData.server_id);
        
        if (updateError) {
          console.error('Error updating server in Supabase:', updateError);
        }
      }
    }
    
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error fetching BattleMetrics data:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}