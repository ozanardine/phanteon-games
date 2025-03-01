import React from 'react';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantClasses = {
    primary: 'bg-phanteon-orange text-white hover:bg-phanteon-orange/90 focus-visible:ring-phanteon-orange',
    secondary: 'bg-phanteon-light text-white hover:bg-phanteon-light/90 focus-visible:ring-phanteon-light',
    outline: 'border border-phanteon-orange text-phanteon-orange hover:bg-phanteon-orange/10 focus-visible:ring-phanteon-orange',
    ghost: 'hover:bg-phanteon-gray/50 text-white focus-visible:ring-phanteon-gray',
  };
  
  const sizeClasses = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 py-3 text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}