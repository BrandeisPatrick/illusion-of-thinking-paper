// Frontend service - uses cached solutions only (no API calls)
import { getCachedSolution, CachedSolution } from './cachedSolutions';

interface Move {
  from: string;
  to: string;
}

interface Usage {
  totalTokens: number;
  reasoningTokens: number;
  inferenceTimeMs: number;
  inputTokens: number;
  outputTokens: number;
}

export interface SolutionResponse {
  moves: Move[];
  usage: Usage;
  modelName: string;
  rawResponse: string;
  prompt: string;
  moveCount: number;
  expectedMoves: number;
  isCorrect: boolean;
}

// Global flag to prevent concurrent calls
let isRequestInProgress = false;

export async function solveTowerOfHanoi(
  numDisks: number,
  useReasoning: boolean,
  modelId: string
): Promise<SolutionResponse> {
  // Prevent concurrent calls
  if (isRequestInProgress) {
    throw new Error('A puzzle is already being solved. Please wait for it to finish.');
  }

  isRequestInProgress = true;

  try {
    // Get cached solution
    const cached = getCachedSolution(modelId, numDisks, useReasoning);

    if (!cached) {
      throw new Error(`No cached solution found for ${modelId}:${numDisks}:${useReasoning}`);
    }

    // Simulate delay based on actual time (capped for UX)
    const simulatedDelay = Math.min(cached.timeSeconds * 100, 3000); // Max 3s
    await new Promise(resolve => setTimeout(resolve, simulatedDelay));

    return {
      moves: cached.moves,
      usage: {
        totalTokens: cached.inputTokens + cached.outputTokens,
        reasoningTokens: cached.reasoningTokens,
        inferenceTimeMs: cached.timeSeconds * 1000,
        inputTokens: cached.inputTokens,
        outputTokens: cached.outputTokens,
      },
      modelName: cached.modelName,
      rawResponse: cached.moves.map(m => `${m.from}→${m.to}`).join('\n'),
      prompt: getPrompt(numDisks),
      moveCount: cached.moveCount,
      expectedMoves: cached.expectedMoves,
      isCorrect: cached.isCorrect,
    };
  } finally {
    isRequestInProgress = false;
  }
}

function getPrompt(numDisks: number): string {
  return `Solve the Tower of Hanoi puzzle with ${numDisks} disks.

RULES:
- There are exactly 3 rods labeled: A, B, and C
- All ${numDisks} disks start on rod A, with the largest (disk ${numDisks}) at the bottom and smallest (disk 1) at the top
- Goal: Move all disks to rod C
- You can only move ONE disk at a time
- You can only move the TOP disk from any rod
- You CANNOT place a larger disk on top of a smaller disk
- Only use rods A, B, or C

OUTPUT REQUIREMENTS - CRITICAL:
- Output ONLY the moves, nothing else
- Do NOT provide explanations, commentary, or questions
- Do NOT ask about list length or whether to print the list
- Do NOT ask any clarifying questions
- Do NOT write anything except the moves
- Output one move per line in this exact format: A→C

EXAMPLE OUTPUT (for 3 disks):
A→C
A→B
C→B
A→C
B→A
B→C
A→C

Now output all moves for ${numDisks} disks. Start immediately with the first move.`;
}
