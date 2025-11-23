import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

interface Move {
  from: string;
  to: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment (server-side only)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { numDisks, useReasoning, modelId } = req.body;

    // Validate input
    if (!numDisks || !modelId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (numDisks < 1 || numDisks > 15) {
      return res.status(400).json({ error: 'numDisks must be between 1 and 15' });
    }

    // Initialize OpenAI client (no dangerouslyAllowBrowser needed on server)
    const client = new OpenAI({ apiKey });

    const prompt = `Solve the Tower of Hanoi puzzle with ${numDisks} disks.

IMPORTANT CONSTRAINTS:
- There are exactly 3 rods labeled: A, B, and C
- All disks start on rod A
- Goal: Move all disks to rod C
- You can only use rods A, B, or C (no other rod labels exist)

Return ONLY the moves, one per line, in this exact format:
A→C
A→B
C→B

Do not use any rod labels other than A, B, or C.`;

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

    const startTime = Date.now();
    const response = await client.chat.completions.create(params);
    const inferenceTimeMs = Date.now() - startTime;

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse markdown format: extract all lines with format "0→2", "0→1", etc.
    const moves: Move[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      // Match patterns like "A→C" or "A → C" or "A->C"
      const match = line.match(/([ABC])\s*(?:[→>-]|-?>)\s*([ABC])/);
      if (match) {
        const from = match[1];
        const to = match[2];

        // Validate rod labels
        if (!['A', 'B', 'C'].includes(from) || !['A', 'B', 'C'].includes(to)) {
          throw new Error(`Invalid rod label in move: ${from}→${to}`);
        }

        moves.push({ from, to });
      }
    }

    // Extract usage stats from OpenAI response
    const usage = {
      totalTokens: response.usage?.total_tokens || 0,
      reasoningTokens: response.usage?.completion_tokens_details?.reasoning_tokens || 0,
      inferenceTimeMs
    };

    return res.status(200).json({
      moves,
      usage,
      modelName: modelId,
      rawResponse: content
    });
  } catch (error: any) {
    console.error('Error solving Tower of Hanoi:', error);
    return res.status(500).json({
      error: error.message || 'Failed to solve Tower of Hanoi'
    });
  }
}
