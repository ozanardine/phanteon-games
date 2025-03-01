// src/components/layout/Footer.tsx
import Link from 'next/link';
import { FaDiscord, FaSteam, FaTwitter, FaInstagram, FaTiktok } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Coluna 1 - Logo e Descrição */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <span className="font-bold text-xl text-amber-500">PHANTEON GAMES</span>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              A melhor comunidade brasileira de jogos. Membros ativos, eventos exclusivos e benefícios VIP.
            </p>
            <div className="flex space-x-4">
              <a 
                href="/discord" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-indigo-400 transition-colors"
              >
                <FaDiscord className="w-6 h-6" />
              </a>
              <a 
                href="steam://connect/game.phanteongames.com:28015" 
                className="text-zinc-400 hover:text-blue-400 transition-colors"
              >
                <FaSteam className="w-6 h-6" />
              </a>
              <a 
                href="https://twitter.com/phanteongames" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-blue-500 transition-colors"
              >
                <FaTwitter className="w-6 h-6" />
              </a>
              <a 
                href="https://instagram.com/phanteongames" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-pink-600 transition-colors"
              >
                <FaInstagram className="w-6 h-6" />
              </a>
              <a 
                href="https://tiktok.com/@phanteongames" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <FaTiktok className="w-6 h-6" />
              </a>
            </div>
          </div>
          
          {/* Coluna 2 - Links de Navegação */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navegação</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-zinc-400 hover:text-amber-500 transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/mapa" className="text-zinc-400 hover:text-amber-500 transition-colors">
                  Mapa
                </Link>
              </li>
              <li>
                <Link href="/eventos" className="text-zinc-400 hover:text-amber-500 transition-colors">
                  Eventos
                </Link>
              </li>
              <li>
                <Link href="/comunidade" className="text-zinc-400 hover:text-amber-500 transition-colors">
                  Comunidade
                </Link>
              </li>
              <li>
                <Link href="/vip" className="text-zinc-400 hover:text-amber-500 transition-colors">
                  VIP
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Coluna 3 - Links do Servidor */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Servidor</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/regras" className="text-zinc-400 hover:text-amber-500 transition-colors">
                  Regras
                </Link>
              </li>
              <li>
                <Link href="/wipe" className="text-zinc-400 hover:text-amber-500 transition-colors">
                  Calendário de Wipe
                </Link>
              </li>
              <li>
                <Link href="/staff" className="text-zinc-400 hover:text-amber-500 transition-colors">
                  Equipe
                </Link>
              </li>
              <li>
                <a 
                  href="/discord" 
                  className="text-zinc-400 hover:text-amber-500 transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a 
                  href="steam://connect/game.phanteongames.com:28015" 
                  className="text-zinc-400 hover:text-amber-500 transition-colors"
                >
                  Conectar via Steam
                </a>
              </li>
            </ul>
          </div>
          
          {/* Coluna 4 - Conectar */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Conectar</h3>
            <div className="bg-zinc-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-zinc-300 mb-2">Endereço do Servidor:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value="game.phanteongames.com:28015"
                  readOnly
                  className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-300 w-full"
                />
                <button
                  onClick={() => navigator.clipboard.writeText('game.phanteongames.com:28015')}
                  className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded px-3 py-2 text-sm"
                >
                  Copiar
                </button>
              </div>
            </div>
            <a
              href="steam://connect/game.phanteongames.com:28015"
              className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 px-4 rounded transition-colors"
            >
              Conectar Agora
            </a>
          </div>
        </div>
        
        {/* Rodapé de Copyright */}
        <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
          <p className="text-zinc-500 text-sm">
            &copy; {new Date().getFullYear()} Phanteon Games. Todos os direitos reservados.
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            Ativos e marcas registradas do jogo são propriedade de seus respectivos donos. Este site não é afiliado, endossado ou oficialmente conectado a nenhum desenvolvedor de jogos.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;