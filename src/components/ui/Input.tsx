import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = false,
  className = '',
  icon,
  ...props
}) => {
  const inputClasses = `bg-phanteon-dark border ${
    error ? 'border-red-500' : 'border-phanteon-light'
  } text-white text-sm rounded-lg focus:ring-phanteon-orange focus:border-phanteon-orange block p-2.5 ${
    icon ? 'pl-10' : 'pl-2.5'
  } w-full`;
  
  const containerClasses = `${fullWidth ? 'w-full' : ''} ${className}`;
  
  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={props.id} className="block mb-2 text-sm font-medium text-white">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input className={inputClasses} {...props} />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};