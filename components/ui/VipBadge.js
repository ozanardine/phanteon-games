import React from 'react';
import Image from 'next/image';

const badgeMapping = {
  'vip-basic': {
    src: '/badges/badge_basic.svg',
    alt: 'VIP Bronze',
    tooltip: 'Assinante VIP Bronze'
  },
  'vip-plus': {
    src: '/badges/badge_plus.svg',
    alt: 'VIP Prata',
    tooltip: 'Assinante VIP Prata'
  },

};

const VipBadge = ({
  plan = 'vip-basic',
  size = 32,
  className = '',
  withTooltip = true,
  ...props
}) => {
  const badge = badgeMapping[plan] || badgeMapping['vip-basic'];
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      {...(withTooltip ? {
        'data-tip': badge.tooltip,
        'data-for': 'tooltip'
      } : {})}
      {...props}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <Image
          src={badge.src}
          alt={badge.alt}
          width={size}
          height={size}
          className="transition-all duration-300 hover:scale-110"
        />
      </div>
    </div>
  );
};

export default VipBadge;
