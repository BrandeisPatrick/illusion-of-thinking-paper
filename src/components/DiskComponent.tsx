
import React from 'react';
import { Disk } from '../types';

interface DiskProps {
  disk: Disk;
  totalDisks: number;
  isTop: boolean;
  isSelected: boolean;
}

export const DiskComponent: React.FC<DiskProps> = ({ disk, totalDisks, isTop, isSelected }) => {
  const minWidth = 25;
  const maxWidth = 100;
  const widthPercentage = totalDisks === 1 
    ? 50 
    : minWidth + ((disk.size - 1) / (totalDisks - 1)) * (maxWidth - minWidth);

  // Compact height logic:
  // If >= 10 disks: h-5 (mobile), h-6 (desktop)
  // If < 10 disks: h-6 (mobile), h-8 (desktop)
  // This reduces "white space" compared to the previous h-4 logic.
  const heightClass = totalDisks >= 10 ? 'h-5 sm:h-6' : 'h-6 sm:h-8';

  return (
    <div
      className={`
        relative ${heightClass} transition-transform duration-100
        flex items-center justify-center z-10
        border-2 border-black rounded-lg
        ${disk.color}
        ${isSelected ? '-translate-y-2' : ''}
        ${isTop ? 'cursor-pointer' : ''}
      `}
      style={{ 
        width: `${widthPercentage}%`,
        boxShadow: isSelected ? 'none' : '4px 4px 0px 0px rgba(0,0,0,1)'
      }}
    >
       {/* Pixel Highlight */}
       <div className="absolute top-1 left-1 w-2 h-1 bg-white/60 rounded-sm" />
    </div>
  );
};
