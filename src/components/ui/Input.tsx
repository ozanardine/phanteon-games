import React from 'react';

type InputProps = {
  label?: string;
  error?: string;
  fullWidth?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({
  label,
  error,
  fullWidth = false,
  className = '',
  ...props
}: InputProps) {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-200 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          bg-phanteon-light border border-phanteon-gray rounded-md px-4 py-2 text-white
          placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-phanteon-orange focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}