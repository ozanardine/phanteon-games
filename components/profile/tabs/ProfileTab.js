// components/profile/tabs/ProfileTab.js
import React from 'react';
import { FaUser, FaDiscord, FaSteam, FaCalendarAlt, FaLink, FaUserCircle } from 'react-icons/fa';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { formatDate } from '../utils';

const ProfileTab = ({ userData, session, onEditSteamId }) => {
  return (
    <div className="space-y-8">
      {/* Card de Informações do Perfil */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaUser className="text-primary mr-2" />
            Informações Pessoais
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-col md:flex-row md:space-x-6">
            {/* Avatar e Nome */}
            <div className="flex flex-col items-center mb-6 md:mb-0">
              {session?.user?.image ? (
                <div className="relative h-32 w-32 rounded-full overflow-hidden mb-4 border-4 border-dark-300 shadow-lg">
                  <img 
                    src={session.user.image} 
                    alt={session.user.name} 
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="bg-dark-300 h-32 w-32 rounded-full flex items-center justify-center mb-4 border-4 border-dark-300">
                  <FaUserCircle className="h-20 w-20 text-gray-400" />
                </div>
              )}
              <h2 className="text-xl font-bold text-white">{session?.user?.name}</h2>
              <p className="text-gray-400 text-sm">{session?.user?.email}</p>
            </div>

            {/* Informações de Conta */}
            <div className="flex-grow space-y-5">
              <div className="bg-dark-400/50 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-3">Detalhes da Conta</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center mb-1">
                      <FaDiscord className="text-primary mr-2" />
                      <span className="text-gray-300 text-sm">Discord ID</span>
                    </div>
                    <p className="bg-dark-400 p-2 rounded text-gray-400 text-sm break-all">
                      {session?.user?.discord_id || 'Não disponível'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center mb-1">
                      <FaSteam className="text-primary mr-2" />
                      <span className="text-gray-300 text-sm">Steam ID</span>
                    </div>
                    <div className="flex items-center">
                      <p className="bg-dark-400 p-2 rounded text-gray-400 text-sm flex-grow break-all">
                        {userData?.steam_id || 'Não configurado'}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2"
                        onClick={onEditSteamId}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-1">
                      <FaCalendarAlt className="text-primary mr-2" />
                      <span className="text-gray-300 text-sm">Membro desde</span>
                    </div>
                    <p className="bg-dark-400 p-2 rounded text-gray-400 text-sm">
                      {userData?.created_at ? formatDate(userData.created_at) : 'Data indisponível'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Configurações e Preferências (Placeholder para expansão futura) */}
              <div className="bg-dark-400/50 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-3">Preferências</h3>
                <p className="text-gray-400 text-sm">
                  Aqui você poderá configurar suas preferências de notificações e comunicação.
                  Essas opções estarão disponíveis em breve.
                </p>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Card de Integração de Contas */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaLink className="text-primary mr-2" />
            Contas Conectadas
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 gap-4">
            {/* Discord */}
            <div className="bg-[#5865F2]/10 p-4 rounded-lg border border-[#5865F2]/20 flex items-center justify-between">
              <div className="flex items-center">
                <FaDiscord className="text-[#5865F2] text-2xl mr-3" />
                <div>
                  <h4 className="text-white font-medium">Discord</h4>
                  <p className="text-gray-400 text-sm truncate max-w-[150px]">
                    {session?.user?.discord_username || session?.user?.name || 'Conta conectada'}
                  </p>
                </div>
              </div>
              <span className="bg-[#5865F2]/20 text-[#5865F2] text-xs font-medium px-2 py-1 rounded">
                Conectado
              </span>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProfileTab;