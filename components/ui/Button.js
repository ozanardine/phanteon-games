import React from 'react';
import Link from 'next/link';
import { FaSpinner } from 'react-icons/fa';

const Button = ({
  children,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  ariaLabel,
  ...props
}) => {
  // Estilos base para todos os botões
  const baseStyles = 'btn inline-flex items-center justify-center rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark-400';
  
  // Estilos de variantes com melhor contraste
  const variantStyles = {
    primary: 'bg-primary hover:bg-primary/90 text-white',
    secondary: 'bg-dark-200 hover:bg-dark-100 text-white',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'bg-transparent hover:bg-dark-200 text-white hover:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  
  // Estilos de tamanhos
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-3.5 text-lg',
  };
  
  // Estilos combinados
  const combinedStyles = `
    ${baseStyles}
    ${variantStyles[variant] || variantStyles.primary}
    ${sizeStyles[size] || sizeStyles.md}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || loading ? 'opacity-70 cursor-not-allowed' : ''}
    ${className}
  `;

  // Atributos de acessibilidade comuns
  const accessibilityProps = {
    'aria-label': ariaLabel || undefined,
    'aria-busy': loading || undefined,
    'aria-disabled': disabled || undefined,
    role: 'button',
  };

  // Se for um link
  if (href) {
    return (
      <Link 
        href={href}
        className={combinedStyles}
        tabIndex={disabled ? -1 : 0}
        {...accessibilityProps}
        {...props}
      >
        {loading && (
          <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
        )}
        <span>{children}</span>
      </Link>
    );
  }
  
  // Se for um botão
  return (
    <button
      type={type}
      className={combinedStyles}
      disabled={disabled || loading}
      onClick={onClick}
      tabIndex={disabled ? -1 : 0}
      {...accessibilityProps}
      {...props}
    >
      {loading && (
        <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
      )}
      <span>{children}</span>
    </button>
  );
};

export default Button;