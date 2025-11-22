import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { solveTowerOfHanoi } from '../src/services/openAiService';

// Test configurations
const models = [
  'gpt-5-nano',
  'gpt-5-mini',
];

const testCases = [
  { numDisks: 4, useReasoning: false, description: '4 disks (reasoning OFF - minimal)' },
  { numDisks: 4, useReasoning: true, description: '4 disks (reasoning ON - high)' },
  { numDisks: 7, useReasoning: false, description: '7 disks (reasoning OFF - minimal)' },
  { numDisks: 7, useReasoning: true, description: '7 disks (reasoning ON - high)' },
  { numDisks: 10, useReasoning: false, description: '10 disks (reasoning OFF - minimal)' },
  { numDisks: 10, useReasoning: true, description: '10 disks (reasoning ON - high)' },
];

async function testModel(modelId: string, numDisks: number, useReasoning: boolean) {
  try {
    console.log(`\n🧪 Testing: ${modelId}`);
    console.log(`   Disks: ${numDisks}, Reasoning: ${useReasoning}`);
    console.log(`   Status: Calling API...`);

    const startTime = Date.now();
    const result = await solveTowerOfHanoi(numDisks, useReasoning, modelId);
    const duration = Date.now() - startTime;

    console.log(`   ✅ SUCCESS (${duration}ms)`);
    console.log(`   Moves returned: ${result.moves.length}`);

    return { status: 'success', duration, movesCount: result.moves.length };
  } catch (error: any) {
    console.log(`   ❌ FAILED`);
    console.log(`   Error: ${error.message}`);
    return { status: 'failed', error: error.message };
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('TOWER OF HANOI API TEST SUITE');
  console.log('='.repeat(60));

  const results: any[] = [];

  for (const model of models) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`MODEL: ${model}`);
    console.log(`${'─'.repeat(60)}`);

    for (const testCase of testCases) {
      const result = await testModel(model, testCase.numDisks, testCase.useReasoning);
      results.push({
        model,
        ...testCase,
        ...result,
      });

      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('TEST SUMMARY');
  console.log(`${'='.repeat(60)}`);

  const passed = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);

  if (failed > 0) {
    console.log(`\nFailed Tests:`);
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`  - ${r.model} (${r.description}): ${r.error}`);
    });
  }

  // Detailed results
  console.log(`\nDetailed Results:`);
  results.forEach(r => {
    const status = r.status === 'success' ? '✅' : '❌';
    console.log(`${status} ${r.model} | ${r.description} | ${r.duration || 'N/A'}ms | ${r.movesCount || 'Failed'} moves`);
  });
}

// Run tests
runAllTests().catch(console.error);
