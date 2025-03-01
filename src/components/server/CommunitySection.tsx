// src/components/server/CommunitySection.tsx
import { FaDiscord, FaUsers, FaCalendarAlt, FaComments } from 'react-icons/fa';

const CommunitySection = () => {
  const communityFeatures = [
    {
      icon: <FaDiscord className="w-8 h-8 text-indigo-400" />,
      title: 'Servidor Discord Ativo',
      description: 'Junte-se a mais de 3500 jogadores em nosso servidor Discord. Organize equipes, participe de eventos e fique por dentro das novidades.'
    },
    {
      icon: <FaUsers className="w-8 h-8 text-green-400" />,
      title: 'Comunidade Acolhedora',
      description: 'Nossa comunidade é conhecida por ser amigável com novos jogadores. Encontre aliados, aprenda estratégias e divirta-se em um ambiente saudável.'
    },
    {
      icon: <FaCalendarAlt className="w-8 h-8 text-amber-400" />,
      title: 'Eventos Semanais',
      description: 'Participe de eventos exclusivos com premiações incríveis. Caças ao tesouro, raids PvP, competições de construção e muito mais.'
    },
    {
      icon: <FaComments className="w-8 h-8 text-blue-400" />,
      title: 'Suporte Dedicado',
      description: 'Nossa equipe de administradores está sempre disponível para ajudar. Conte conosco para resolver problemas e garantir uma experiência justa para todos.'
    }
  ];

  const testimonials = [
    {
      name: 'RustPlayer1337',
      quote: 'Melhor servidor BR que já joguei. Administração presente e comunidade muito unida!',
      avatar: '/images/avatar1.jpg',
      hours: 2340
    },
    {
      name: 'SurvivorBR',
      quote: 'Eventos incríveis e premiações que valem a pena. Recomendo para todos que querem uma experiência completa de Rust.',
      avatar: '/images/avatar2.jpg',
      hours: 1852
    },
    {
      name: 'RaidQueen',
      quote: 'Depois que comecei a jogar nesse servidor, não consigo mais jogar em outro. A comunidade é simplesmente incrível.',
      avatar: '/images/avatar3.jpg',
      hours: 3271
    }
  ];

  return (
    <div className="space-y-16">
      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {communityFeatures.map((feature, index) => (
          <div key={index} className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 transition-transform hover:transform hover:-translate-y-1">
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-zinc-400">{feature.description}</p>
          </div>
        ))}
      </div>
      
      {/* Discord CTA */}
      <div className="bg-indigo-900/30 rounded-lg p-8 border border-indigo-800">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:mr-8">
            <h3 className="text-2xl font-bold mb-2">Junte-se ao nosso Discord</h3>
            <p className="text-zinc-300">
              Conheça outros jogadores, participe de sorteios exclusivos e fique por dentro das novidades do servidor.
            </p>
          </div>
          <a 
            href="/discord" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors flex items-center"
          >
            <FaDiscord className="mr-2 h-5 w-5" />
            Entrar no Discord
          </a>
        </div>
      </div>
      
      {/* Community Testimonials */}
      <div>
        <h3 className="text-2xl font-bold mb-8 text-center">O que os jogadores dizem</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-300 mr-4">
                  <span className="text-lg font-bold">{testimonial.name.charAt(0)}</span>
                </div>
                <div>
                  <h4 className="font-bold">{testimonial.name}</h4>
                  <p className="text-xs text-zinc-500">{testimonial.hours} horas em Rust</p>
                </div>
              </div>
              <p className="text-zinc-300 italic">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunitySection;