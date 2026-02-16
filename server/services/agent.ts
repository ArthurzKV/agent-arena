import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

interface AgentCallbacks {
  onProgress: (charCount: number, text: string) => void;
  onComplete: (output: string) => void;
  onError: (error: string) => void;
}

function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  delete env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC;
  delete env.ANTHROPIC_API_KEY;
  return env;
}

export async function runAgent(
  task: string,
  callbacks: AgentCallbacks,
  context?: string,
  signal?: AbortSignal
): Promise<{ output: string; timeMs: number }> {
  const start = Date.now();
  const id = randomUUID().slice(0, 8);

  const env = cleanEnv();
  console.log(`[arena-${id}] Starting agent...${context ? ` (with ${context.length} chars of context)` : ''}`);

  return new Promise((resolve, reject) => {
    let fullPrompt: string;
    const outputInstructions = `Output ONLY the changed files. For each file use this format:

--- path/to/file.ext ---
<full updated file content>
--- end ---

Be concise. Only include files you are modifying. Do NOT create files, do NOT use tools, do NOT run commands.`;

    if (context) {
      fullPrompt = `${task}\n\nCONTEXT from codebase exploration:\n---\n${context}\n---\n\n${outputInstructions}`;
    } else {
      fullPrompt = `${task}\n\n${outputInstructions}`;
    }

    const proc = spawn('claude', [
      '-p', fullPrompt,
      '--output-format', 'text',
      '--model', 'haiku',
      '--dangerously-skip-permissions',
    ], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    let lastReportedLength = 0;

    proc.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      if (output.length - lastReportedLength > 20) {
        lastReportedLength = output.length;
        callbacks.onProgress(output.length, output);
      }
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });

    proc.on('close', (code) => {
      const timeMs = Date.now() - start;
      const trimmed = output.trim();
      console.log(`[arena-${id}] Done (code=${code}) in ${(timeMs/1000).toFixed(1)}s, ${trimmed.length} chars`);
      callbacks.onComplete(trimmed);
      resolve({ output: trimmed, timeMs });
    });

    proc.on('error', (err) => {
      const timeMs = Date.now() - start;
      console.error(`[arena-${id}] Error:`, err.message);
      if (output) {
        callbacks.onComplete(output.trim());
        resolve({ output: output.trim(), timeMs });
      } else {
        callbacks.onError(err.message);
        reject(err);
      }
    });

    // Abort signal — kill process when fight is cancelled
    if (signal) {
      const onAbort = () => {
        const timeMs = Date.now() - start;
        console.log(`[arena-${id}] Aborted, ${output.length} chars`);
        proc.kill();
        callbacks.onComplete(output.trim() || '(cancelled)');
        resolve({ output: output.trim() || '(cancelled)', timeMs });
      };
      if (signal.aborted) { onAbort(); return; }
      signal.addEventListener('abort', onAbort, { once: true });
    }

    // Timeout after 5 minutes
    setTimeout(() => {
      const timeMs = Date.now() - start;
      console.log(`[arena-${id}] Timeout, ${output.length} chars`);
      proc.kill();
      if (output) {
        callbacks.onComplete(output.trim());
        resolve({ output: output.trim(), timeMs });
      } else {
        callbacks.onError('Fight timed out after 5 minutes');
        reject(new Error('timeout'));
      }
    }, 5 * 60 * 1000);
  });
}
