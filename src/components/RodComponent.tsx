
import React from 'react';
import { Disk, RodId } from '../types';
import { DiskComponent } from './DiskComponent';

interface RodProps {
  id: RodId;
  disks: Disk[];
  totalDisks: number;
  isSelected: boolean;
  isValidTarget: boolean;
  label: string;
  onClick: (id: RodId) => void;
}

export const RodComponent: React.FC<RodProps> = ({ 
  id, 
  disks, 
  totalDisks, 
  isSelected, 
  isValidTarget,
  label,
  onClick 
}) => {
  // Reduce spacing for large number of disks
  const spacingClass = totalDisks >= 8 ? 'space-y-[1px]' : 'space-y-[2px]';

  return (
    <div 
      onClick={() => onClick(id)}
      className={`
        relative flex flex-col items-center justify-end h-full w-full
        cursor-pointer select-none
        transition-colors duration-75
        border-2 border-transparent
        ${isSelected ? 'bg-black/5' : ''}
        ${isValidTarget && !isSelected ? 'bg-green-100 border-dashed border-green-500 rounded-xl' : ''}
        active:bg-black/10 rounded-xl
      `}
    >
      {/* Pillar */}
      <div className={`
        absolute bottom-0 w-4 sm:w-6 h-full bg-black transition-colors rounded-t-lg
        ${isSelected ? 'bg-gray-700' : ''}
        ${isValidTarget ? 'bg-green-700' : ''}
      `}></div>
      
      {/* Base */}
      <div className="absolute bottom-0 w-full h-4 bg-black z-0 rounded-md"></div>

      {/* Disks Container */}
      <div className={`flex flex-col-reverse items-center w-full mb-4 space-y-reverse ${spacingClass} z-10 px-1`}>
        {disks.map((disk, index) => (
          <DiskComponent 
            key={disk.id} 
            disk={disk} 
            totalDisks={totalDisks}
            isTop={index === disks.length - 1}
            isSelected={isSelected && index === disks.length - 1}
          />
        ))}
      </div>

      {/* Label */}
      {label && (
        <div className="absolute -bottom-8 text-black text-xs sm:text-sm font-bold">
          {label}
        </div>
      )}
      
      {/* Click Indicator Overlay */}
      {isValidTarget && (
        <div className="absolute top-0 animate-pulse text-green-600 text-[10px] sm:text-xs bg-white border-2 border-green-600 px-2 py-1 rounded-full">
          DROP
        </div>
      )}
    </div>
  );
};
