// pages/api/events/upcoming.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const serverId = req.query.serverId; // Opcional: filtrar por servidor
    const limit = parseInt(req.query.limit) || 10;
    const now = new Date().toISOString();

    // Construir a query base
    let query = supabaseAdmin
      .from('server_events')
      .select('*')
      .gt('payload->scheduled_at', now) // Eventos futuros (assumindo que temos uma campo scheduled_at no payload)
      .order('payload->scheduled_at', { ascending: true })
      .limit(limit);

    // Filtrar por servidor se fornecido
    if (serverId) {
      query = query.eq('server_id', serverId);
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
        title: payload.title || "Evento Agendado",
        description: payload.description || "Detalhes indisponíveis",
        scheduledAt: payload.scheduled_at,
        endAt: payload.end_at,
        location: payload.location || "Servidor completo",
        image: payload.image || "/images/events/default.jpg",
        eventType: event.event_type,
        createdAt: event.timestamp
      };
    });

    return res.status(200).json({
      events: formattedEvents,
      count: formattedEvents.length
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch upcoming events',
      details: error.message 
    });
  }
}