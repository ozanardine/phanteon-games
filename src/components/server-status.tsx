"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { FaUserAlt, FaServer, FaClock } from "react-icons/fa";

interface ServerStatusProps {
  gameType: string;
}

interface ServerData {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  status: "online" | "offline";
  address: string;
  lastUpdated: string;
}

export default function ServerStatus({ gameType }: ServerStatusProps) {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServerData = async () => {
      try {
        setLoading(true);
        
        // Em produção, isso seria chamado em uma API Route do Next.js
        // para manter a chave da API segura no servidor
        const response = await axios.get(
          "https://api.battlemetrics.com/servers/1234567", // Substitua pelo ID real do servidor
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_BATTLEMETRICS_API_KEY}`
            }
          }
        );

        // Transformando os dados da API em nosso formato
        const data = response.data.data;
        const serverInfo: ServerData = {
          id: data.id,
          name: data.attributes.name,
          players: data.attributes.players,
          maxPlayers: data.attributes.maxPlayers,
          status: data.attributes.status,
          address: `${data.attributes.ip}:${data.attributes.port}`,
          lastUpdated: new Date(data.attributes.updatedAt).toLocaleString("pt-BR")
        };

        setServerData(serverInfo);
      } catch (err) {
        console.error("Erro ao buscar dados do servidor:", err);
        setError("Não foi possível carregar os dados do servidor");
        
        // Dados simulados para desenvolvimento
        setServerData({
          id: "12345",
          name: "Phanter Ops Rust - Brasil",
          players: 65,
          maxPlayers: 100,
          status: "online",
          address: "rust.phanterops.com:28015",
          lastUpdated: new Date().toLocaleString("pt-BR")
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServerData();
    
    // Atualiza a cada 60 segundos
    const interval = setInterval(fetchServerData, 60000);
    return () => clearInterval(interval);
  }, [gameType]);

  if (loading) {
    return (
      <div className="bg-military-green rounded-lg p-6 flex flex-col items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-intense-orange"></div>
        <p className="mt-4 text-gray-300">Carregando dados do servidor...</p>
      </div>
    );
  }

  if (error && !serverData) {
    return (
      <div className="bg-military-green rounded-lg p-6 flex flex-col items-center justify-center h-48">
        <p className="text-red-500">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-intense-orange text-white rounded-md"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!serverData) return null;

  const playerPercentage = (serverData.players / serverData.maxPlayers) * 100;
  const statusColor = serverData.status === "online" ? "text-green-500" : "text-red-500";

  return (
    <div className="bg-military-green rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold">{serverData.name}</h3>
        <span className={`px-2 py-1 text-sm rounded-full font-medium ${statusColor}`}>
          {serverData.status === "online" ? "Online" : "Offline"}
        </span>
      </div>
      
      <div className="space-y-4">
        {/* Players Info */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center text-gray-300">
              <FaUserAlt className="mr-2" />
              <span>Jogadores</span>
            </div>
            <span className="text-white">{serverData.players}/{serverData.maxPlayers}</span>
          </div>
          <div className="w-full bg-dark-green-black rounded-full h-2.5">
            <div 
              className="bg-intense-orange h-2.5 rounded-full" 
              style={{ width: `${playerPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Server Address */}
        <div className="flex items-center">
          <FaServer className="text-gray-300 mr-2" />
          <span className="text-gray-300 mr-1">Endereço:</span>
          <span className="text-white font-mono">{serverData.address}</span>
        </div>
        
        {/* Last Updated */}
        <div className="flex items-center text-xs text-gray-400">
          <FaClock className="mr-1" />
          <span>Atualizado: {serverData.lastUpdated}</span>
        </div>
      </div>
      
      <button 
        className="mt-6 w-full py-2 bg-olive-green hover:bg-olive-green/80 text-white rounded-md transition-colors"
        onClick={() => window.open(`steam://connect/${serverData.address}`, '_blank')}
      >
        Conectar ao Servidor
      </button>
    </div>
  );
} 