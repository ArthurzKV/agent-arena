import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { EventEmitter } from 'events';
import { runFight } from './fight.js';
import { ALPHA_FRAMES, OMEGA_FRAMES, type FrameKey } from './sprites.js';
import { getFights, getStats } from '../server/services/store.js';
import TitleBar from './components/TitleBar.js';
import FighterSprite from './components/FighterSprite.js';
import OutputPanel from './components/OutputPanel.js';
import StatusBar from './components/StatusBar.js';
import VerdictScreen from './components/VerdictScreen.js';
import type { JudgeVerdict } from '../server/types.js';

type Screen = 'home' | 'fighting' | 'history';

export default function App({ initialTask }: { initialTask?: string }) {
  const { exit } = useApp();

  // Navigation
  const [screen, setScreen] = useState<Screen>(initialTask ? 'fighting' : 'home');
  const [task, setTask] = useState(initialTask || '');
  const [inputValue, setInputValue] = useState('');

  // Fight state
  const [fightStatus, setFightStatus] = useState<'fighting' | 'judging' | 'done'>('fighting');
  const [leftOutput, setLeftOutput] = useState('');
  const [rightOutput, setRightOutput] = useState('');
  const [leftChars, setLeftChars] = useState(0);
  const [rightChars, setRightChars] = useState(0);
  const [leftDone, setLeftDone] = useState(false);
  const [rightDone, setRightDone] = useState(false);
  const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
  const [winningCode, setWinningCode] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [alphaFrame, setAlphaFrame] = useState<FrameKey>('idle');
  const [omegaFrame, setOmegaFrame] = useState<FrameKey>('idle');

  const resetFight = useCallback(() => {
    setFightStatus('fighting');
    setLeftOutput('');
    setRightOutput('');
    setLeftChars(0);
    setRightChars(0);
    setLeftDone(false);
    setRightDone(false);
    setVerdict(null);
    setWinningCode('');
    setSeconds(0);
    setAlphaFrame('idle');
    setOmegaFrame('idle');
  }, []);

  const startFight = useCallback((fightTask: string) => {
    resetFight();
    setTask(fightTask);
    setScreen('fighting');
  }, [resetFight]);

  // Global keyboard
  useInput((input, key) => {
    if (input === 'q' && screen !== 'fighting') {
      exit();
    }
    if (key.escape) {
      if (screen === 'fighting' && fightStatus === 'done') {
        setScreen('home');
        setInputValue('');
      } else if (screen === 'history') {
        setScreen('home');
      }
    }
    if (input === 'h' && screen === 'home') {
      setScreen('history');
    }
  });

  // Timer
  useEffect(() => {
    if (screen !== 'fighting' || fightStatus === 'done') return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [screen, fightStatus]);

  // Sprite animation
  useEffect(() => {
    if (screen !== 'fighting' || fightStatus !== 'fighting') return;
    const leftSeq: FrameKey[] = ['idle', 'jab', 'idle', 'block', 'idle', 'hook', 'idle', 'block'];
    const rightSeq: FrameKey[] = ['idle', 'block', 'idle', 'jab', 'idle', 'block', 'idle', 'hook'];
    let i = 0;
    const interval = setInterval(() => {
      setAlphaFrame(leftSeq[i % leftSeq.length]!);
      setOmegaFrame(rightSeq[i % rightSeq.length]!);
      i++;
    }, 400);
    return () => clearInterval(interval);
  }, [screen, fightStatus]);

  // Run fight when task changes and screen is fighting
  useEffect(() => {
    if (screen !== 'fighting' || !task) return;

    const emitter = new EventEmitter();

    emitter.on('progress', (agent: string, chars: number, text: string) => {
      if (agent === 'left') { setLeftChars(chars); setLeftOutput(text); }
      else { setRightChars(chars); setRightOutput(text); }
    });

    emitter.on('complete', (agent: string) => {
      if (agent === 'left') setLeftDone(true);
      else setRightDone(true);
    });

    emitter.on('status', (s: string) => {
      if (s === 'judging') {
        setFightStatus('judging');
        setAlphaFrame('idle');
        setOmegaFrame('idle');
      }
    });

    emitter.on('verdict', (v: JudgeVerdict) => {
      setVerdict(v);
      setFightStatus('done');
      setAlphaFrame(v.winner === 1 ? 'win' : 'lose');
      setOmegaFrame(v.winner === 2 ? 'win' : 'lose');
    });

    runFight(task, emitter).then(({ verdict: v, output1, output2 }) => {
      setWinningCode(v.winner === 1 ? output1 : output2);
    }).catch(() => {});
  }, [screen, task]);

  // === HOME SCREEN ===
  if (screen === 'home') {
    const stats = getStats();
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box justifyContent="center" flexDirection="column" alignItems="center">
          <Text bold color="red">
            {'  ___   ___  ___  _  _ _____    ___  ___ ___ _  _   ___ '}
          </Text>
          <Text bold color="red">
            {' / _ \\ / __|| __|| \\| ||_   _|  / _ \\ | _ \\| __|| \\| | / _ \\'}
          </Text>
          <Text bold color="red">
            {'| (_| || (_ || _| | .  |  | |   | (_| ||   /| _| | .  || (_| |'}
          </Text>
          <Text bold color="red">
            {' \\___/  \\___||___||_|\\_|  |_|    \\__,_||_|_\\|___||_|\\_| \\___/'}
          </Text>
          <Text dimColor>Two Claude agents enter. One wins.</Text>
        </Box>

        <Box marginTop={2} justifyContent="center">
          <Box borderStyle="round" borderColor="red" paddingX={2} paddingY={1} width={60}>
            <Text bold color="red">{'> '}</Text>
            <TextInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={(val) => {
                const trimmed = val.trim();
                if (trimmed) startFight(trimmed);
              }}
              placeholder="Enter a coding task to start a fight..."
            />
          </Box>
        </Box>

        <Box marginTop={2} justifyContent="center" gap={6}>
          <Box flexDirection="column" alignItems="center">
            <Text bold color="yellow">{stats.total}</Text>
            <Text dimColor>FIGHTS</Text>
          </Box>
          <Box flexDirection="column" alignItems="center">
            <Text bold color="red">{stats.knockouts}</Text>
            <Text dimColor>K.O.s</Text>
          </Box>
          <Box flexDirection="column" alignItems="center">
            <Text bold color="blue">{stats.fighter1Wins}</Text>
            <Text dimColor>ALPHA</Text>
          </Box>
          <Box flexDirection="column" alignItems="center">
            <Text bold color="red">{stats.fighter2Wins}</Text>
            <Text dimColor>OMEGA</Text>
          </Box>
        </Box>

        <Box marginTop={2} justifyContent="center" gap={4}>
          <Text dimColor>[Enter] Fight  [H] History  [Q] Quit</Text>
        </Box>
      </Box>
    );
  }

  // === HISTORY SCREEN ===
  if (screen === 'history') {
    const fights = getFights().reverse().slice(0, 10);
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <TitleBar status="FIGHT HISTORY" />

        {fights.length === 0 ? (
          <Box marginTop={2} justifyContent="center">
            <Text dimColor>No fights yet. Go start one!</Text>
          </Box>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            {fights.map((f, i) => (
              <Box key={f.id} gap={2} paddingY={0}>
                <Text dimColor>{String(i + 1).padStart(2)}.</Text>
                <Text color={f.knockout ? 'red' : 'yellow'} bold>
                  {f.knockout ? 'K.O.' : 'DEC '}
                </Text>
                <Text color={f.winner === 1 ? 'blue' : 'red'} bold>
                  {f.winner === 1 ? 'ALPHA' : 'OMEGA'}
                </Text>
                <Text dimColor>
                  {f.fighter1.scores.total}-{f.fighter2.scores.total}
                </Text>
                <Text>{f.task.length > 40 ? f.task.slice(0, 40) + '...' : f.task}</Text>
              </Box>
            ))}
          </Box>
        )}

        <Box marginTop={2} justifyContent="center">
          <Text dimColor>[Esc] Back  [Q] Quit</Text>
        </Box>
      </Box>
    );
  }

  // === FIGHT SCREEN ===
  const statusText = fightStatus === 'fighting' ? 'FIGHT!'
    : fightStatus === 'judging' ? 'JUDGING...'
    : 'FIGHT OVER';

  return (
    <Box flexDirection="column">
      <TitleBar status={statusText} />

      <Box marginTop={0} paddingX={2}>
        <Text dimColor>Task: </Text>
        <Text>{task}</Text>
      </Box>

      {/* Fighters */}
      <Box justifyContent="center" gap={4} marginTop={1}>
        <FighterSprite sprite={ALPHA_FRAMES[alphaFrame]} label="AGENT ALPHA" color="blue" />
        <Box alignItems="center" width={5} justifyContent="center">
          <Text bold color="red">{fightStatus === 'fighting' ? 'VS' : ''}</Text>
        </Box>
        <FighterSprite sprite={OMEGA_FRAMES[omegaFrame]} label="AGENT OMEGA" color="red" />
      </Box>

      {/* Output panels */}
      <Box marginTop={1}>
        <OutputPanel label="ALPHA" output={leftOutput} chars={leftChars} done={leftDone} color="blue" />
        <OutputPanel label="OMEGA" output={rightOutput} chars={rightChars} done={rightDone} color="red" />
      </Box>

      <StatusBar seconds={seconds} phase={fightStatus} />

      {verdict && <VerdictScreen verdict={verdict} />}

      {fightStatus === 'done' && (
        <Box justifyContent="center" marginTop={1}>
          <Text dimColor>[Esc] New Fight  [Q] Quit</Text>
        </Box>
      )}
    </Box>
  );
}
