import React, { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  footer,
  className = '',
}) => {
  return (
    <div className={`bg-phanteon-gray rounded-lg border border-phanteon-light overflow-hidden ${className}`}>
      {title && (
        <div className="border-b border-phanteon-light p-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && (
        <div className="border-t border-phanteon-light p-4 bg-phanteon-dark/50">
          {footer}
        </div>
      )}
    </div>
  );
};