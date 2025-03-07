import React from 'react';

/**
 * Componente de loading spinner com indicação visual e textual
 * Projetado para garantir acessibilidade com role e aria-live
 */
const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  fullScreen = false,
  text = 'Carregando...',
  showText = true,
}) => {
  // Classes para diferentes tamanhos
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4',
  };

  // Classes para diferentes cores
  const colorClasses = {
    primary: 'border-primary',
    white: 'border-white',
    secondary: 'border-gray-300',
  };

  // Componente base do spinner
  const Spinner = () => (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
        aria-hidden="true"
      />
      {showText && (
        <p className="mt-2 text-sm text-gray-300" aria-live="polite">
          {text}
        </p>
      )}
    </div>
  );

  // Se for fullScreen, renderiza com overlay em tela cheia
  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-dark-400 bg-opacity-75"
        role="alert"
        aria-busy="true"
        aria-live="assertive"
      >
        <Spinner />
      </div>
    );
  }

  // Renderização normal
  return <Spinner />;
};

export default LoadingSpinner;
