import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import { runAgent } from '../services/agent.js';
import { judgeOutputs } from '../services/judge.js';
import { saveFight } from '../services/store.js';
import type { Fight, FightRecord } from '../types.js';

const router = Router();
const fights = new Map<string, Fight>();
const abortControllers = new Map<string, AbortController>();

// Track live progress per fight (not on the Fight type itself)
const liveProgress = new Map<string, { leftChars: number; rightChars: number; leftDone: boolean; rightDone: boolean }>();

router.post('/api/fight', (req: Request, res: Response) => {
  const { task, context } = req.body;
  if (!task || typeof task !== 'string') {
    res.status(400).json({ error: 'task is required' });
    return;
  }

  const id = randomUUID().slice(0, 8);
  const fight: Fight = {
    id,
    task,
    context: typeof context === 'string' ? context : undefined,
    status: 'waiting',
    fighter1: null,
    fighter2: null,
    verdict: null,
    timestamp: new Date().toISOString(),
    listeners: new Set(),
  };
  fights.set(id, fight);
  liveProgress.set(id, { leftChars: 0, rightChars: 0, leftDone: false, rightDone: false });

  startFight(fight);

  res.json({ fightId: id });
});

router.get('/api/fight/:id/stream', (req: Request, res: Response) => {
  const fight = fights.get(req.params.id as string);
  if (!fight) {
    res.status(404).json({ error: 'fight not found' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (event: string, data: unknown) => {
    res.write(`data: ${JSON.stringify({ event, ...data as object })}\n\n`);
  };

  send('status', { status: fight.status });
  fight.listeners.add(send);

  req.on('close', () => {
    fight.listeners.delete(send);
  });
});

// Returns all fights that are active OR recently completed (last 60s)
router.get('/api/active-fights', (_req: Request, res: Response) => {
  const now = Date.now();
  const result: any[] = [];

  for (const [id, fight] of fights) {
    const age = now - new Date(fight.timestamp).getTime();
    // Skip old completed fights (older than 60s after completion)
    if (fight.status === 'done' && age > 120_000) continue;

    const progress = liveProgress.get(id);
    result.push({
      id,
      task: fight.task,
      status: fight.status,
      hasContext: !!fight.context,
      startTime: fight.timestamp,
      agents: [
        {
          name: 'Agent Alpha',
          status: progress?.leftDone ? 'done' : (fight.status === 'done' ? 'done' : 'running'),
          chars: progress?.leftChars || fight.fighter1?.output?.length || 0,
        },
        {
          name: 'Agent Omega',
          status: progress?.rightDone ? 'done' : (fight.status === 'done' ? 'done' : 'running'),
          chars: progress?.rightChars || fight.fighter2?.output?.length || 0,
        },
      ],
    });
  }

  res.json(result);
});

// Cancel a running fight
router.post('/api/fight/:id/cancel', (req: Request, res: Response) => {
  const fight = fights.get(req.params.id as string);
  if (!fight) {
    res.status(404).json({ error: 'fight not found' });
    return;
  }
  const ac = abortControllers.get(fight.id);
  if (ac) {
    ac.abort();
    abortControllers.delete(fight.id);
  }
  fight.status = 'cancelled';
  broadcast(fight, 'cancelled', {});
  res.json({ ok: true });
});

async function startFight(fight: Fight) {
  fight.status = 'fighting';
  broadcast(fight, 'status', { status: 'fighting' });

  const progress = liveProgress.get(fight.id)!;
  const ac = new AbortController();
  abortControllers.set(fight.id, ac);

  const [result1, result2] = await Promise.all([
    runAgent(fight.task, {
      onProgress: (chars, text) => {
        progress.leftChars = chars;
        broadcast(fight, 'progress', { agent: 'left', chars, output: text });
      },
      onComplete: (output) => {
        progress.leftDone = true;
        broadcast(fight, 'complete', { agent: 'left', output });
      },
      onError: (msg) => broadcast(fight, 'error', { agent: 'left', message: msg }),
    }, fight.context, ac.signal),
    runAgent(fight.task, {
      onProgress: (chars, text) => {
        progress.rightChars = chars;
        broadcast(fight, 'progress', { agent: 'right', chars, output: text });
      },
      onComplete: (output) => {
        progress.rightDone = true;
        broadcast(fight, 'complete', { agent: 'right', output });
      },
      onError: (msg) => broadcast(fight, 'error', { agent: 'right', message: msg }),
    }, fight.context, ac.signal),
  ]);

  abortControllers.delete(fight.id);

  // If cancelled, don't proceed to judging
  if (ac.signal.aborted) return;

  fight.fighter1 = { output: result1.output, toolCalls: [], timeMs: result1.timeMs };
  fight.fighter2 = { output: result2.output, toolCalls: [], timeMs: result2.timeMs };

  // Judge phase
  fight.status = 'judging';
  broadcast(fight, 'status', { status: 'judging' });

  const verdict = await judgeOutputs(fight.task, result1.output, result2.output);
  fight.verdict = verdict;
  fight.status = 'done';

  broadcast(fight, 'verdict', {
    verdict,
    fighter1: { timeMs: result1.timeMs, outputLength: result1.output.length },
    fighter2: { timeMs: result2.timeMs, outputLength: result2.output.length },
  });

  // Persist
  const record: FightRecord = {
    id: fight.id,
    task: fight.task,
    timestamp: fight.timestamp,
    winner: verdict.winner,
    fighter1: { ...fight.fighter1, scores: verdict.fighter1 },
    fighter2: { ...fight.fighter2, scores: verdict.fighter2 },
    reasoning: verdict.reasoning,
    knockout: verdict.knockout,
  };
  saveFight(record);

  // Clean up old fights after 2 minutes
  setTimeout(() => {
    fights.delete(fight.id);
    liveProgress.delete(fight.id);
  }, 120_000);
}

function broadcast(fight: Fight, event: string, data: unknown) {
  for (const listener of fight.listeners) {
    listener(event, data);
  }
}

export default router;
