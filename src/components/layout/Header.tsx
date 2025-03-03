import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaDiscord, FaSignOutAlt, FaBars, FaTimes, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/supabase';

const NavLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ href, children, className = '', onClick }) => {
  const router = useRouter();
  const isActive = router.pathname === href || router.pathname.startsWith(`${href}/`);

  return (
    <Link href={href} legacyBehavior>
      <a
        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
          isActive
            ? 'bg-phanteon-light text-white'
            : 'text-gray-300 hover:text-white hover:bg-phanteon-light/20'
        } ${className}`}
        onClick={onClick}
      >
        {children}
      </a>
    </Link>
  );
};

export function Header() {
  const { user, profile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <header className="bg-phanteon-dark border-b border-phanteon-light sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo e navegação principal */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" legacyBehavior>
                <a className="flex items-center">
                  <img
                    src="https://i.imgur.com/PFUYbUz.png"
                    alt="Phanteon Games Logo"
                    className="h-8 w-auto mr-2"
                  />
                  <span className="text-white font-bold text-xl">
                    <span className="text-phanteon-orange">Phanteon</span> Games
                  </span>
                </a>
              </Link>
            </div>

            {/* Links de navegação desktop */}
            <nav className="hidden md:ml-6 md:flex md:space-x-1">
              <NavLink href="/home">Início</NavLink>
              <NavLink href="/servers">Servidores</NavLink>
              <NavLink href="/vip">VIP</NavLink>
              <NavLink href="/events">Eventos</NavLink>
            </nav>
          </div>

          {/* Botões de ação */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-phanteon-light/20 transition-colors"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username || 'Usuario'}
                      className="h-8 w-8 rounded-full mr-2"
                    />
                  ) : (
                    <FaUserCircle className="h-6 w-6 mr-2" />
                  )}
                  <span className="max-w-[100px] truncate">{profile?.username || 'Usuário'}</span>
                </button>

                {/* Menu do usuário */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-phanteon-gray border border-phanteon-light">
                    <div className="py-1">
                      <Link href="/profile" legacyBehavior>
                        <a className="block px-4 py-2 text-sm text-white hover:bg-phanteon-light/20">
                          Meu Perfil
                        </a>
                      </Link>
                      <Link href="/subscriptions" legacyBehavior>
                        <a className="block px-4 py-2 text-sm text-white hover:bg-phanteon-light/20">
                          Assinaturas
                        </a>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-phanteon-light/20 flex items-center"
                      >
                        <FaSignOutAlt className="mr-2" /> Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" legacyBehavior>
                  <a className="text-gray-300 hover:text-white font-medium">
                    Entrar
                  </a>
                </Link>
                <Link href="/auth/register" legacyBehavior>
                  <a className="bg-phanteon-orange hover:bg-phanteon-orange/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Registrar
                  </a>
                </Link>
              </>
            )}

            <a
              href="https://discord.gg/CFc9VrF2Xh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <FaDiscord className="mr-2" /> Discord
            </a>
          </div>

          {/* Botão de menu mobile */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {isMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-phanteon-gray border-b border-phanteon-light">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink href="/home" onClick={toggleMenu}>
              Início
            </NavLink>
            <NavLink href="/servers" onClick={toggleMenu}>
              Servidores
            </NavLink>
            <NavLink href="/vip" onClick={toggleMenu}>
              VIP
            </NavLink>
            <NavLink href="/events" onClick={toggleMenu}>
              Eventos
            </NavLink>
          </div>
          <div className="pt-4 pb-3 border-t border-phanteon-light">
            <div className="flex items-center px-4">
              {user ? (
                <>
                  <div className="flex-shrink-0">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username || 'Usuario'}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <FaUserCircle className="h-10 w-10 text-gray-300" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">{profile?.username || 'Usuário'}</div>
                    <div className="text-sm font-medium text-gray-400">{user.email}</div>
                  </div>
                </>
              ) : (
                <div className="flex space-x-2">
                  <Link href="/auth/login" legacyBehavior>
                    <a className="text-gray-300 hover:text-white font-medium px-4 py-2 rounded-lg border border-phanteon-light" onClick={toggleMenu}>
                      Entrar
                    </a>
                  </Link>
                  <Link href="/auth/register" legacyBehavior>
                    <a className="bg-phanteon-orange hover:bg-phanteon-orange/90 text-white px-4 py-2 rounded-lg font-medium transition-colors" onClick={toggleMenu}>
                      Registrar
                    </a>
                  </Link>
                </div>
              )}
            </div>
            {user && (
              <div className="mt-3 px-2 space-y-1">
                <Link href="/profile" legacyBehavior>
                  <a className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-phanteon-light/20" onClick={toggleMenu}>
                    Meu Perfil
                  </a>
                </Link>
                <Link href="/subscriptions" legacyBehavior>
                  <a className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-phanteon-light/20" onClick={toggleMenu}>
                    Assinaturas
                  </a>
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    toggleMenu();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-phanteon-light/20 flex items-center"
                >
                  <FaSignOutAlt className="mr-2" /> Sair
                </button>
              </div>
            )}
            <div className="mt-4 px-4 pb-2">
              <a
                href="https://discord.gg/CFc9VrF2Xh"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={toggleMenu}
              >
                <FaDiscord className="mr-2" /> Discord
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}