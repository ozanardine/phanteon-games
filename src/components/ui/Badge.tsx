import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'primary', 
  children, 
  className = '' 
}) => {
  const variantClasses = {
    primary: 'bg-phanteon-orange text-white',
    secondary: 'bg-phanteon-light text-white',
    success: 'bg-green-800 text-green-100',
    danger: 'bg-red-800 text-red-100',
    warning: 'bg-yellow-800 text-yellow-100',
    info: 'bg-blue-800 text-blue-100',
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// Exporte todos os componentes de UI
export { Button, Input, Card, Alert, FormControl, Spinner, Tabs, Badge };