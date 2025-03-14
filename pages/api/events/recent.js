// pages/api/events/recent.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const serverId = req.query.serverId; // Opcional: filtrar por servidor
    const limit = parseInt(req.query.limit) || 10;
    const eventType = req.query.type; // Opcional: filtrar por tipo de evento

    // Construir a query base
    let query = supabaseAdmin
      .from('server_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    // Filtrar por servidor se fornecido
    if (serverId) {
      query = query.eq('server_id', serverId);
    }

    // Filtrar por tipo se fornecido
    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    // Executar a query
    const { data, error } = await query;

    if (error) throw error;

    // Formatar eventos para o formato esperado
    const formattedEvents = data.map(event => {
      const payload = event.payload || {};
      return {
        id: event.id,
        serverId: event.server_id,
        title: payload.title || getDefaultTitle(event.event_type),
        description: payload.description || "Sem descrição disponível",
        location: payload.location,
        image: payload.image || getDefaultImage(event.event_type),
        eventType: event.event_type,
        timestamp: event.timestamp,
        payload: payload
      };
    });

    return res.status(200).json({
      events: formattedEvents,
      count: formattedEvents.length
    });
  } catch (error) {
    console.error('Error fetching recent events:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch recent events',
      details: error.message 
    });
  }
}

// Função auxiliar para gerar título padrão com base no tipo de evento
function getDefaultTitle(eventType) {
  const eventTitles = {
    'server_wipe': 'Wipe do Servidor',
    'server_restart': 'Reinício do Servidor',
    'server_update': 'Atualização do Servidor',
    'raid': 'Raid Detectado',
    'helicopter': 'Helicóptero Derrubado',
    'bradley': 'Bradley Destruído',
    'cargo_ship': 'Navio de Carga',
    'player_ban': 'Jogador Banido',
    'player_achievement': 'Conquista Desbloqueada'
  };
  
  return eventTitles[eventType] || 'Evento do Servidor';
}

// Função auxiliar para gerar imagem padrão com base no tipo de evento
function getDefaultImage(eventType) {
  const eventImages = {
    'server_wipe': '/images/events/wipe.jpg',
    'server_restart': '/images/events/restart.jpg',
    'server_update': '/images/events/update.jpg',
    'raid': '/images/events/raid.jpg',
    'helicopter': '/images/events/helicopter.jpg',
    'bradley': '/images/events/bradley.jpg',
    'cargo_ship': '/images/events/cargo_ship.jpg',
    'player_ban': '/images/events/ban.jpg',
    'player_achievement': '/images/events/achievement.jpg'
  };
  
  return eventImages[eventType] || '/images/events/default.jpg';
}