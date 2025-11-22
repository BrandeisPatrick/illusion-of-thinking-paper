import OpenAI from 'openai';

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

interface Move {
  from: number;
  to: number;
}

interface SolutionResponse {
  moves: Move[];
}

export async function solveTowerOfHanoi(
  numDisks: number,
  useReasoning: boolean,
  modelId: string
): Promise<SolutionResponse> {
  const prompt = `Solve Tower of Hanoi with ${numDisks} disks on rods 0,1,2. Start on rod 0, end on rod 2. Return only moves as:
0→2
0→1
2→1
etc.`;

  const client = getClient();

  // Check if this is a GPT-5 model (supports reasoning_effort)
  const isGPT5 = modelId.includes('gpt-5');

  const params: any = {
    model: modelId,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_completion_tokens: 65536,
  };

  // GPT-5 models require temperature: 1, others use 0.7
  if (isGPT5) {
    params.temperature = 1;
    params.reasoning_effort = useReasoning ? 'high' : 'minimal';
  } else {
    params.temperature = 0.7;
  }

  const response = await client.chat.completions.create(params);

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  // Parse markdown format: extract all lines with format "0→2", "0→1", etc.
  const moves: Move[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Match patterns like "0→2" or "0 → 2" or "0->2"
    const match = line.match(/(\d)\s*(?:[→>-]|-?>)\s*(\d)/);
    if (match) {
      const from = parseInt(match[1], 10);
      const to = parseInt(match[2], 10);

      // Validate rod numbers
      if (from < 0 || from > 2 || to < 0 || to > 2) {
        throw new Error(`Invalid rod number in move: ${from}→${to}`);
      }

      moves.push({ from, to });
    }
  }

  return { moves };
}
