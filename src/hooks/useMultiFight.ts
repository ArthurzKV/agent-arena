import { useState, useEffect, useRef, useCallback } from 'react';

interface Verdict {
  winner: 1 | 2;
  fighter1: { correctness: number; quality: number; completeness: number; style: number; total: number };
  fighter2: { correctness: number; quality: number; completeness: number; style: number; total: number };
  reasoning: string;
  knockout: boolean;
}

interface FighterStats {
  timeMs: number;
  outputLength: number;
}

export type FightStatus = 'gathering' | 'fighting' | 'judging' | 'verdict' | 'cancelled';

export interface GatheringState {
  task: string;
  contextLength: number;
  elapsed: number;
}

export interface FightState {
  id: string;
  task: string;
  status: FightStatus;
  verdict: Verdict | null;
  leftStats: FighterStats | null;
  rightStats: FighterStats | null;
  leftChars: number;
  rightChars: number;
  leftOutput: string;
  rightOutput: string;
  leftDone: boolean;
  rightDone: boolean;
  showOverlay: boolean;
}

export function useMultiFight() {
  const [fights, setFights] = useState<Map<string, FightState>>(new Map());
  const [gathering, setGathering] = useState<GatheringState | null>(null);
  const eventSources = useRef<Map<string, EventSource>>(new Map());
  const knownIds = useRef<Set<string>>(new Set());

  const updateFight = useCallback((id: string, updater: (f: FightState) => FightState) => {
    setFights(prev => {
      const next = new Map(prev);
      const fight = next.get(id);
      if (fight) next.set(id, updater(fight));
      return next;
    });
  }, []);

  const subscribeFight = useCallback((fightId: string, task: string) => {
    if (eventSources.current.has(fightId) || knownIds.current.has(fightId)) return;
    knownIds.current.add(fightId);

    const state: FightState = {
      id: fightId,
      task,
      status: 'fighting',
      verdict: null,
      leftStats: null,
      rightStats: null,
      leftChars: 0,
      rightChars: 0,
      leftOutput: '',
      rightOutput: '',
      leftDone: false,
      rightDone: false,
      showOverlay: true,
    };

    setFights(prev => new Map(prev).set(fightId, state));

    const es = new EventSource(`/api/fight/${fightId}/stream`);
    eventSources.current.set(fightId, es);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      switch (data.event) {
        case 'progress':
          updateFight(fightId, f => ({
            ...f,
            ...(data.agent === 'left'
              ? { leftChars: data.chars, leftOutput: data.output || f.leftOutput }
              : { rightChars: data.chars, rightOutput: data.output || f.rightOutput }),
          }));
          break;
        case 'complete':
          updateFight(fightId, f => ({
            ...f,
            ...(data.agent === 'left'
              ? { leftDone: true, leftOutput: data.output || f.leftOutput }
              : { rightDone: true, rightOutput: data.output || f.rightOutput }),
          }));
          break;
        case 'status':
          if (data.status === 'judging') {
            updateFight(fightId, f => ({ ...f, status: 'judging' }));
          }
          break;
        case 'verdict':
          updateFight(fightId, f => ({
            ...f,
            status: 'verdict',
            verdict: data.verdict,
            leftStats: { timeMs: data.fighter1.timeMs, outputLength: data.fighter1.outputLength },
            rightStats: { timeMs: data.fighter2.timeMs, outputLength: data.fighter2.outputLength },
          }));
          es.close();
          eventSources.current.delete(fightId);
          break;
        case 'cancelled':
          updateFight(fightId, f => ({ ...f, status: 'cancelled' }));
          es.close();
          eventSources.current.delete(fightId);
          break;
      }
    };

    es.onerror = () => {
      es.close();
      eventSources.current.delete(fightId);
    };
  }, [updateFight]);

  // Listen for fight IPC events from Electron
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api) return;

    if (api.onFightTriggered) {
      api.onFightTriggered(({ fightId, task }: { fightId: string; task: string }) => {
        setGathering(null); // Clear gathering state when fight starts
        subscribeFight(fightId, task);
      });
    }

    if (api.onFightGathering) {
      api.onFightGathering(({ task }: { task: string }) => {
        setGathering({ task, contextLength: 0, elapsed: 0 });
      });
    }

    if (api.onFightGatheringProgress) {
      api.onFightGatheringProgress((data: { task: string; contextLength: number; elapsed: number }) => {
        setGathering(data);
      });
    }

    if (api.onFightSkipped) {
      api.onFightSkipped(({ task, reason }: { task: string; reason: string }) => {
        setGathering({ task, contextLength: -1, elapsed: 0, skipped: reason } as any);
        setTimeout(() => setGathering(null), 5000);
      });
    }

    if (api.onFightCancelled) {
      api.onFightCancelled(() => setGathering(null));
    }

    return () => api.removeFightListeners?.();
  }, [subscribeFight]);

  // Also poll for fights (fallback / non-Electron)
  useEffect(() => {
    const poll = () => {
      fetch('/api/active-fights')
        .then(r => r.json())
        .then((active: any[]) => {
          for (const f of active) {
            if (f.status !== 'done') {
              subscribeFight(f.id, f.task);
            }
          }
        })
        .catch(() => {});
    };

    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [subscribeFight]);

  const dismissOverlay = useCallback((id: string) => {
    updateFight(id, f => ({ ...f, showOverlay: false }));
  }, [updateFight]);

  const removeFight = useCallback((id: string) => {
    setFights(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    knownIds.current.delete(id);
    const es = eventSources.current.get(id);
    if (es) {
      es.close();
      eventSources.current.delete(id);
    }
  }, []);

  const startFight = useCallback(async (task: string) => {
    const res = await fetch('/api/fight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    });
    const { fightId } = await res.json();
    subscribeFight(fightId, task);
  }, [subscribeFight]);

  const forceTrigger = useCallback(() => {
    const api = (window as any).electronAPI;
    api?.forceTriggerFight?.();
  }, []);

  const cancelFight = useCallback(() => {
    const api = (window as any).electronAPI;
    api?.cancelFight?.();
    setGathering(null);
  }, []);

  const applySolution = useCallback((output: string, task: string) => {
    const api = (window as any).electronAPI;
    api?.applyFightSolution?.(output, task);
  }, []);

  const stopFight = useCallback(async (id: string) => {
    try {
      await fetch(`/api/fight/${id}/cancel`, { method: 'POST' });
    } catch {}
    removeFight(id);
  }, [removeFight]);

  return {
    fights: Array.from(fights.values()),
    gathering,
    dismissOverlay,
    removeFight,
    startFight,
    forceTrigger,
    cancelFight,
    stopFight,
    applySolution,
  };
}
