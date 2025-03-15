// components/profile/SteamIdModal.js
import React from 'react';
import { FaSteam } from 'react-icons/fa';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { validateSteamId } from './utils';

const SteamIdModal = ({ isOpen, onClose, steamId, setSteamId, onSave, loading, isNewUser }) => {
  // Validate SteamID format to provide visual feedback
  const isValidFormat = !steamId || validateSteamId(steamId);
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isNewUser ? "Seja bem-vindo! Configure seu Steam ID" : "Editar Steam ID"}
      closeOnOverlayClick={!isNewUser}
      footer={
        <>
          {!isNewUser && (
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="hover:bg-dark-200"
            >
              Cancelar
            </Button>
          )}
          <Button
            variant="primary"
            onClick={onSave}
            loading={loading}
            disabled={!isValidFormat || !steamId}
            className="px-6 shadow-lg hover:shadow-primary/20"
          >
            {isNewUser ? "Salvar e Continuar" : "Salvar"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {isNewUser && (
          <div className="bg-gradient-to-r from-primary/10 to-dark-300 p-5 rounded-lg border border-primary/20">
            <h3 className="font-medium text-white text-lg mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Bem-vindo à Phanteon Games!
            </h3>
            <p className="text-gray-300">
              Para concluir seu cadastro e aproveitar todas as funcionalidades, precisamos que você configure seu Steam ID.
            </p>
          </div>
        )}
        
        <div className="flex items-center space-x-3 bg-dark-400/40 p-4 rounded-lg">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-dark-400 flex items-center justify-center border border-dark-200">
            <FaSteam className="text-xl text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-white">Vinculação de conta Steam</h4>
            <p className="text-gray-400 text-sm">
              Para ativar seu VIP no servidor, precisamos do seu Steam ID de 17 dígitos.
            </p>
          </div>
        </div>
        
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-200">
          <div className="flex flex-col space-y-3">
            <label htmlFor="steamId" className="block text-gray-300 font-medium">
              Steam ID (17 dígitos)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSteam className="text-gray-400" />
              </div>
              <input
                id="steamId"
                type="text"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                className={`pl-10 w-full bg-dark-300 border-2 ${
                  steamId && !isValidFormat ? 'border-red-500' : 'border-dark-200'
                } focus:border-primary rounded-md p-3 text-white focus:outline-none transition duration-200`}
                placeholder="76561198xxxxxxxxx"
              />
            </div>
            {steamId && !isValidFormat ? (
              <p className="text-sm text-red-400 flex items-center">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" fill="currentColor" fillOpacity="0.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Steam ID deve conter exatamente 17 dígitos numéricos
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Certifique-se de que seu Steam ID tenha exatamente 17 dígitos numéricos
              </p>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-dark-300 to-dark-400 rounded-lg p-4 border border-dark-200">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-primary mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <p className="text-gray-300 text-sm">
                Para encontrar seu Steam ID, acesse{' '}
                <a
                  href="https://steamid.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  steamid.io
                </a>{' '}
                e insira o link do seu perfil.
              </p>
              <p className="text-gray-400 text-xs mt-1">O Steam ID está no formato "steamID64" e contém 17 dígitos.</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SteamIdModal;