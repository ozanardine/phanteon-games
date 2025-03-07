import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { FaDiscord, FaBars, FaTimes, FaUserCircle } from 'react-icons/fa';
import { useRouter } from 'next/router';

const Navbar = () => {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const router = useRouter();

  // Toggle menu for mobile
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Fecha o menu ao navegar para outra página
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMenuOpen(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  // Gerencia o foco quando o menu é aberto/fechado
  useEffect(() => {
    if (isMenuOpen && menuRef.current) {
      // Pega o primeiro link do menu mobile
      const firstLink = menuRef.current.querySelector('a');
      if (firstLink) {
        firstLink.focus();
      }
    } else if (!isMenuOpen && buttonRef.current) {
      // Retorna o foco ao botão de menu
      buttonRef.current.focus();
    }
  }, [isMenuOpen]);

  // Fecha o menu ao pressionar ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isMenuOpen]);

  // Função para verificar se estamos na página atual
  const isCurrentPage = (path) => {
    return router.pathname === path;
  };

  return (
    <nav className="bg-dark-300 border-b border-dark-200 sticky top-[52px] z-40" role="navigation" aria-label="Navegação principal">
      <div className="container-custom mx-auto py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark-300 rounded-md" aria-label="Ir para página inicial">
            <div className="relative h-8 w-8">
              <Image 
                src="/logo.png" 
                alt="Phanteon Games Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold text-white">Phanteon Games</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6" role="menubar">
            <Link 
              href="/" 
              className={`text-white hover:text-primary transition-colors py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${isCurrentPage('/') ? 'font-semibold text-primary' : ''}`}
              role="menuitem"
              aria-current={isCurrentPage('/') ? 'page' : undefined}
            >
              Início
            </Link>
            <Link 
              href="/servers" 
              className={`text-white hover:text-primary transition-colors py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${isCurrentPage('/servers') ? 'font-semibold text-primary' : ''}`}
              role="menuitem"
              aria-current={isCurrentPage('/servers') ? 'page' : undefined}
            >
              Servidores
            </Link>
            <Link 
              href="/planos" 
              className={`text-white hover:text-primary transition-colors py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${isCurrentPage('/planos') ? 'font-semibold text-primary' : ''}`}
              role="menuitem"
              aria-current={isCurrentPage('/planos') ? 'page' : undefined}
            >
              Planos VIP
            </Link>
            {session && (
              <Link 
                href="/perfil" 
                className={`text-white hover:text-primary transition-colors py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${isCurrentPage('/perfil') ? 'font-semibold text-primary' : ''}`}
                role="menuitem"
                aria-current={isCurrentPage('/perfil') ? 'page' : undefined}
              >
                Meu Perfil
              </Link>
            )}
          </div>

          {/* Auth Button */}
          <div className="hidden md:block">
            {session ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {session.user.image ? (
                    <div className="relative h-8 w-8 rounded-full overflow-hidden">
                      <Image 
                        src={session.user.image} 
                        alt={`Avatar de ${session.user.name}`}
                        fill 
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <FaUserCircle className="h-8 w-8 text-gray-400" aria-hidden="true" />
                  )}
                  <span className="text-sm text-white">{session.user.name}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="btn btn-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Sair da conta"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('discord')}
                className="btn btn-primary flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Entrar com Discord"
              >
                <FaDiscord className="text-xl" aria-hidden="true" />
                <span>Entrar com Discord</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              ref={buttonRef}
              onClick={toggleMenu}
              className="text-white hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-md p-2"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {isMenuOpen ? (
                <FaTimes className="h-6 w-6" aria-hidden="true" />
              ) : (
                <FaBars className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          id="mobile-menu"
          ref={menuRef}
          className={`md:hidden mt-4 pb-4 ${isMenuOpen ? 'block' : 'hidden'}`}
          role="menu"
        >
          <div className="flex flex-col space-y-4">
            <Link 
              href="/" 
              className={`text-white hover:text-primary px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${isCurrentPage('/') ? 'font-semibold text-primary' : ''}`}
              onClick={() => setIsMenuOpen(false)}
              role="menuitem"
              aria-current={isCurrentPage('/') ? 'page' : undefined}
            >
              Início
            </Link>
            <Link 
              href="/servers" 
              className={`text-white hover:text-primary px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${isCurrentPage('/servers') ? 'font-semibold text-primary' : ''}`}
              onClick={() => setIsMenuOpen(false)}
              role="menuitem"
              aria-current={isCurrentPage('/servers') ? 'page' : undefined}
            >
              Servidores
            </Link>
            <Link 
              href="/planos" 
              className={`text-white hover:text-primary px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${isCurrentPage('/planos') ? 'font-semibold text-primary' : ''}`}
              onClick={() => setIsMenuOpen(false)}
              role="menuitem"
              aria-current={isCurrentPage('/planos') ? 'page' : undefined}
            >
              Planos VIP
            </Link>
            {session && (
              <Link 
                href="/perfil" 
                className={`text-white hover:text-primary px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${isCurrentPage('/perfil') ? 'font-semibold text-primary' : ''}`}
                onClick={() => setIsMenuOpen(false)}
                role="menuitem"
                aria-current={isCurrentPage('/perfil') ? 'page' : undefined}
              >
                Meu Perfil
              </Link>
            )}

            {/* Mobile Auth */}
            {session ? (
              <div className="flex flex-col space-y-4 pt-2 border-t border-dark-200">
                <div className="flex items-center space-x-2 px-3">
                  {session.user.image ? (
                    <div className="relative h-8 w-8 rounded-full overflow-hidden">
                      <Image 
                        src={session.user.image} 
                        alt={`Avatar de ${session.user.name}`}
                        fill 
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <FaUserCircle className="h-8 w-8 text-gray-400" aria-hidden="true" />
                  )}
                  <span className="text-sm text-white">{session.user.name}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="btn btn-outline text-sm mx-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Sair da conta"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('discord')}
                className="btn btn-primary flex items-center space-x-2 mx-3 mt-4 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Entrar com Discord"
              >
                <FaDiscord className="text-xl" aria-hidden="true" />
                <span>Entrar com Discord</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;