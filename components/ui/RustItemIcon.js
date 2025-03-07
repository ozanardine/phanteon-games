import React from 'react';
import Image from 'next/image';

// Mapping of Rust item shortNames to their image paths
const itemIconMapping = {
  // Basic tools and resources
  'hatchet': '/images/items/hatchet.png',
  'pickaxe': '/images/items/pickaxe.png',
  'wood': '/images/items/wood.png',
  'stones': '/images/items/stones.png',
  'metal_fragments': '/images/items/metal_fragments.png',
  'lowgradefuel': '/images/items/lowgradefuel.png',
  
  // Containers and storage
  'smallbackpack': '/images/items/smallbackpack.png',
  'largebackpack': '/images/items/largebackpack.png',
  
  // Building and security
  'furnace': '/images/items/furnace.png',
  'lock.code': '/images/items/lock_code.png',
  
  // Tools and weapons
  'jackhammer': '/images/items/jackhammer.png',
  
  // Medical and food
  'syringe.medical': '/images/items/syringe_medical.png',
  'bearmeat.cooked': '/images/items/bearmeat_cooked.png',
  'pumpkin': '/images/items/pumpkin.png',
  
  // Teas and consumables
  'woodtea.advanced': '/images/items/woodtea_advanced.png',
  'oretea.advanced': '/images/items/oretea_advanced.png',
  'scraptea.advanced': '/images/items/scraptea_advanced.png',
};

/**
 * Component to display Rust item icons with fallback
 */
const RustItemIcon = ({ 
  shortName, 
  size = 32,
  className = '',
  showFallback = true
}) => {
  const iconPath = itemIconMapping[shortName];
  
  // If we don't have an icon mapping and don't want to show fallback
  if (!iconPath && !showFallback) {
    return null;
  }
  
  // If we have an icon mapping, show the image
  if (iconPath) {
    return (
      <div 
        className={`relative ${className}`} 
        style={{ width: size, height: size }}
      >
        <Image
          src={iconPath}
          alt={`Item: ${shortName}`}
          width={size}
          height={size}
          className="object-contain"
        />
      </div>
    );
  }
  
  // Fallback: show a generic icon with the first letter of the item
  return (
    <div 
      className={`bg-dark-300 rounded-md flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="text-gray-400 font-bold text-xs">
        {shortName.charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

export default RustItemIcon;