import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ServerPlugin } from '@/types/database.types';

// Endpoint para buscar plugins de um servidor específico
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Server ID is required' });
  }

  try {
    // Buscar plugins do servidor no Supabase
    const { data, error } = await supabaseAdmin
      .from('server_plugins')
      .select('*')
      .eq('server_id', id)
      .order('name');
    
    if (error) {
      throw error;
    }
    
    // Se não houver dados reais, simular alguns plugins para demonstração
    // Apenas para servidor Rust neste exemplo
    if (!data || data.length === 0) {
      // Verificar se é um servidor Rust
      const { data: serverData, error: serverError } = await supabaseAdmin
        .from('server_info')
        .select('game')
        .eq('server_id', id)
        .single();
        
      if (serverError) {
        throw serverError;
      }
      
      // Se for um servidor Rust, retornar plugins simulados
      if (serverData && serverData.game.toLowerCase() === 'rust') {
        const simulatedPlugins = getDefaultRustPlugins(id);
        return res.status(200).json(simulatedPlugins);
      }
    }
    
    return res.status(200).json(data || []);
  } catch (error: any) {
    console.error('Error fetching server plugins:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// Plugins padrão para servidores Rust
function getDefaultRustPlugins(serverId: string): ServerPlugin[] {
  return [
    {
      id: `tp_${serverId}`,
      server_id: serverId,
      name: 'Teleport',
      description: 'Sistema de teleporte que permite aos jogadores definir e teleportar para locais salvos.',
      version: '1.5.2',
      is_active: true,
    },
    {
      id: `kits_${serverId}`,
      server_id: serverId,
      name: 'Kits',
      description: 'Kits de itens que podem ser redefinidos e usados ​​pelos jogadores. Kits VIP exclusivos disponíveis.',
      version: '3.0.1',
      is_active: true,
    },
    {
      id: `econ_${serverId}`,
      server_id: serverId,
      name: 'Economics',
      description: 'Sistema de economia para o servidor com moeda virtual e lojas.',
      version: '2.1.3',
      is_active: true,
    },
    {
      id: `botspawn_${serverId}`,
      server_id: serverId,
      name: 'BotSpawn',
      description: 'Spawns NPCs em locais específicos do mapa para aumentar o PVE.',
      version: '1.2.7',
      is_active: true,
    },
    {
      id: `playerranks_${serverId}`,
      server_id: serverId,
      name: 'PlayerRanks',
      description: 'Sistema de classificação e nivelamento para jogadores baseado em estatísticas de jogo.',
      version: '2.0.5',
      is_active: true,
    },
    {
      id: `rustdonate_${serverId}`,
      server_id: serverId,
      name: 'RustDonate',
      description: 'Sistema de doação integrado com benefícios para apoiadores.',
      version: '1.3.0',
      is_active: true,
    },
    {
      id: `skinbox_${serverId}`,
      server_id: serverId,
      name: 'SkinBox',
      description: 'Permite que os jogadores alterem a skin de seus itens.',
      version: '4.0.2',
      is_active: true,
    },
    {
      id: `removertool_${serverId}`,
      server_id: serverId,
      name: 'RemoverTool',
      description: 'Permite que jogadores removam itens que colocaram incorretamente.',
      version: '1.1.9',
      is_active: true,
    },
    {
      id: `discord_${serverId}`,
      server_id: serverId,
      name: 'DiscordSync',
      description: 'Sincroniza chat e eventos entre o servidor e o Discord.',
      version: '2.3.4',
      is_active: true,
    },
    {
      id: `rustcord_${serverId}`,
      server_id: serverId,
      name: 'RustCord',
      description: 'Integração avançada com o Discord, incluindo alertas de raid e eventos.',
      version: '1.8.0',
      is_active: true,
    }
  ];
}