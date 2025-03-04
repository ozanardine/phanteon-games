import React, { Fragment, useEffect } from 'react';
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
}) => {
  // Determina o tamanho do modal
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  // Fecha o modal ao pressionar ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Previne o scroll do body quando o modal está aberto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
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
    >
      <div className={`relative mx-auto my-6 w-full ${sizeClasses[size]} p-4`}>
        {/* Modal Content */}
        <div className="relative rounded-lg bg-dark-300 shadow-xl">
          {/* Modal Header */}
          {title && (
            <div className="flex items-center justify-between rounded-t-lg border-b border-dark-200 p-4">
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              {showCloseButton && (
                <button
                  className="ml-auto text-gray-400 hover:text-white"
                  onClick={onClose}
                >
                  <FaTimes className="h-5 w-5" />
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
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
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