import { useState, useCallback } from 'react';

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

export type FightStatus = 'idle' | 'fighting' | 'judging' | 'verdict';

export function useFightStream() {
  const [status, setStatus] = useState<FightStatus>('idle');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [leftStats, setLeftStats] = useState<FighterStats | null>(null);
  const [rightStats, setRightStats] = useState<FighterStats | null>(null);
  const [leftChars, setLeftChars] = useState(0);
  const [rightChars, setRightChars] = useState(0);
  const [leftOutput, setLeftOutput] = useState('');
  const [rightOutput, setRightOutput] = useState('');
  const [leftDone, setLeftDone] = useState(false);
  const [rightDone, setRightDone] = useState(false);

  const startFight = useCallback(async (task: string) => {
    setVerdict(null);
    setLeftStats(null);
    setRightStats(null);
    setLeftChars(0);
    setRightChars(0);
    setLeftOutput('');
    setRightOutput('');
    setLeftDone(false);
    setRightDone(false);
    setStatus('fighting');

    const res = await fetch('/api/fight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    });
    const { fightId } = await res.json();

    const eventSource = new EventSource(`/api/fight/${fightId}/stream`);

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);

      switch (data.event) {
        case 'progress':
          if (data.agent === 'left') {
            setLeftChars(data.chars);
            if (data.output) setLeftOutput(data.output);
          } else {
            setRightChars(data.chars);
            if (data.output) setRightOutput(data.output);
          }
          break;
        case 'complete':
          if (data.agent === 'left') {
            setLeftDone(true);
            if (data.output) setLeftOutput(data.output);
          } else {
            setRightDone(true);
            if (data.output) setRightOutput(data.output);
          }
          break;
        case 'status':
          if (data.status === 'judging') setStatus('judging');
          break;
        case 'verdict':
          setVerdict(data.verdict);
          setLeftStats({ timeMs: data.fighter1.timeMs, outputLength: data.fighter1.outputLength });
          setRightStats({ timeMs: data.fighter2.timeMs, outputLength: data.fighter2.outputLength });
          setStatus('verdict');
          eventSource.close();
          break;
        case 'error':
          console.error('Fight error:', data.message);
          break;
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setVerdict(null);
    setLeftStats(null);
    setRightStats(null);
    setLeftChars(0);
    setRightChars(0);
    setLeftOutput('');
    setRightOutput('');
    setLeftDone(false);
    setRightDone(false);
  }, []);

  return {
    status,
    verdict,
    leftStats,
    rightStats,
    leftChars,
    rightChars,
    leftOutput,
    rightOutput,
    leftDone,
    rightDone,
    startFight,
    reset,
  };
}
