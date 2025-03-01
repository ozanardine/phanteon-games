import React from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, children, className = '' }: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      {description && (
        <p className="mt-2 text-lg text-gray-300">{description}</p>
      )}
      {children}
    </div>
  );
}