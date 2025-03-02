import React from 'react';
import { ServerEvent } from '@/types/database.types';
import { formatDateTime } from '@/utils/dateUtils';
import { 
  FiAlertCircle, 
  FiCompass, 
  FiClock, 
  FiActivity, 
  FiPackage,
  FiX,
  FiCheck,
  FiUsers,
  FiTarget
} from 'react-icons/fi';
import { GiHelicopter, GiTank, GiCargoShip, GiParachute, GiSwordman } from 'react-icons/gi';

type ServerEventCardProps = {
  event: ServerEvent;
};

export function ServerEventCard({ event }: ServerEventCardProps) {
  // Determinar ícone com base no tipo de evento
  const getEventIcon = (): React.ReactNode => {
    const type = event.event_type_rust || event.type;
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('helicopter') || lowerType.includes('heli')) {
      return <GiHelicopter className="text-red-500" />;
    } else if (lowerType.includes('bradley') || lowerType.includes('apc')) {
      return <GiTank className="text-yellow-500" />;
    } else if (lowerType.includes('cargo') || lowerType.includes('ship')) {
      return <GiCargoShip className="text-blue-500" />;
    } else if (lowerType.includes('airdrop')) {
      return <GiParachute className="text-green-500" />;
    } else if (lowerType.includes('kill') || lowerType.includes('death')) {
      return <GiSwordman className="text-red-500" />;
    } else if (lowerType.includes('player') || lowerType.includes('user')) {
      return <FiUsers className="text-blue-500" />;
    } else if (lowerType.includes('event') || lowerType.includes('torneio')) {
      return <FiActivity className="text-purple-500" />;
    } else if (lowerType.includes('raid')) {
      return <FiTarget className="text-orange-500" />;
    }
    
    return <FiAlertCircle className="text-phanteon-orange" />;
  };
  
  // Formatar detalhes extras com base no tipo de evento
  const getEventDetails = (): React.ReactNode => {
    if (!event.extra_data) return null;
    
    const type = event.event_type_rust || event.type;
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('kill') && event.extra_data.killer && event.extra_data.victim) {
      return (
        <div>
          <p className="text-sm">
            <span className="font-medium text-white">{event.extra_data.killer}</span>
            <span className="text-gray-400"> matou </span>
            <span className="font-medium text-white">{event.extra_data.victim}</span>
            {event.extra_data.weapon && (
              <>
                <span className="text-gray-400"> com </span>
                <span className="text-phanteon-orange">{event.extra_data.weapon}</span>
              </>
            )}
            {event.extra_data.distance && (
              <>
                <span className="text-gray-400"> a </span>
                <span className="text-phanteon-orange">{event.extra_data.distance}m</span>
              </>
            )}
            {event.extra_data.headshot && (
              <span className="text-red-500"> (headshot)</span>
            )}
          </p>
        </div>
      );
    } else if (lowerType.includes('raid') && event.extra_data.raiders) {
      return (
        <div>
          <p className="text-sm">
            <span className="font-medium text-white">{Array.isArray(event.extra_data.raiders) ? event.extra_data.raiders.join(', ') : event.extra_data.raiders}</span>
            <span className="text-gray-400"> está raidando a base de </span>
            <span className="font-medium text-white">{event.extra_data.base_owner}</span>
          </p>
          {event.extra_data.explosives_used && (
            <p className="text-xs text-gray-400 mt-1">
              Explosivos usados: <span className="text-phanteon-orange">{event.extra_data.explosives_used}</span>
            </p>
          )}
        </div>
      );
    } else if (event.extra_data.description) {
      return (
        <p className="text-sm text-gray-300">
          {event.extra_data.description}
        </p>
      );
    }
    
    return null;
  };
  
  // Formatar coordenadas quando disponíveis
  const formatCoordinates = (): string | null => {
    if (event.position_x !== null && event.position_y !== null && event.position_z !== null) {
      return `(${Math.round(event.position_x)}, ${Math.round(event.position_z)})`;
    }
    return null;
  };
  
  return (
    <div className={`p-4 rounded-lg ${event.is_active 
      ? 'bg-phanteon-orange/10 border border-phanteon-orange' 
      : 'bg-phanteon-dark border border-phanteon-light'}`}>
      <div className="flex items-start">
        <div className={`p-2 rounded-md ${event.is_active 
          ? 'bg-phanteon-orange/20' 
          : 'bg-phanteon-light'} mr-3 mt-1`}>
          {getEventIcon()}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-white font-medium">
              {event.type}
              {event.is_active && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full">
                  Ativo
                </span>
              )}
            </h3>
            
            <div className="flex items-center text-gray-400 text-sm">
              <FiClock className="mr-1" />
              {formatDateTime(event.updated_at)}
            </div>
          </div>
          
          {getEventDetails()}
          
          <div className="flex flex-wrap gap-2 mt-2">
            {formatCoordinates() && (
              <div className="flex items-center text-xs px-2 py-0.5 bg-phanteon-light rounded-md text-gray-300">
                <FiCompass className="mr-1" />
                {formatCoordinates()}
              </div>
            )}
            
            <div className="flex items-center text-xs px-2 py-0.5 bg-phanteon-light rounded-md text-gray-300">
              <FiActivity className="mr-1" />
              Status: {event.is_active ? 'Ativo' : 'Finalizado'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}