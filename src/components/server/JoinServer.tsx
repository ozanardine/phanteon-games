// src/components/server/JoinServer.tsx
import { useState } from 'react';
import { FaSteam, FaCopy, FaCheckCircle } from 'react-icons/fa';
import { generateConnectUrl } from '../../lib/api/steamApi';

interface JoinServerProps {
  serverAddress: string;
  showCopyOption?: boolean;
}

const JoinServer = ({ serverAddress, showCopyOption = true }: JoinServerProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(serverAddress);
    setCopied(true);
    
    // Reset copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  const connectUrl = generateConnectUrl(serverAddress);

  return (
    <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
      <a 
        href={connectUrl}
        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-md transition-colors flex items-center"
      >
        <FaSteam className="mr-2" />
        Conectar via Steam
      </a>
      
      {showCopyOption && (
        <div className="relative flex">
          <input
            type="text"
            value={serverAddress}
            readOnly
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 px-4 py-3 rounded-md w-48 sm:w-auto"
          />
          <button
            onClick={handleCopyAddress}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Copiar endereço do servidor"
          >
            {copied ? <FaCheckCircle className="text-green-500" /> : <FaCopy />}
          </button>
        </div>
      )}
    </div>
  );
};

export default JoinServer;