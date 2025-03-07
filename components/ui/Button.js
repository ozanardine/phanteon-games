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
  icon,
  iconPosition = 'left',
  ...props
}) => {
  // Estilos base para todos os botões
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark-400';
  
  // Estilos de variantes com melhor contraste
  const variantStyles = {
    primary: 'bg-primary hover:bg-primary/90 active:bg-primary/80 text-white shadow-sm hover:shadow-md',
    secondary: 'bg-dark-200 hover:bg-dark-100 active:bg-dark-100/80 text-white',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10 active:bg-primary/20',
    ghost: 'bg-transparent hover:bg-dark-200 text-white hover:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    gradient: 'bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white shadow-md hover:shadow-lg',
  };
  
  // Estilos de tamanhos
  const sizeStyles = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-1.5 text-sm',
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

  // Conteúdo do botão com ícone e spinner
  const buttonContent = (
    <>
      {loading && (
        <FaSpinner className="animate-spin -ml-1 mr-2" aria-hidden="true" />
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      
      <span>{children}</span>
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
    </>
  );

  // Se for um link
  if (href) {
    return (
      <Link 
        href={href} 
        className={combinedStyles}
        {...accessibilityProps}
        {...props}
      >
        {buttonContent}
      </Link>
    );
  }

  // Se for um botão
  return (
    <button
      type={type}
      className={combinedStyles}
      onClick={onClick}
      disabled={disabled || loading}
      {...accessibilityProps}
      {...props}
    >
      {buttonContent}
    </button>
  );
};

export default Button;