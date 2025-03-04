import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { FaDiscord, FaUser } from 'react-icons/fa';
import Card from '../ui/Card';
import SteamIdEditor from './SteamIdEditor';

const ProfileContainer = ({ userData, onSteamIdUpdate }) => {
  const { data: session } = useSession();
  const [steamId, setSteamId] = useState(userData?.steam_id || '');

  const handleSteamIdUpdate = (newSteamId) => {
    setSteamId(newSteamId);
    if (typeof onSteamIdUpdate === 'function') {
      onSteamIdUpdate(newSteamId);
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Informações Pessoais</Card.Title>
      </Card.Header>
      <Card.Body>
        <div className="flex flex-col items-center mb-6">
          {session?.user?.image ? (
            <div className="relative h-24 w-24 rounded-full overflow-hidden mb-4">
              <Image 
                src={session.user.image} 
                alt={session.user.name} 
                fill 
                className="object-cover"
              />
            </div>
          ) : (
            <div className="bg-dark-200 h-24 w-24 rounded-full flex items-center justify-center mb-4">
              <FaUser className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <h2 className="text-xl font-bold text-white">{session?.user?.name}</h2>
          <p className="text-gray-400 text-sm">{session?.user?.email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center mb-2">
              <FaDiscord className="text-primary mr-2" />
              <span className="text-gray-300 font-medium">Discord ID</span>
            </div>
            <p className="bg-dark-400 p-2 rounded text-gray-400 text-sm break-all">
              {session?.user?.discord_id || 'Não disponível'}
            </p>
          </div>

          <div>
            <SteamIdEditor 
              initialSteamId={steamId} 
              onSuccess={handleSteamIdUpdate}
            />
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProfileContainer;