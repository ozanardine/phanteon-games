import React from 'react';
import Link from 'next/link';
import { FaDiscord, FaTwitter, FaInstagram, FaTwitch } from 'react-icons/fa';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-phanteon-dark border-t border-phanteon-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <img
                src="https://i.imgur.com/PFUYbUz.png"
                alt="Phanteon Games Logo"
                className="h-8 w-auto mr-2"
              />
              <span className="text-white font-bold text-xl">
                <span className="text-phanteon-orange">Phanteon</span> Games
              </span>
            </div>
            <p className="text-gray-400 mb-4">
              Phanteon Games oferece a melhor experiência para jogadores de Rust. Servidores de alta performance, 
              equipe dedicada e comunidade ativa.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://discord.gg/CFc9VrF2Xh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaDiscord size={24} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTwitter size={24} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaInstagram size={24} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTwitch size={24} />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="text-white font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/home" legacyBehavior>
                  <a className="text-gray-400 hover:text-white transition-colors">Início</a>
                </Link>
              </li>
              <li>
                <Link href="/servers" legacyBehavior>
                  <a className="text-gray-400 hover:text-white transition-colors">Servidores</a>
                </Link>
              </li>
              <li>
                <Link href="/vip" legacyBehavior>
                  <a className="text-gray-400 hover:text-white transition-colors">VIP</a>
                </Link>
              </li>
              <li>
                <Link href="/events" legacyBehavior>
                  <a className="text-gray-400 hover:text-white transition-colors">Eventos</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Informações */}
          <div>
            <h3 className="text-white font-semibold mb-4">Informações</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" legacyBehavior>
                  <a className="text-gray-400 hover:text-white transition-colors">Termos de Serviço</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy" legacyBehavior>
                  <a className="text-gray-400 hover:text-white transition-colors">Política de Privacidade</a>
                </Link>
              </li>
              <li>
                <Link href="/refund" legacyBehavior>
                  <a className="text-gray-400 hover:text-white transition-colors">Política de Reembolso</a>
                </Link>
              </li>
              <li>
                <Link href="/faq" legacyBehavior>
                  <a className="text-gray-400 hover:text-white transition-colors">FAQ</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-phanteon-light text-center">
          <p className="text-gray-400">
            &copy; {currentYear} Phanteon Games. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}