import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

interface Move {
  from: number;
  to: number;
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

    const prompt = `Solve Tower of Hanoi with ${numDisks} disks on rods 0,1,2. Start on rod 0, end on rod 2. Return only moves as:
0→2
0→1
2→1
etc.`;

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

    return res.status(200).json({ moves });
  } catch (error: any) {
    console.error('Error solving Tower of Hanoi:', error);
    return res.status(500).json({
      error: error.message || 'Failed to solve Tower of Hanoi'
    });
  }
}
