import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { FaDiscord, FaBars, FaTimes, FaUserCircle } from 'react-icons/fa';

const Navbar = () => {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Toggle menu for mobile
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-dark-300 border-b border-dark-200 sticky top-0 z-50">
      <div className="container-custom mx-auto py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative h-8 w-8">
              <Image 
                src="/logo.svg" 
                alt="Phanteon Games Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold text-white">Phanteon Games</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Início
            </Link>
            <Link href="/planos" className="text-gray-300 hover:text-white transition-colors">
              Planos VIP
            </Link>
            {session && (
              <Link href="/perfil" className="text-gray-300 hover:text-white transition-colors">
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
                        alt={session.user.name} 
                        fill 
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <FaUserCircle className="h-8 w-8 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-300">{session.user.name}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="btn btn-outline text-sm"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('discord')}
                className="btn btn-primary flex items-center space-x-2"
              >
                <FaDiscord className="text-xl" />
                <span>Entrar com Discord</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-4">
              <Link href="/" 
                className="text-gray-300 hover:text-white px-3 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Início
              </Link>
              <Link href="/planos" 
                className="text-gray-300 hover:text-white px-3 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Planos VIP
              </Link>
              {session && (
                <Link href="/perfil" 
                  className="text-gray-300 hover:text-white px-3 py-2"
                  onClick={() => setIsMenuOpen(false)}
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
                          alt={session.user.name} 
                          fill 
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <FaUserCircle className="h-8 w-8 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-300">{session.user.name}</span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="btn btn-outline text-sm mx-3"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn('discord')}
                  className="btn btn-primary flex items-center space-x-2 mx-3 mt-4"
                >
                  <FaDiscord className="text-xl" />
                  <span>Entrar com Discord</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;