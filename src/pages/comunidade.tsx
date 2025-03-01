// src/pages/comunidade.tsx
import React from 'react';
import Image from 'next/image';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import CommunitySection from '../components/server/CommunitySection';
import { FaDiscord, FaTwitter, FaInstagram, FaGamepad, FaUsers, FaComments, FaDonate } from 'react-icons/fa';

const CommunityPage = () => {
  // Equipe administrativa (simulada)
  const staff = [
    {
      id: 1,
      name: 'FundadorRust',
      role: 'Fundador & Admin',
      avatar: '/images/avatars/avatar1.jpg',
      discord: 'FundadorRust#1234',
      steamProfile: 'https://steamcommunity.com/id/fundadorrust',
      description: 'Criador do servidor e principal desenvolvedor dos plugins personalizados.'
    },
    {
      id: 2,
      name: 'ModeradorPRO',
      role: 'Admin',
      avatar: '/images/avatars/avatar2.jpg',
      discord: 'ModeradorPRO#5678',
      steamProfile: 'https://steamcommunity.com/id/moderadorpro',
      description: 'Responsável pelo gerenciamento da comunidade e suporte aos jogadores.'
    },
    {
      id: 3,
      name: 'EventosRust',
      role: 'Moderador de Eventos',
      avatar: '/images/avatars/avatar3.jpg',
      discord: 'EventosRust#9012',
      steamProfile: 'https://steamcommunity.com/id/eventosrust',
      description: 'Responsável pelos eventos semanais e especiais do servidor.'
    },
    {
      id: 4,
      name: 'AntiCheat',
      role: 'Moderador',
      avatar: '/images/avatars/avatar4.jpg',
      discord: 'AntiCheat#3456',
      steamProfile: 'https://steamcommunity.com/id/anticheat',
      description: 'Especialista em detectar cheaters e garantir a integridade do jogo.'
    }
  ];

  // Regras do servidor (simuladas)
  const rules = [
    {
      id: 1,
      title: 'Comportamento',
      items: [
        'Demonstre respeito a todos os jogadores',
        'Racismo, homofobia e discurso de ódio resultam em ban permanente',
        'Evite spam no chat e nos canais de voz',
        'Não use linguagem ofensiva ou agressiva direcionada a outros jogadores'
      ]
    },
    {
      id: 2,
      title: 'Gameplay',
      items: [
        'Uso de cheats/hacks resultará em ban permanente',
        'Exploits do jogo não são permitidos',
        'Não interfira em eventos oficiais do servidor',
        'Respeite as áreas seguras (safe zones)'
      ]
    },
    {
      id: 3,
      title: 'Construção',
      items: [
        'É proibido construir torres excessivamente altas para griefing',
        'Não bloqueie monumentos com construções',
        'Mantenha no máximo 2 bases principais por wipe',
        'Respeite o limite de entidades para evitar lag no servidor'
      ]
    },
    {
      id: 4,
      title: 'Raid & PvP',
      items: [
        'Raid é permitido a qualquer momento',
        'Não é permitido usar bugs para raiding',
        'Offline raiding é permitido, mas desencorajado',
        'Sem stream sniping ou uso de informações de streams para obter vantagem'
      ]
    }
  ];

  // Canais sociais
  const socialChannels = [
    {
      name: 'Discord',
      icon: <FaDiscord className="h-8 w-8 text-indigo-400" />,
      members: '3.521 membros',
      link: '/discord',
      color: 'bg-indigo-600'
    },
    {
      name: 'Twitter',
      icon: <FaTwitter className="h-8 w-8 text-blue-400" />,
      members: '1.245 seguidores',
      link: 'https://twitter.com/phanteongames',
      color: 'bg-blue-500'
    },
    {
      name: 'Instagram',
      icon: <FaInstagram className="h-8 w-8 text-pink-400" />,
      members: '892 seguidores',
      link: 'https://instagram.com/phanteongames',
      color: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500'
    },
  ];

  return (
    <Layout 
      title="Comunidade - Phanteon Games"
      description="Conheça nossa comunidade, equipe e regras do servidor Phanteon Games."
    >
      <div className="container mx-auto px-4 py-8 mt-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nossa Comunidade</h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            O Phanteon Games é mais que um servidor, é uma comunidade de jogadores apaixonados pelo jogo.
            Conheça nossa equipe, regras e como participar.
          </p>
        </div>

        {/* Equipe do Servidor */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center text-amber-500">
            <FaUsers className="mr-3" /> Nossa Equipe
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {staff.map(member => (
              <Card key={member.id} className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-zinc-700">
                  <div className="absolute inset-0 bg-zinc-600 flex items-center justify-center text-2xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-amber-500 text-sm mb-3">{member.role}</p>
                <p className="text-zinc-400 text-sm mb-4">{member.description}</p>
                <div className="flex justify-center space-x-2">
                  <Button variant="outline" size="sm">Discord</Button>
                  <Button variant="outline" size="sm">Steam</Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Canais Sociais */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center text-amber-500">
            <FaComments className="mr-3" /> Canais Sociais
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {socialChannels.map((channel, index) => (
              <a 
                key={index} 
                href={channel.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block hover:transform hover:-translate-y-1 transition-transform"
              >
                <Card className="h-full border-zinc-700 hover:border-zinc-500 transition-colors">
                  <div className={`${channel.color} h-24 flex items-center justify-center rounded-t-lg`}>
                    {channel.icon}
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold mb-2">{channel.name}</h3>
                    <p className="text-zinc-400 text-sm mb-4">{channel.members}</p>
                    <Button fullWidth>Seguir</Button>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </section>

        {/* Regras do Servidor */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center text-amber-500">
            <FaGamepad className="mr-3" /> Regras do Servidor
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rules.map(category => (
              <Card key={category.id}>
                <h3 className="text-xl font-bold mb-4 pb-3 border-b border-zinc-700">
                  {category.title}
                </h3>
                <ul className="space-y-2">
                  {category.items.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block h-6 w-6 rounded-full bg-amber-500 text-black flex-shrink-0 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-zinc-300">{rule}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Button size="lg">Ver Regras Completas</Button>
          </div>
        </section>

        {/* Benefícios da Comunidade */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-amber-500">
            Benefícios da Nossa Comunidade
          </h2>

          <CommunitySection />
        </section>

        {/* Apoie o Servidor */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center text-amber-500">
            <FaDonate className="mr-3" /> Apoie o Servidor
          </h2>

          <Card className="bg-gradient-to-r from-zinc-900 to-zinc-800 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-cover opacity-10" 
                 style={{ backgroundImage: "url('/images/rust-vip.jpg')" }}></div>
            
            <div className="p-8 md:p-12">
              <div className="max-w-2xl">
                <h3 className="text-2xl font-bold mb-4">Ajude a Manter o Servidor</h3>
                <p className="text-zinc-300 mb-6">
                  Nosso servidor é mantido com muito esforço e dedicação. Apoie-nos tornando-se VIP e ajude a manter 
                  a comunidade crescendo com qualidade.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-amber-500 rounded-full h-6 w-6 flex items-center justify-center text-black mt-0.5 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold">Ajude a manter os servidores</h4>
                      <p className="text-zinc-400 text-sm">Servidores de alta performance e proteção contra ataques DDoS.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-amber-500 rounded-full h-6 w-6 flex items-center justify-center text-black mt-0.5 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold">Contribua com o desenvolvimento</h4>
                      <p className="text-zinc-400 text-sm">Plugins exclusivos e desenvolvimento da comunidade.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-amber-500 rounded-full h-6 w-6 flex items-center justify-center text-black mt-0.5 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold">Receba benefícios exclusivos</h4>
                      <p className="text-zinc-400 text-sm">Kits especiais, comandos personalizados e muito mais.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <Button size="lg">Tornar-se VIP</Button>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </Layout>
  );
};

export default CommunityPage;