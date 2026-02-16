import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { runAgent } from '../server/services/agent.js';
import { judgeOutputs } from '../server/services/judge.js';
import { saveFight } from '../server/services/store.js';
import type { FightRecord, JudgeVerdict } from '../server/types.js';

export interface FightResult {
  verdict: JudgeVerdict;
  output1: string;
  output2: string;
  time1: number;
  time2: number;
}

export async function runFight(task: string, emitter: EventEmitter): Promise<FightResult> {
  emitter.emit('status', 'fighting');

  const [result1, result2] = await Promise.all([
    runAgent(task, {
      onProgress: (chars, text) => emitter.emit('progress', 'left', chars, text),
      onComplete: (output) => emitter.emit('complete', 'left', output),
      onError: (msg) => emitter.emit('error', 'left', msg),
    }),
    runAgent(task, {
      onProgress: (chars, text) => emitter.emit('progress', 'right', chars, text),
      onComplete: (output) => emitter.emit('complete', 'right', output),
      onError: (msg) => emitter.emit('error', 'right', msg),
    }),
  ]);

  emitter.emit('status', 'judging');

  const verdict = await judgeOutputs(task, result1.output, result2.output);

  emitter.emit('verdict', verdict);
  emitter.emit('status', 'done');

  const record: FightRecord = {
    id: randomUUID().slice(0, 8),
    task,
    timestamp: new Date().toISOString(),
    winner: verdict.winner,
    fighter1: { output: result1.output, toolCalls: [], timeMs: result1.timeMs, scores: verdict.fighter1 },
    fighter2: { output: result2.output, toolCalls: [], timeMs: result2.timeMs, scores: verdict.fighter2 },
    reasoning: verdict.reasoning,
    knockout: verdict.knockout,
  };
  saveFight(record);

  return {
    verdict,
    output1: result1.output,
    output2: result2.output,
    time1: result1.timeMs,
    time2: result2.timeMs,
  };
}
