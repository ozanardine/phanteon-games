"use client";

import { useState, useEffect } from "react";
import ServerStatus from "@/components/server-status";
import { FaDiscord, FaInfo, FaGamepad } from "react-icons/fa";

interface ServerTab {
  id: string;
  label: string;
  gameType: string;
  icon: React.ReactNode;
}

export default function ServidoresPage() {
  const [activeTab, setActiveTab] = useState<string>("rust");
  
  const tabs: ServerTab[] = [
    {
      id: "rust",
      label: "Rust",
      gameType: "rust",
      icon: <FaGamepad className="h-5 w-5" />,
    },
    // Exemplos de outros servidores que poderiam ser adicionados no futuro
    // {
    //   id: "minecraft",
    //   label: "Minecraft",
    //   gameType: "minecraft",
    //   icon: <FaGamepad className="h-5 w-5" />,
    // },
    // {
    //   id: "ark",
    //   label: "ARK",
    //   gameType: "ark",
    //   icon: <FaGamepad className="h-5 w-5" />,
    // },
  ];

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Nossos <span className="text-intense-orange">Servidores</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Confira o status dos nossos servidores em tempo real e conecte-se para começar a jogar!
        </p>
      </div>

      {/* Tabs de navegação */}
      <div className="flex justify-center">
        <div className="bg-military-green/50 rounded-full p-1.5 flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-5 py-2 rounded-full transition-colors ${
                activeTab === tab.id 
                  ? "bg-intense-orange text-white" 
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Exibe o servidor ativo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ServerStatus gameType={activeTab} />
        
        {/* Em um ambiente real, poderiam existir múltiplos servidores do mesmo jogo */}
        {activeTab === "rust" && (
          <div className="bg-military-green rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Phanter Ops Rust - PVE</h3>
              <span className="px-2 py-1 text-sm rounded-full font-medium text-green-500">
                Online
              </span>
            </div>
            
            <p className="text-gray-300 mb-4">
              Servidor PVE com foco em construção, exploração e eventos especiais. Ideal para jogadores que preferem um ambiente cooperativo.
            </p>
            
            <div className="flex items-center mb-4">
              <span className="text-gray-300 mr-1">Endereço:</span>
              <span className="text-white font-mono">pve.rust.phanterops.com:28016</span>
            </div>
            
            <button 
              className="mt-4 w-full py-2 bg-olive-green hover:bg-olive-green/80 text-white rounded-md transition-colors"
              onClick={() => window.open(`steam://connect/pve.rust.phanterops.com:28016`, '_blank')}
            >
              Conectar ao Servidor
            </button>
          </div>
        )}
      </div>

      {/* Informações do Servidor Rust */}
      {activeTab === "rust" && (
        <div className="bg-military-green p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FaInfo className="mr-2" />
            Sobre nossos servidores de Rust
          </h2>
          
          <div className="space-y-4">
            <p>
              Nossos servidores Rust são otimizados para proporcionar a melhor experiência de jogo, com hardware de alta performance garantindo estabilidade e baixo ping.
            </p>
            
            <h3 className="text-xl font-semibold mt-4">Recursos dos Servidores:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Proteção anti-cheat avançada</li>
              <li>Limpeza de mapa e wipe programados mensalmente</li>
              <li>Eventos especiais semanais com recompensas exclusivas</li>
              <li>Sistema de clãs e economia in-game</li>
              <li>Moderação ativa 24/7</li>
              <li>Sistema de recompensas para jogadores ativos</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-4">Regras Básicas:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sem uso de hacks, cheats ou exploits</li>
              <li>Respeito entre jogadores no chat e comunicação</li>
              <li>Sem camperar novatos nas áreas iniciais</li>
              <li>Sem racismo, discriminação ou assédio</li>
              <li>PVP liberado em todas as áreas exceto no servidor PVE</li>
            </ul>
            
            <div className="mt-6 p-4 bg-olive-green/30 rounded-lg flex items-center">
              <FaDiscord className="text-indigo-400 text-2xl mr-3" />
              <div>
                <p className="font-medium">Junte-se ao nosso Discord</p>
                <p className="text-sm text-gray-300">Para suporte, comunicação com outros jogadores e receber anúncios importantes</p>
              </div>
              <a 
                href="https://discord.gg/phanterops" 
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Acessar Discord
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 