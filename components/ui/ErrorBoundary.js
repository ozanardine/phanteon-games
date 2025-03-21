import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o estado para que a próxima renderização mostre a UI alternativa
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Você também pode registrar o erro em um serviço de relatório de erros
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Enviar erro para serviço de monitoramento (se existir)
    if (window && window.Sentry) {
      window.Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      // Determinar se estamos na área de admin
      const isAdminPage = typeof window !== 'undefined' && 
        window.location.pathname.includes('/admin');
      
      return (
        <div className="min-h-screen bg-dark-300 flex flex-col items-center justify-center p-4">
          <div className="bg-dark-400 rounded-lg shadow-xl p-8 max-w-md w-full border border-dark-200">
            <div className="text-red-500 text-6xl flex justify-center mb-6">
              <FaExclamationTriangle />
            </div>
            
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Algo deu errado
            </h1>
            
            <p className="text-gray-300 text-center mb-8">
              Ocorreu um erro durante a renderização da página.
            </p>
            
            {isAdminPage ? (
              <div className="text-xs text-gray-500 bg-gray-800 p-3 rounded-md overflow-auto mb-6 max-h-40">
                <pre>{this.state.error?.toString() || 'Erro desconhecido'}</pre>
              </div>
            ) : null}
            
            <div className="flex flex-col space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => window.location.href = '/'}
              >
                Voltar para página inicial
              </Button>
              
              <Button
                variant="outline"
                fullWidth
                onClick={() => window.location.reload()}
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 