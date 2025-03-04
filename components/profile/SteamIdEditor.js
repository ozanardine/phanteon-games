import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { FaSteam } from 'react-icons/fa';

const SteamIdEditor = ({ initialSteamId = '', onSuccess }) => {
  const [steamId, setSteamId] = useState(initialSteamId || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSaveSteamId = async () => {
    // Validação
    if (!steamId) {
      toast.error('Por favor, insira seu Steam ID');
      return;
    }
  
    if (!steamId.match(/^[0-9]{17}$/)) {
      toast.error('Steam ID inválido. Deve conter 17 dígitos numéricos');
      return;
    }
  
    setLoading(true);
    
    try {
      const response = await fetch('/api/user/update-steam-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ steamId }),
        credentials: 'include', // Importante: envia cookies da sessão
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `Erro: ${response.status}`);
      }
      
      if (result.success) {
        toast.success('Steam ID atualizado com sucesso!');
        setIsModalOpen(false);
        
        // Callback de sucesso
        if (typeof onSuccess === 'function') {
          onSuccess(steamId);
        } else {
          // Recarrega a página após um breve delay
          setTimeout(() => window.location.reload(), 1000);
        }
      } else {
        throw new Error('Falha ao atualizar Steam ID');
      }
    } catch (error) {
      console.error('Erro ao atualizar Steam ID:', error);
      toast.error(error.message || 'Erro ao atualizar Steam ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center mb-2">
        <FaSteam className="text-primary mr-2" />
        <span className="text-gray-300 font-medium">Steam ID</span>
      </div>
      
      <div className="flex items-center">
        <p className="bg-dark-400 p-2 rounded text-gray-400 text-sm flex-grow break-all">
          {initialSteamId || 'Não configurado'}
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-2"
          onClick={() => setIsModalOpen(true)}
        >
          Editar
        </Button>
      </div>

      {/* Modal para edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Editar Steam ID"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveSteamId}
              loading={loading}
            >
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Insira seu Steam ID de 17 dígitos para vincular sua conta.
          </p>
          <p className="text-gray-400 text-sm">
            Para encontrar seu Steam ID, acesse{' '}
            <a
              href="https://steamid.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              steamid.io
            </a>{' '}
            e insira o link do seu perfil.
          </p>
          <div>
            <label htmlFor="steamId" className="block text-gray-300 mb-1">
              Steam ID (17 dígitos)
            </label>
            <input
              id="steamId"
              type="text"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              className="input w-full"
              placeholder="76561198xxxxxxxxx"
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SteamIdEditor;