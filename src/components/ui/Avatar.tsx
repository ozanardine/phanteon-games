import React from 'react';
import Image from 'next/image';

type AvatarProps = {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

export function Avatar({ src, alt = 'Avatar', size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  // Fallback para quando não há imagem
  const fallback = (
    <div 
      className={`${sizeClasses[size]} flex items-center justify-center bg-phanteon-light rounded-full text-white ${className}`}
    >
      {alt.charAt(0).toUpperCase()}
    </div>
  );

  if (!src) {
    return fallback;
  }

  return (
    <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={(e) => {
          // Fallback para quando a imagem falha ao carregar
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    </div>
  );
}