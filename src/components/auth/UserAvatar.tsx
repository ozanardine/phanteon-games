// src/components/auth/UserAvatar.tsx
import { useState } from 'react';
import Image from 'next/image';
import { UserProfile } from '@/types/auth';
import { FaUser, FaCrown } from 'react-icons/fa';

interface UserAvatarProps {
  user: UserProfile | null;
  size?: 'sm' | 'md' | 'lg';
  showVIPBadge?: boolean;
  className?: string;
}

const UserAvatar = ({ user, size = 'md', showVIPBadge = false, className = '' }: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Definir tamanhos
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };
  
  // Definir tamanhos para o ícone de fallback
  const iconSizeMap = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };
  
  // Verificar se tem VIP
  const hasVIP = user?.subscription && 
    user.subscription.status === 'active' && 
    new Date(user.subscription.currentPeriodEnd) > new Date();
  
  // Determinar a fonte do avatar
  const avatarSrc = user?.avatarUrl || '';
  
  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`relative ${sizeMap[size]} rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center border border-zinc-700`}>
        {!imageError && avatarSrc ? (
          <Image 
            src={avatarSrc}
            alt={user?.firstName || 'User avatar'}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <FaUser className={`text-zinc-400 ${iconSizeMap[size]}`} />
        )}
      </div>
      
      {showVIPBadge && hasVIP && (
        <div className="absolute -top-1 -right-1 bg-amber-500 text-black rounded-full p-0.5">
          <FaCrown size={size === 'lg' ? 16 : 12} />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;