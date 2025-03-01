import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiXCircle } from 'react-icons/fi';

type AlertProps = {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Alert({ type = 'info', title, children, className = '' }: AlertProps) {
  const icons = {
    info: <FiInfo className="w-5 h-5" />,
    success: <FiCheckCircle className="w-5 h-5" />,
    warning: <FiAlertCircle className="w-5 h-5" />,
    error: <FiXCircle className="w-5 h-5" />,
  };

  const styles = {
    info: 'bg-blue-900/30 border-blue-800 text-blue-100',
    success: 'bg-green-900/30 border-green-800 text-green-100',
    warning: 'bg-yellow-900/30 border-yellow-800 text-yellow-100',
    error: 'bg-red-900/30 border-red-800 text-red-100',
  };

  return (
    <div className={`rounded-md border p-4 ${styles[type]} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <div className={`text-sm ${title ? 'mt-2' : ''}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
