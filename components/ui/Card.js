import React from 'react';

const Card = ({
  children,
  className = '',
  padding = 'normal',
  border = true,
  shadow = true,
  hoverable = false,
  variant = 'default',
  ...props
}) => {
  // Definição de padding
  const paddingStyles = {
    none: 'p-0',
    small: 'p-3',
    normal: 'p-6',
    large: 'p-8',
  };

  // Variantes de estilo
  const variantStyles = {
    default: 'bg-dark-300',
    darker: 'bg-dark-400',
    lighter: 'bg-dark-200',
    highlight: 'bg-gradient-to-br from-dark-300 to-dark-400 border-primary/30'
  };

  // Classe base do card
  const baseClasses = 'rounded-lg transition-all duration-300';
  
  // Classes condicionais
  const borderClasses = border ? 'border border-dark-200' : '';
  const shadowClasses = shadow ? 'shadow-md hover:shadow-xl' : '';
  const hoverClasses = hoverable ? 'transform hover:-translate-y-1 hover:shadow-xl' : '';
  
  // Combinação final de classes
  const cardClasses = `
    ${baseClasses}
    ${variantStyles[variant] || variantStyles.default}
    ${paddingStyles[padding] || paddingStyles.normal}
    ${borderClasses}
    ${shadowClasses}
    ${hoverClasses}
    ${className}
  `;

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

// Subcomponentes para organizar o conteúdo do Card
Card.Header = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

Card.Title = ({ children, className = '', ...props }) => (
  <h3 className={`text-xl font-bold text-white mb-2 ${className}`} {...props}>
    {children}
  </h3>
);

Card.Subtitle = ({ children, className = '', ...props }) => (
  <p className={`text-gray-400 text-sm ${className}`} {...props}>
    {children}
  </p>
);

Card.Body = ({ children, className = '', ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`mt-4 pt-4 border-t border-dark-200 ${className}`} {...props}>
    {children}
  </div>
);

Card.Divider = ({ className = '', ...props }) => (
  <hr className={`border-dark-200 my-4 ${className}`} {...props} />
);

Card.Badge = ({ children, variant = 'primary', className = '', ...props }) => {
  const variantStyles = {
    primary: 'bg-primary/20 text-primary',
    success: 'bg-green-500/20 text-green-500',
    warning: 'bg-yellow-500/20 text-yellow-500',
    danger: 'bg-red-500/20 text-red-500',
    info: 'bg-blue-500/20 text-blue-500',
  };

  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

export default Card;