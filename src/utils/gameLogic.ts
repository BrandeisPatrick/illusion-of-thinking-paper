import { Disk, GameState, RodId } from '../types';

// Retro Pixel Art Palette
const DISK_COLORS = [
  'bg-red-500',
  'bg-orange-400',
  'bg-amber-300', // Lighter yellow
  'bg-yellow-400',
  'bg-lime-400',
  'bg-green-500',
  'bg-emerald-600',
  'bg-cyan-400',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-fuchsia-500',
];

export const createInitialState = (diskCount: number): GameState => {
  const initialDisks: Disk[] = [];
  // Stack logic: Index 0 is bottom (largest), Index N is top (smallest)
  for(let s = diskCount; s >= 1; s--) {
     initialDisks.push({
        id: s,
        size: s,
        color: DISK_COLORS[(diskCount - s) % DISK_COLORS.length]
     });
  }

  return {
    rods: {
      A: initialDisks,
      B: [],
      C: [],
    },
    moveCount: 0,
    isComplete: false,
    startTime: null,
    selectedRodId: null,
    diskCount,
  };
};

export const canMoveDisk = (fromRod: Disk[], toRod: Disk[]): boolean => {
  if (fromRod.length === 0) return false;
  if (toRod.length === 0) return true;

  const diskToMove = fromRod[fromRod.length - 1];
  const topDiskOnTarget = toRod[toRod.length - 1];

  return diskToMove.size < topDiskOnTarget.size;
};

export const checkWinCondition = (rods: Record<RodId, Disk[]>, totalDisks: number): boolean => {
  return rods['C'].length === totalDisks;
};
