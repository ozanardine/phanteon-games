import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaDiscord, FaSteam, FaTwitter, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark-400 border-t border-dark-300 pt-10 pb-6">
      <div className="container-custom mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative h-10 w-10">
                <Image 
                  src="/logo.png" 
                  alt="Phanteon Games Logo"
                  fill 
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white">Phanteon Games</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Comunidade gamer Brasileira que se dedica a proporcionar uma experiência de jogo inesquecível.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://discord.gg/v8575VMgPW"
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <FaDiscord className="h-6 w-6" />
              </a>
              <a 
                href="https://store.steampowered.com/app/252490/Rust/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <FaSteam className="h-6 w-6" />
              </a>
              <a 
                href="https://twitter.com/phanteongames" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <FaTwitter className="h-6 w-6" />
              </a>
              <a 
                href="https://instagram.com/phanteongames" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <FaInstagram className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          {/* Links */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Links Úteis</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-primary transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/planos" className="text-gray-400 hover:text-primary transition-colors">
                  Planos VIP
                </Link>
              </li>
              <li>
                <Link href="/perfil" className="text-gray-400 hover:text-primary transition-colors">
                  Meu Perfil
                </Link>
              </li>
              <li>
                <a 
                  href="https://discord.gg/v8575VMgPW" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>
          
          {/* Server Info */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Servidor</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">
                <span className="text-white">IP:</span> 82.29.62.21:28015
              </li>
              <li className="text-gray-400">
                <span className="text-white">Discord:</span> discord.gg/v8575VMgPW
              </li>
              <li className="text-gray-400">
                <span className="text-white">Wipe:</span> Quinzenal
              </li>
              <li className="text-gray-400">
                <span className="text-white">Mapa:</span> 4000
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Contato</h3>
            <p className="text-gray-400 mb-4">
              Tem alguma dúvida ou problema? Entre em contato conosco.
            </p>
            <a 
              href="mailto:suporte@phanteongames.com"
              className="text-primary hover:underline"
            >
              suporte@phanteongames.com
            </a>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-dark-300 mt-8 pt-6 text-center text-gray-500 text-sm">
          <p>© {currentYear} Phanteon Games. Todos os direitos reservados.</p>
          <p className="mt-1">
            Rust é uma marca registrada da Facepunch Studios. Este site não é afiliado ou endossado pela Facepunch.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;