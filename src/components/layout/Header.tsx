// src/components/layout/Header.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FaDiscord, FaSteam, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from '@/components/auth/UserMenu';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Detectar scroll para alterar o estilo do cabeçalho
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Início', path: '/' },
    { name: 'Mapa', path: '/mapa' },
    { name: 'Eventos', path: '/eventos' },
    { name: 'Comunidade', path: '/comunidade' },
    { name: 'VIP', path: '/vip' },
    { name: 'Leaderboard', path: '/leaderboard' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-zinc-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 relative mr-2">
                <Image 
                  src="/logo.png" 
                  alt="Phanteon Games Logo" 
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-xl text-amber-500">PHANTEON GAMES</span>
            </Link>
          </div>
          
          {/* Navegação - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`transition-colors hover:text-amber-500 ${
                  router.pathname === item.path ? 'text-amber-500' : 'text-zinc-200'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* Social/Login - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <a 
              href="/discord" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-200 hover:text-indigo-400 transition-colors"
            >
              <FaDiscord className="w-6 h-6" />
            </a>
            <a 
              href="steam://connect/game.phanteongames.com:28015" 
              className="text-zinc-200 hover:text-blue-400 transition-colors"
            >
              <FaSteam className="w-6 h-6" />
            </a>
            
            {/* Mostrar UserMenu quando autenticado ou botão de login quando não */}
            {!loading && (
              isAuthenticated ? (
                <UserMenu className="ml-2" />
              ) : (
                <Link 
                  href="/auth/login"
                  className="ml-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded transition-colors"
                >
                  Entrar
                </Link>
              )
            )}
          </div>
          
          {/* Botão Mobile */}
          <div className="flex items-center md:hidden">
            {/* Mostrar UserMenu quando autenticado em mobile */}
            {!loading && isAuthenticated && (
              <UserMenu className="mr-2" />
            )}
            
            <button
              type="button"
              className="text-zinc-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`block px-3 py-2 rounded-md ${
                  router.pathname === item.path 
                    ? 'bg-zinc-800 text-amber-500' 
                    : 'text-zinc-200 hover:bg-zinc-800 hover:text-amber-500'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-800">
              <div className="flex space-x-3">
                <a 
                  href="/discord" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-zinc-200 hover:text-indigo-400 transition-colors"
                >
                  <FaDiscord className="w-6 h-6" />
                </a>
                <a 
                  href="steam://connect/game.phanteongames.com:28015" 
                  className="text-zinc-200 hover:text-blue-400 transition-colors"
                >
                  <FaSteam className="w-6 h-6" />
                </a>
              </div>
              
              {/* Mostrar botão de login quando não estiver autenticado em mobile */}
              {!loading && !isAuthenticated && (
                <Link 
                  href="/auth/login"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded transition-colors"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;