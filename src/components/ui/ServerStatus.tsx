import React from 'react';

type ServerStatusProps = {
  status: 'online' | 'offline';
  className?: string;
  showText?: boolean;
};

export function ServerStatus({ status, className = '', showText = true }: ServerStatusProps) {
  const statusColor = status === 'online' ? 'bg-green-500' : 'bg-red-500';
  
  return (
    <div className={`flex items-center ${className}`}>
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusColor}`}></span>
      {showText && (
        <span className="ml-2 text-sm text-gray-300">
          {status === 'online' ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}