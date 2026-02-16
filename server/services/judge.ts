import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import type { JudgeVerdict } from '../types.js';

function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  delete env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC;
  delete env.ANTHROPIC_API_KEY;
  return env;
}

export async function judgeOutputs(
  task: string,
  output1: string,
  output2: string
): Promise<JudgeVerdict> {
  const id = randomUUID().slice(0, 8);

  const prompt = `You are an expert code judge in a UFC-style coding competition. Two fighters submitted solutions to the same task. Judge them fairly.

TASK: ${task}

FIGHTER 1 OUTPUT:
\`\`\`
${output1}
\`\`\`

FIGHTER 2 OUTPUT:
\`\`\`
${output2}
\`\`\`

Score each fighter on:
- correctness (0-10): Does the code work correctly?
- quality (0-10): Clean, idiomatic, well-structured?
- completeness (0-10): Full solution, handles edge cases?
- style (0-5): Creativity and elegance

Return ONLY valid JSON, no markdown fences, no explanation:
{"winner": 1, "fighter1": {"correctness": 0, "quality": 0, "completeness": 0, "style": 0, "total": 0}, "fighter2": {"correctness": 0, "quality": 0, "completeness": 0, "style": 0, "total": 0}, "reasoning": "why the winner won", "knockout": false}

Set knockout to true if the margin is >= 8 points. Total = sum of all scores (max 35). Winner is 1 or 2.`;

  console.log(`[judge-${id}] Starting judge...`);

  return new Promise((resolve) => {
    const proc = spawn('claude', [
      '-p', prompt,
      '--output-format', 'text',
      '--dangerously-skip-permissions',
    ], {
      env: cleanEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });

    proc.on('close', (code) => {
      console.log(`[judge-${id}] Done (code=${code}), ${output.length} chars`);
      const cleaned = output.trim();
      try {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          resolve(JSON.parse(jsonMatch[0]) as JudgeVerdict);
          return;
        }
      } catch {}
      resolve(defaultVerdict('Could not parse judge output'));
    });

    proc.on('error', () => {
      resolve(defaultVerdict('Judge process failed'));
    });

    setTimeout(() => {
      proc.kill();
      resolve(defaultVerdict('Judge timed out'));
    }, 3 * 60 * 1000);
  });
}

function defaultVerdict(reason: string): JudgeVerdict {
  return {
    winner: 1,
    fighter1: { correctness: 7, quality: 7, completeness: 7, style: 3, total: 24 },
    fighter2: { correctness: 7, quality: 7, completeness: 7, style: 3, total: 24 },
    reasoning: reason,
    knockout: false,
  };
}
