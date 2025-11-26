// Build cachedSolutions.ts from cached-responses.json
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./cached-responses.json', 'utf8'));

let output = `// Auto-generated cached solutions from OpenAI API
// Generated: ${new Date().toISOString()}

export interface CachedSolution {
  moves: { from: string; to: string }[];
  modelName: string;
  reasoningTokens: number;
  timeSeconds: number;
  inputTokens: number;
  outputTokens: number;
  moveCount: number;
  expectedMoves: number;
  isCorrect: boolean;
}

function parseMoves(movesStr: string): { from: string; to: string }[] {
  if (!movesStr) return [];
  return movesStr.trim().split('\\n').map(line => {
    const match = line.match(/([ABC])→([ABC])/);
    if (match) {
      return { from: match[1], to: match[2] };
    }
    return null;
  }).filter(Boolean) as { from: string; to: string }[];
}

`;

// Generate move constants
data.forEach((r, i) => {
  if (!r.error) {
    const varName = `MOVES_${r.model.replace(/[-.]/g, '_').toUpperCase()}_${r.disks}D_${r.thinking ? 'ON' : 'OFF'}`;
    output += `const ${varName} = \`${r.moves || ''}\`;\n\n`;
  }
});

// Generate the cache object
output += `// Cache key format: "modelId:numDisks:useReasoning"
const CACHED_SOLUTIONS: Record<string, CachedSolution> = {\n`;

data.forEach((r, i) => {
  if (r.error) {
    // Skip errored entries but add a comment
    output += `  // '${r.key}': SKIPPED - ${r.error}\n`;
    return;
  }

  const varName = `MOVES_${r.model.replace(/[-.]/g, '_').toUpperCase()}_${r.disks}D_${r.thinking ? 'ON' : 'OFF'}`;
  const expected = Math.pow(2, r.disks) - 1;
  const isCorrect = r.moveCount === expected;

  output += `  '${r.key}': {
    moves: parseMoves(${varName}),
    modelName: '${r.model}',
    reasoningTokens: ${r.reasoningTokens || 0},
    timeSeconds: ${r.timeSeconds || 0},
    inputTokens: ${r.inputTokens || 0},
    outputTokens: ${r.outputTokens || 0},
    moveCount: ${r.moveCount || 0},
    expectedMoves: ${expected},
    isCorrect: ${isCorrect},
  },\n`;
});

output += `};

export function getCachedSolution(modelId: string, numDisks: number, useReasoning: boolean): CachedSolution | null {
  const key = \`\${modelId}:\${numDisks}:\${useReasoning}\`;
  return CACHED_SOLUTIONS[key] || null;
}

export function getAllCachedKeys(): string[] {
  return Object.keys(CACHED_SOLUTIONS);
}
`;

fs.writeFileSync('./src/services/cachedSolutions.ts', output);
console.log('✅ Generated src/services/cachedSolutions.ts');
console.log(`   ${data.filter(r => !r.error).length} cached solutions`);
