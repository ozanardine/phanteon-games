import React, { Fragment, useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  showCloseButton = true,
  id,
}) => {
  // Referência para o conteúdo do modal para gerenciamento de foco
  const modalRef = useRef(null);
  const modalId = id || `modal-${Math.random().toString(36).substr(2, 9)}`;
  const titleId = `${modalId}-title`;

  // Determina o tamanho do modal
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  // Gerencia o foco quando o modal abre
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Armazena o elemento que tinha foco antes do modal abrir
      const previouslyFocusedElement = document.activeElement;
      
      // Foca no primeiro elemento focável dentro do modal
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        // Se não houver elementos focáveis, foca no próprio modal
        modalRef.current.focus();
      }

      // Restaura o foco quando o modal fechar
      return () => {
        if (previouslyFocusedElement) {
          previouslyFocusedElement.focus();
        }
      };
    }
  }, [isOpen]);

  // Fecha o modal ao pressionar ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    // Impede que o Tab saia do modal mantendo foco dentro dele
    const handleTab = (event) => {
      if (isOpen && modalRef.current && event.key === 'Tab') {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          
          // Se Shift+Tab e o primeiro elemento está em foco, mova para o último
          if (event.shiftKey && document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          // Se Tab e o último elemento está em foco, mova para o primeiro
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.addEventListener('keydown', handleTab);
      // Previne o scroll do body quando o modal está aberto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleTab);
      // Restaura o scroll do body quando o modal é fechado
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, closeOnEsc]);

  // Handler para clique no overlay
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-70 transition-opacity"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      data-testid="modal-overlay"
    >
      <div 
        className={`relative mx-auto my-6 w-full ${sizeClasses[size]} p-4`}
        ref={modalRef}
        tabIndex={-1}
        id={modalId}
      >
        {/* Modal Content */}
        <div 
          className="relative rounded-lg bg-dark-300 shadow-xl"
          role="document"
        >
          {/* Modal Header */}
          {title && (
            <div className="flex items-center justify-between rounded-t-lg border-b border-dark-200 p-4">
              <h3 
                className="text-xl font-semibold text-white" 
                id={titleId}
              >
                {title}
              </h3>
              {showCloseButton && (
                <button
                  className="ml-auto text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={onClose}
                  aria-label="Fechar"
                  data-testid="modal-close-button"
                >
                  <FaTimes className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {/* Modal Body */}
          <div className="p-6">{children}</div>

          {/* Modal Footer */}
          {footer && (
            <div className="flex flex-wrap items-center justify-end space-x-2 rounded-b-lg border-t border-dark-200 p-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de confirmação pré-construído
Modal.Confirm = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message = 'Tem certeza de que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'primary',
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <Fragment>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={loading}
            ariaLabel={cancelText}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            ariaLabel={confirmText}
          >
            {confirmText}
          </Button>
        </Fragment>
      }
    >
      <p className="text-gray-300">{message}</p>
    </Modal>
  );
};

export default Modal;