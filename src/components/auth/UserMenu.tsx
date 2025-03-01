// src/components/auth/UserMenu.tsx
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import UserAvatar from './UserAvatar';
import { FaUser, FaCog, FaCrown, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';

interface UserMenuProps {
  className?: string;
}

const UserMenu = ({ className = '' }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, signOut, hasActiveSubscription, isAdmin } = useAuth();
  const router = useRouter();
  
  // Fechar o menu ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.push('/');
  };
  
  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-zinc-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <UserAvatar user={user} size="sm" showVIPBadge />
        <span className="hidden md:block max-w-[100px] truncate">
          {user?.firstName || user?.discordUsername || 'Usuário'}
        </span>
        <FaChevronDown className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-zinc-800 border border-zinc-700 z-50">
          <div className="px-4 py-3 border-b border-zinc-700">
            <p className="text-sm leading-5 font-medium text-zinc-200">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.discordUsername || user?.steamUsername || 'Usuário'
              }
            </p>
            <p className="text-xs leading-4 text-zinc-400 truncate">{user?.email}</p>
          </div>
          
          <Link 
            href="/perfil" 
            className="px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center space-x-2"
            onClick={() => setIsOpen(false)}
          >
            <FaUser />
            <span>Meu Perfil</span>
          </Link>
          
          {hasActiveSubscription ? (
            <Link 
              href="/vip/dashboard" 
              className="px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center space-x-2"
              onClick={() => setIsOpen(false)}
            >
              <FaCrown className="text-amber-500" />
              <span>Painel VIP</span>
            </Link>
          ) : (
            <Link 
              href="/vip" 
              className="px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center space-x-2"
              onClick={() => setIsOpen(false)}
            >
              <FaCrown className="text-zinc-400" />
              <span>Obter VIP</span>
            </Link>
          )}
          
          {isAdmin && (
            <Link 
              href="/admin" 
              className="px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center space-x-2"
              onClick={() => setIsOpen(false)}
            >
              <FaCog />
              <span>Painel Admin</span>
            </Link>
          )}
          
          <div className="border-t border-zinc-700">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-700 flex items-center space-x-2"
            >
              <FaSignOutAlt />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;