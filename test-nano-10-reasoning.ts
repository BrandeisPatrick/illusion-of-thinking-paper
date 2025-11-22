import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function testDebug() {
  console.log('Testing gpt-5-nano with 10 disks (reasoning ON)');
  console.log('='.repeat(60));

  const prompt = `Solve Tower of Hanoi with 10 disks on rods 0,1,2. Start on rod 0, end on rod 2. Return only moves as:
0→2
0→1
2→1
etc.`;

  try {
    console.log('Calling API...');
    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
      max_completion_tokens: 65536,
      reasoning_effort: 'high',
    });

    const duration = Date.now() - startTime;
    console.log(`Response received in ${duration}ms (${Math.round(duration/1000)}s)`);

    console.log('\n--- Full Response Metadata ---');
    console.log('Model:', response.model);
    console.log('Finish reason:', response.choices[0].finish_reason);
    console.log('Usage:', JSON.stringify(response.usage, null, 2));

    const content = response.choices[0].message.content;

    if (!content) {
      console.log('\n--- ERROR: Empty content ---');
      return;
    }

    console.log('\n--- Content Analysis ---');
    console.log('Content length:', content.length);
    console.log('Number of lines:', content.split('\n').length);

    console.log('\n--- First 1000 characters ---');
    console.log(content.substring(0, 1000));

    console.log('\n--- Last 1000 characters ---');
    console.log(content.substring(Math.max(0, content.length - 1000)));

    // Try to parse moves
    console.log('\n--- Parsing Moves ---');
    const moves: any[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/(\d)\s*(?:[→>-]|-?>)\s*(\d)/);
      if (match) {
        const from = parseInt(match[1], 10);
        const to = parseInt(match[2], 10);
        moves.push({ from, to, line: line.trim() });
      }
    }

    console.log(`Found ${moves.length} valid moves`);

    if (moves.length > 0) {
      console.log('\nFirst 10 moves:');
      moves.slice(0, 10).forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.line} -> from:${m.from} to:${m.to}`);
      });

      console.log('\nLast 10 moves:');
      moves.slice(-10).forEach((m, i) => {
        console.log(`  ${moves.length - 10 + i + 1}. ${m.line} -> from:${m.from} to:${m.to}`);
      });
    } else {
      console.log('\nNo moves found. Let\'s check what patterns exist in the content:');

      // Check for any digit patterns
      const digitPatterns = content.match(/\d/g);
      console.log(`Total digits found: ${digitPatterns ? digitPatterns.length : 0}`);

      // Check for arrow patterns
      const arrowPatterns = content.match(/→/g);
      const dashArrowPatterns = content.match(/->/g);
      console.log(`Arrow symbols (→): ${arrowPatterns ? arrowPatterns.length : 0}`);
      console.log(`Dash arrows (->): ${dashArrowPatterns ? dashArrowPatterns.length : 0}`);

      // Sample some lines
      console.log('\nSample of content lines:');
      lines.slice(0, 20).forEach((line, i) => {
        if (line.trim()) {
          console.log(`  ${i + 1}: ${line.substring(0, 100)}`);
        }
      });
    }

  } catch (error: any) {
    console.error('\n--- ERROR ---');
    console.error('Message:', error.message);
    console.error('Full error:', error);
  }
}

testDebug().catch(console.error);
