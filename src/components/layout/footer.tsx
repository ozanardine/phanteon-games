"use client";

import Link from "next/link";
import { FaDiscord, FaTwitter, FaInstagram, FaEnvelope } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-military-green text-white">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Sobre */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 text-white font-bold text-xl mb-4">
              <span className="text-intense-orange">Phanter</span>
              <span>Ops</span>
            </Link>
            <p className="text-sm text-gray-300 mb-4">
              Proporcionando a melhor experiência em servidores de jogos online com acesso VIP e recursos exclusivos.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-intense-orange transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/servidores" className="text-gray-300 hover:text-intense-orange transition-colors">
                  Servidores
                </Link>
              </li>
              <li>
                <Link href="/planos" className="text-gray-300 hover:text-intense-orange transition-colors">
                  Planos VIP
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="text-lg font-bold mb-4">Suporte</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-intense-orange transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-gray-300 hover:text-intense-orange transition-colors">
                  Contato
                </Link>
              </li>
              <li>
                <Link href="/termos" className="text-gray-300 hover:text-intense-orange transition-colors">
                  Termos de Serviço
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes Sociais */}
          <div>
            <h3 className="text-lg font-bold mb-4">Conecte-se</h3>
            <div className="flex space-x-4 mb-4">
              <a href="https://discord.gg/phanter-ops" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-intense-orange" aria-label="Discord">
                <FaDiscord className="h-6 w-6" />
              </a>
              <a href="https://twitter.com/phanterops" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-intense-orange" aria-label="Twitter">
                <FaTwitter className="h-6 w-6" />
              </a>
              <a href="https://instagram.com/phanterops" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-intense-orange" aria-label="Instagram">
                <FaInstagram className="h-6 w-6" />
              </a>
              <a href="mailto:contato@phanterops.com" className="text-gray-300 hover:text-intense-orange" aria-label="Email">
                <FaEnvelope className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-olive-green pt-6 mt-8 text-center text-sm text-gray-400">
          <p>© {currentYear} Phanter Ops. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
} 