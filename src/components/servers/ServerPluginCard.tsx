import React from 'react';
import { ServerPlugin } from '@/types/database.types';
import { FiPackage, FiInfo, FiCode, FiChevronDown, FiChevronUp } from 'react-icons/fi';

type ServerPluginCardProps = {
  plugin: ServerPlugin;
};

export function ServerPluginCard({ plugin }: ServerPluginCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`bg-phanteon-dark rounded-lg border ${
        isExpanded ? 'border-phanteon-orange' : 'border-phanteon-light'
      } transition-colors`}
    >
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={toggleExpanded}
      >
        <div className="flex items-center">
          <div className="p-2 rounded-md bg-phanteon-light mr-3">
            <FiPackage className="text-phanteon-orange" />
          </div>
          <div>
            <h3 className="text-white font-medium">{plugin.name}</h3>
            <p className="text-gray-400 text-sm">Versão {plugin.version}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          {plugin.is_active && (
            <span className="mr-3 text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded-full">
              Ativo
            </span>
          )}
          
          {isExpanded ? (
            <FiChevronUp className="text-gray-400" />
          ) : (
            <FiChevronDown className="text-gray-400" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-phanteon-light mt-1">
          <p className="text-gray-300 text-sm">
            {plugin.description}
          </p>
          
          <div className="mt-4 pt-3 border-t border-phanteon-light">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center text-xs px-2 py-1 bg-phanteon-light rounded-md text-gray-300">
                <FiCode className="mr-1" />
                {plugin.version}
              </div>
              
              <div className="flex items-center text-xs px-2 py-1 bg-phanteon-light rounded-md text-gray-300">
                <FiInfo className="mr-1" />
                {plugin.is_active ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}