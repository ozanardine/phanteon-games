// src/components/server/ServerEventsSection.tsx
import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { supabase } from '../../lib/supabase/client';
import { formatTimeRemaining } from '../../lib/utils/dateUtils';
import { FaShip, FaHelicopter, FaPlane, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { TbTank } from "react-icons/tb";

interface ServerEvent {
  event_id: string;
  type: string;
  position_x: number | null;
  position_y: number | null;
  position_z: number | null;
  is_active: boolean;
  extra_data: any;
  updated_at: string;
}

interface ServerEventsSectionProps {
  serverId?: string;
  showTimers?: boolean;
  showLocation?: boolean;
  limit?: number;
}

const ServerEventsSection: React.FC<ServerEventsSectionProps> = ({
  serverId = 'game.phanteongames.com:28015',
  showTimers = true,
  showLocation = true,
  limit = 5
}) => {
  const [events, setEvents] = useState<ServerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Fetch server events
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('server_events')
          .select('*')
          .eq('server_id', serverId)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(limit);
        
        if (error) throw error;
        
        setEvents(data || []);
      } catch (err) {
        console.error('Erro ao buscar eventos do servidor:', err);
        setError('Não foi possível carregar eventos do servidor');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
    
    // Setup periodic refresh (every 30 seconds)
    const interval = setInterval(fetchEvents, 30000);
    
    return () => clearInterval(interval);
  }, [serverId, limit]);

  // Update current time every second (for timers)
  useEffect(() => {
    if (!showTimers) return;
    
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [showTimers]);

  // Calculate the estimated time remaining for an event
  const getTimeRemaining = (event: ServerEvent): string => {
    const eventType = event.type;
    const updatedAt = new Date(event.updated_at);
    
    // Estimated durations by event type in milliseconds
    const durations: Record<string, number> = {
      'cargo_ship': 15 * 60 * 1000, // 15 minutes
      'patrol_helicopter': 10 * 60 * 1000, // 10 minutes
      'airdrop': 5 * 60 * 1000, // 5 minutes
      'bradley_apc': 20 * 60 * 1000, // 20 minutes
      'chinook': 12 * 60 * 1000 // 12 minutes
    };
    
    const duration = durations[eventType] || 10 * 60 * 1000; // Default 10 minutes
    const endTime = new Date(updatedAt.getTime() + duration);
    
    if (now > endTime) {
      return "Terminando";
    }
    
    return formatTimeRemaining(endTime);
  };

  // Get event icon based on type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'cargo_ship':
        return <FaShip className="text-blue-400" />;
      case 'patrol_helicopter':
        return <FaHelicopter className="text-red-500" />;
      case 'airdrop':
        return <FaPlane className="text-green-400" />;
      case 'bradley_apc':
        return <TbTank className="text-amber-500" />;
      case 'chinook':
        return <FaHelicopter className="text-emerald-400" />;
      default:
        return <FaMapMarkerAlt className="text-zinc-400" />;
    }
  };

  // Get event name based on type
  const getEventName = (type: string): string => {
    switch (type) {
      case 'cargo_ship':
        return 'Navio de Carga';
      case 'patrol_helicopter':
        return 'Helicóptero de Ataque';
      case 'airdrop':
        return 'Airdrop';
      case 'bradley_apc':
        return 'Bradley APC';
      case 'chinook':
        return 'Chinook';
      default:
        return 'Evento Desconhecido';
    }
  };

  // Get location string based on position
  const getEventLocation = (event: ServerEvent): string => {
    if (!event.position_x || !event.position_z) return "Desconhecido";
    
    // Convert coordinates to grid (e.g., A10)
    const gridSize = 146.3; // Approximate grid size in Rust
    const gridLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXY';
    
    const worldSize = 4500; // Default world size
    const halfWorld = worldSize / 2;
    
    // Adjust coordinates to grid reference
    const adjustedX = event.position_x + halfWorld;
    const adjustedZ = event.position_z + halfWorld;
    
    // Calculate grid
    const gridX = Math.floor(adjustedX / gridSize);
    const gridZ = Math.floor(adjustedZ / gridSize);
    
    // Letter + Number
    const gridLetter = gridLetters[gridX] || 'Z';
    const gridNumber = gridZ + 1;
    
    return `${gridLetter}${gridNumber}`;
  };

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-4">Eventos Ativos</h3>
        
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner color="amber" text="Carregando eventos..." />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-zinc-500">{error}</div>
        ) : events.length > 0 ? (
          <div className="space-y-3">
            {events.map(event => (
              <div 
                key={event.event_id} 
                className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 flex items-center"
              >
                <div className="h-10 w-10 bg-zinc-900 rounded-full flex items-center justify-center mr-3 text-xl">
                  {getEventIcon(event.type)}
                </div>
                
                <div className="flex-grow">
                  <div className="font-semibold">{getEventName(event.type)}</div>
                  
                  <div className="flex items-center text-xs text-zinc-400 mt-1">
                    {showLocation && (
                      <div className="flex items-center mr-4">
                        <FaMapMarkerAlt className="mr-1" /> {getEventLocation(event)}
                      </div>
                    )}
                    
                    {showTimers && (
                      <div className="flex items-center">
                        <FaClock className="mr-1" /> {getTimeRemaining(event)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500">
            Nenhum evento ativo no momento
          </div>
        )}
      </div>
    </Card>
  );
};

export default ServerEventsSection;