import React from 'react';
import Link from 'next/link';
import { FiGithub, FiTwitter, FiInstagram, FiYoutube, FiTwitch } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-phanteon-dark border-t border-phanteon-light mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              <span className="text-phanteon-orange">Phanteon</span> Games
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Uma comunidade de jogos dedicada a proporcionar a melhor experiência para os jogadores.
            </p>
            <div className="flex space-x-4">
              <a href="https://discord.gg/phanteon" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <FaDiscord className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/phanteongames" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/phanteongames" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <FiInstagram className="w-5 h-5" />
              </a>
              <a href="https://youtube.com/phanteongames" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <FiYoutube className="w-5 h-5" />
              </a>
              <a href="https://twitch.tv/phanteongames" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <FiTwitch className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium text-md mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/servers" className="text-gray-400 hover:text-white text-sm">
                  Servidores
                </Link>
              </li>
              <li>
                <Link href="/vip" className="text-gray-400 hover:text-white text-sm">
                  Planos VIP
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-400 hover:text-white text-sm">
                  Apoie a Comunidade
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/rules" className="text-gray-400 hover:text-white text-sm">
                  Regras
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-medium text-md mb-4">Contato</h4>
            <p className="text-gray-400 text-sm mb-2">
              Tem alguma dúvida ou sugestão?
            </p>
            <Link 
              href="/contact" 
              className="inline-block bg-phanteon-light text-white px-4 py-2 rounded-md text-sm hover:bg-phanteon-light/80 transition"
            >
              Fale Conosco
            </Link>
          </div>
        </div>
        
        <div className="border-t border-phanteon-light mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} Phanteon Games. Todos os direitos reservados.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">
              Privacidade
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}