import React, { ReactNode } from 'react';

interface FormControlProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export const FormControl: React.FC<FormControlProps> = ({ 
  label, 
  htmlFor, 
  error, 
  className = '', 
  children 
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={htmlFor} 
          className="block mb-2 text-sm font-medium text-white"
        >
          {label}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};