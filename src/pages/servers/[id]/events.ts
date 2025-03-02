import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Endpoint para buscar eventos de um servidor específico
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Server ID is required' });
  }

  try {
    // Buscar eventos do servidor no Supabase
    const { data, error } = await supabaseAdmin
      .from('server_events')
      .select('*')
      .eq('server_id', id)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    // Se não houver dados reais, simular alguns eventos para demonstração
    if (!data || data.length === 0) {
      // Simulação de dados para demonstração
      // Em um ambiente real, isso não seria necessário
      const simulatedEvents = generateSimulatedEvents(id, limit);
      return res.status(200).json(simulatedEvents);
    }
    
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error fetching server events:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// Função para gerar eventos simulados (apenas para demonstração)
function generateSimulatedEvents(serverId: string, limit: number) {
  const events = [];
  const worldSize = 4500;
  
  const eventTypes = [
    { type: 'cargo_ship', name: 'Navio de Carga' },
    { type: 'patrol_helicopter', name: 'Helicóptero de Patrulha' },
    { type: 'bradley_apc', name: 'Bradley APC' },
    { type: 'airdrop', name: 'Airdrop' },
    { type: 'chinook', name: 'Chinook' },
    { type: 'player_raid', name: 'Raid de Jogador' },
    { type: 'player_online', name: 'Jogador Online' },
    { type: 'player_kill', name: 'Jogador Morto' },
    { type: 'monument', name: 'Monumento' },
    { type: 'community_event', name: 'Evento da Comunidade' }
  ];
  
  const pastHours = Array.from({ length: 24 }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - i);
    return date.toISOString();
  });
  
  for (let i = 0; i < limit; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const isActive = Math.random() < 0.3; // 30% de chance de ainda estar ativo
    const hasPosition = Math.random() < 0.8; // 80% de chance de ter posição
    
    // Gerar posição aleatória no mapa
    const posX = hasPosition ? (Math.random() * worldSize) - (worldSize / 2) : null;
    const posY = hasPosition ? (Math.random() * 100) + 50 : null; // Altura
    const posZ = hasPosition ? (Math.random() * worldSize) - (worldSize / 2) : null;
    
    let extraData = {};
    
    // Dados extras baseados no tipo de evento
    if (eventType.type === 'player_kill') {
      extraData = {
        killer: getRandomName(),
        victim: getRandomName(),
        weapon: getRandomWeapon(),
        distance: Math.floor(Math.random() * 300) + 1,
        headshot: Math.random() < 0.3
      };
    } else if (eventType.type === 'player_raid') {
      extraData = {
        raiders: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => getRandomName()),
        raiders_count: Math.floor(Math.random() * 4) + 1,
        explosives_used: Math.floor(Math.random() * 10) + 1,
        base_owner: getRandomName()
      };
    } else if (eventType.type === 'community_event') {
      extraData = {
        name: ['Torneio PVP', 'Caça ao Tesouro', 'Arena de Combate', 'Concurso de Construção'][Math.floor(Math.random() * 4)],
        organizer: 'Admin',
        rewards: 'Itens exclusivos e VIP',
        description: 'Evento da comunidade com prêmios especiais para os vencedores.'
      };
    }
    
    events.push({
      event_id: `event_${i}_${Date.now()}`,
      server_id: serverId,
      type: eventType.name,
      event_type_rust: eventType.type,
      position_x: posX,
      position_y: posY,
      position_z: posZ,
      is_active: isActive,
      extra_data: extraData,
      updated_at: pastHours[Math.floor(Math.random() * pastHours.length)]
    });
  }
  
  // Ordenar eventos pelo timestamp, mais recentes primeiro
  return events.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

// Nomes aleatórios para os eventos simulados
function getRandomName() {
  const names = [
    'RustPlayer123', 'IronWarrior', 'SaltyRaider', 'MetalHead', 
    'BaseBuilder', 'RaidMaster', 'LootLord', 'RadiationKing',
    'BoltAction', 'HeadShotter', 'RockThrower', 'BluePrints',
    'RustDevil', 'MetalFarmer', 'SulfurMiner', 'NightWolf',
    'BowMaster', 'ShotgunSally', 'PumpkinPete', 'WoodChopper'
  ];
  return names[Math.floor(Math.random() * names.length)];
}

// Armas aleatórias para os eventos simulados
function getRandomWeapon() {
  const weapons = [
    'AK-47', 'Bolt Action Rifle', 'Custom SMG', 'Thompson', 
    'MP5A4', 'LR-300', 'M249', 'L96 Rifle', 'Semi-Automatic Rifle', 
    'Python Revolver', 'Revolver', 'Eoka Pistol', 'Crossbow', 
    'Compound Bow', 'Double Barrel Shotgun', 'Pump Shotgun', 'M39 Rifle'
  ];
  return weapons[Math.floor(Math.random() * weapons.length)];
}