import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '@/components/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { signOut } from '@/utils/authHelpers';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };
  
  const navLinks = [
    { name: 'Início', href: '/' },
    { name: 'Servidores', href: '/servers' },
    { name: 'VIP', href: '/vip' },
    { name: 'Apoie', href: '/support' },
  ];
  
  return (
    <nav className="bg-phanteon-dark border-b border-phanteon-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-white font-bold text-xl flex items-center">
                <span className="text-phanteon-orange">Phanteon</span>
                <span className="ml-1">Games</span>
              </Link>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    router.pathname === link.href 
                      ? 'text-phanteon-orange bg-phanteon-gray' 
                      : 'text-gray-300 hover:text-white hover:bg-phanteon-gray'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="relative ml-3">
                <div className="flex items-center">
                  <span className="mr-3 text-sm text-gray-300">
                    {user?.username || user?.email}
                  </span>
                  
                  <Link href="/profile">
                    <Avatar 
                      src={user?.avatar_url || null} 
                      alt={user?.username || 'User'} 
                    />
                  </Link>
                  
                  <button
                    className="ml-4 text-sm text-gray-400 hover:text-white"
                    onClick={handleSignOut}
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login" 
                  className="text-gray-300 hover:text-white text-sm font-medium"
                >
                  Entrar
                </Link>
                <Link 
                  href="/register" 
                  className="bg-phanteon-orange text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-phanteon-orange/90"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-400 hover:text-white p-2"
            >
              {isOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                router.pathname === link.href 
                  ? 'text-phanteon-orange bg-phanteon-gray' 
                  : 'text-gray-300 hover:text-white hover:bg-phanteon-gray'
              }`}
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          {isAuthenticated ? (
            <div className="pt-4 pb-3 border-t border-phanteon-light">
              <div className="flex items-center px-3">
                <Avatar 
                  src={user?.avatar_url || null} 
                  alt={user?.username || 'User'} 
                />
                <div className="ml-3">
                  <div className="text-base font-medium text-white">
                    {user?.username || user?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link 
                  href="/profile" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-phanteon-gray"
                  onClick={() => setIsOpen(false)}
                >
                  Meu Perfil
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-phanteon-gray"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-phanteon-light">
              <Link 
                href="/login" 
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-phanteon-gray"
                onClick={() => setIsOpen(false)}
              >
                Entrar
              </Link>
              <Link 
                href="/register" 
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-phanteon-gray"
                onClick={() => setIsOpen(false)}
              >
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
