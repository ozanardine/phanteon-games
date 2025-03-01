// src/components/common/Card.tsx
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  borderColor?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = ({ 
  children, 
  className = '',
  hoverEffect = false,
  borderColor = 'border-zinc-700',
  padding = 'md'
}: CardProps) => {
  // Mapeamento de padding
  const paddingMap = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8'
  };
  
  // Classes base
  const baseClasses = [
    'bg-zinc-800',
    'border',
    borderColor,
    'rounded-lg',
    paddingMap[padding],
    hoverEffect ? 'transition-transform hover:transform hover:-translate-y-1 hover:shadow-lg' : '',
    className
  ].join(' ');
  
  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
};

export default Card;