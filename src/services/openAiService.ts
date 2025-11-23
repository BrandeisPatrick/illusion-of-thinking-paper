// Frontend service - calls our secure backend API instead of OpenAI directly

interface Move {
  from: string;
  to: string;
}

interface Usage {
  totalTokens: number;
  reasoningTokens: number;
  inferenceTimeMs: number;
}

interface SolutionResponse {
  moves: Move[];
  usage: Usage;
  modelName: string;
  rawResponse: string;
}

export async function solveTowerOfHanoi(
  numDisks: number,
  useReasoning: boolean,
  modelId: string
): Promise<SolutionResponse> {
  // Call our backend API endpoint instead of OpenAI directly
  // This keeps the API key secure on the server
  const response = await fetch('/api/solve-tower', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      numDisks,
      useReasoning,
      modelId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to solve Tower of Hanoi' }));
    throw new Error(error.error || 'Failed to solve Tower of Hanoi');
  }

  return response.json();
}
