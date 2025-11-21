export type RodId = 'A' | 'B' | 'C';

export interface Disk {
  id: number;
  size: number; // 1 is smallest, N is largest
  color: string;
}

export interface GameState {
  rods: Record<RodId, Disk[]>;
  moveCount: number;
  isComplete: boolean;
  startTime: number | null;
  selectedRodId: RodId | null;
  diskCount: number;
}

export interface GeminiHint {
  explanation: string;
  suggestedMove?: {
    from: RodId;
    to: RodId;
  };
}

export interface Move {
  from: RodId;
  to: RodId;
}
