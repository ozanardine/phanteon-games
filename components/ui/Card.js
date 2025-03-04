import React from 'react';

const Card = ({
  children,
  className = '',
  padding = 'normal',
  border = true,
  shadow = true,
  hoverable = false,
  ...props
}) => {
  // Definição de padding
  const paddingStyles = {
    none: 'p-0',
    small: 'p-3',
    normal: 'p-6',
    large: 'p-8',
  };

  // Classe base do card
  const baseClasses = 'bg-dark-300 rounded-lg';
  
  // Classes condicionais
  const borderClasses = border ? 'border border-dark-200' : '';
  const shadowClasses = shadow ? 'shadow-lg' : '';
  const hoverClasses = hoverable ? 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl' : '';
  
  // Combinação final de classes
  const cardClasses = `
    ${baseClasses}
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
  <h3 className={`text-xl font-bold text-white ${className}`} {...props}>
    {children}
  </h3>
);

Card.Subtitle = ({ children, className = '', ...props }) => (
  <p className={`text-gray-400 mt-1 ${className}`} {...props}>
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
  <hr className={`border-t border-dark-200 my-4 ${className}`} {...props} />
);

export default Card;