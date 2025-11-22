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
  console.log('Testing gpt-5-mini with 10 disks (reasoning OFF)');
  console.log('='.repeat(60));

  const prompt = `Solve Tower of Hanoi with 10 disks on rods 0,1,2. Start on rod 0, end on rod 2. Return only JSON:
{
  "moves": [
    {"from": 0, "to": 1},
    {"from": 0, "to": 2}
  ]
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
      max_completion_tokens: 16384,
      reasoning_effort: 'minimal',
    });

    console.log('\nFull Response Object:');
    console.log(JSON.stringify(response, null, 2));

    const content = response.choices[0].message.content;
    console.log('\n\nMessage Content:');
    console.log(content);

    if (content) {
      console.log('\n\nContent Length:', content.length);
      console.log('First 500 chars:', content.substring(0, 500));
      console.log('Last 500 chars:', content.substring(Math.max(0, content.length - 500)));

      // Try to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('\n\nExtracted JSON:');
        console.log(jsonMatch[0].substring(0, 500));
        console.log('...');
        console.log(jsonMatch[0].substring(Math.max(0, jsonMatch[0].length - 500)));
      }
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testDebug().catch(console.error);
