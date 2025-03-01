// src/pages/eventos.tsx
import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useServerStatus } from '../hooks/useServerStatus';
import { formatTimeRemaining } from '../lib/utils/dateUtils';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTrophy, FaUsers, FaBell } from 'react-icons/fa';

const EventsPage = () => {
  const { currentEvents, isOnline } = useServerStatus();
  const [filter, setFilter] = useState<string | null>(null);
  
  // Eventos futuros (simulados para demonstração)
  const upcomingEvents = [
    {
      id: 'event1',
      name: 'Caça ao Tesouro',
      description: 'Procure por caixas escondidas pelo mapa. Prêmios incríveis para quem encontrar!',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias no futuro
      location: 'Todo o mapa',
      rewards: ['Kit de Componentes', '1000 Scrap', 'Skin exclusiva'],
      type: 'treasure',
      registrationRequired: true
    },
    {
      id: 'event2',
      name: 'Arena PvP',
      description: 'Batalha todos contra todos na arena. Último sobrevivente leva tudo!',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 dias no futuro
      location: 'Arena (G14)',
      rewards: ['Armas de Alto Nível', '2000 Scrap', 'VIP por 1 semana'],
      type: 'pvp',
      registrationRequired: true
    },
    {
      id: 'event3',
      name: 'Ataque ao Cargo',
      description: 'Evento especial: Cargo Ship com loot aumentado. Reúna seu grupo e prepare-se!',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias no futuro
      location: 'Cargo Ship',
      rewards: ['Componentes Raros', 'Armas Militares', '3000 Scrap'],
      type: 'raid',
      registrationRequired: false
    },
    {
      id: 'event4',
      name: 'Concurso de Construção',
      description: 'Mostre suas habilidades de construção. O mais criativo ganha!',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 dias no futuro
      location: 'Outpost',
      rewards: ['Base Design Blueprint', '5000 Scrap', 'VIP Elite por 1 mês'],
      type: 'build',
      registrationRequired: true
    }
  ];

  // Filtrar eventos
  const filteredCurrentEvents = filter 
    ? currentEvents.filter(event => event.type === filter) 
    : currentEvents;

  const filteredUpcomingEvents = filter 
    ? upcomingEvents.filter(event => event.type === filter) 
    : upcomingEvents;

  // Função para formatar data em PT-BR
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout 
      title="Eventos do Servidor - Rust Brasil"
      description="Confira os eventos ativos e futuros no servidor Rust Brasil. Participe e ganhe recompensas exclusivas!"
    >
      <div className="container mx-auto px-4 py-8 mt-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Eventos do Servidor</h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Participe de eventos exclusivos, divirta-se com a comunidade e ganhe recompensas incríveis!
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Button 
            variant={filter === null ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter(null)}
          >
            Todos
          </Button>
          <Button 
            variant={filter === 'cargo' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('cargo')}
          >
            Cargo Ship
          </Button>
          <Button 
            variant={filter === 'airdrop' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('airdrop')}
          >
            Airdrop
          </Button>
          <Button 
            variant={filter === 'heli' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('heli')}
          >
            Helicopter
          </Button>
          <Button 
            variant={filter === 'bradley' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('bradley')}
          >
            Bradley
          </Button>
          <Button 
            variant={filter === 'treasure' || filter === 'build' || filter === 'pvp' || filter === 'raid' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('treasure')}
          >
            Eventos Especiais
          </Button>
        </div>

        {/* Status do Servidor */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-lg font-semibold">
              Servidor {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        
        {/* Eventos Ativos */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center text-amber-500">
            <FaBell className="mr-2" /> Eventos Ativos
          </h2>
          
          {filteredCurrentEvents.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-zinc-400 mb-2">Nenhum evento ativo no momento.</p>
              <p className="text-sm text-zinc-500">Fique atento! Eventos podem começar a qualquer momento.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCurrentEvents.map(event => (
                <Card key={event.id} className="overflow-hidden" hoverEffect>
                  <div className="h-40 bg-cover bg-center" 
                       style={{ backgroundImage: `url('/images/events/${event.type}.jpg')` }}>
                    <div className="bg-gradient-to-b from-transparent to-zinc-900 h-full flex flex-col justify-end p-4">
                      <div className="flex items-center justify-between">
                        <span className="bg-amber-500 text-black font-bold px-3 py-1 rounded-full text-sm">
                          Ativo Agora
                        </span>
                        {event.timeRemaining && (
                          <span className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center">
                            <FaClock className="mr-1" size={12} /> 
                            {formatTimeRemaining(new Date(Date.now() + event.timeRemaining * 1000))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-2">{event.name}</h3>
                    
                    {event.location && (
                      <p className="text-zinc-400 text-sm flex items-center mb-3">
                        <FaMapMarkerAlt className="mr-1" /> {event.location}
                      </p>
                    )}
                    
                    <div className="mt-4 flex justify-between">
                      <Button size="sm" variant="outline">Marcar no Mapa</Button>
                      <Button size="sm">Participar</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Próximos Eventos */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center text-amber-500">
            <FaCalendarAlt className="mr-2" /> Próximos Eventos
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredUpcomingEvents.map(event => (
              <Card key={event.id} className="flex flex-col md:flex-row overflow-hidden">
                <div className="md:w-1/3 h-40 md:h-auto bg-cover bg-center" 
                     style={{ backgroundImage: `url('/images/events/${event.type}.jpg')` }}>
                </div>
                
                <div className="p-6 md:w-2/3">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold">{event.name}</h3>
                    <span className="bg-zinc-700 text-zinc-200 px-3 py-1 rounded-full text-xs">
                      {event.type === 'treasure' ? 'Caça ao Tesouro' : 
                       event.type === 'pvp' ? 'PvP' : 
                       event.type === 'build' ? 'Construção' : 'Raid'}
                    </span>
                  </div>
                  
                  <p className="text-zinc-400 text-sm mb-4">{event.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-zinc-300">
                      <FaCalendarAlt className="mr-2 text-amber-500" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center text-sm text-zinc-300">
                      <FaMapMarkerAlt className="mr-2 text-amber-500" />
                      {event.location}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm font-semibold mb-1 flex items-center">
                      <FaTrophy className="mr-2 text-amber-500" /> Recompensas:
                    </div>
                    <ul className="text-sm text-zinc-400 ml-6 list-disc">
                      {event.rewards.map((reward, index) => (
                        <li key={index}>{reward}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    {event.registrationRequired ? (
                      <span className="text-xs text-zinc-400 flex items-center">
                        <FaUsers className="mr-1" /> Registro necessário
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">Sem registro prévio</span>
                    )}
                    <Button>
                      {event.registrationRequired ? 'Registrar Participação' : 'Lembrar-me'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        
        {/* CTA para Discord */}
        <div className="mt-16 bg-indigo-900/30 rounded-lg p-8 border border-indigo-800 text-center">
          <h3 className="text-2xl font-bold mb-3">Não perca nenhum evento!</h3>
          <p className="text-zinc-300 mb-6 max-w-2xl mx-auto">
            Entre no nosso Discord para receber notificações sobre eventos especiais, sorteios e mais!
          </p>
          <Button variant="primary" size="lg">
            <FaDiscord className="mr-2" /> Junte-se ao Discord
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default EventsPage;