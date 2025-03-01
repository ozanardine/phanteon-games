import React from 'react';

type VipBadgeProps = {
  isVip: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function VipBadge({ isVip, size = 'md', className = '' }: VipBadgeProps) {
  if (!isVip) return null;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };
  
  return (
    <span 
      className={`inline-flex items-center rounded-md bg-phanteon-orange/20 text-phanteon-orange font-medium ${sizeClasses[size]} ${className}`}
    >
      VIP
    </span>
  );
}