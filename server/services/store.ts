import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { FightRecord } from '../types.js';

const DATA_DIR = join(homedir(), '.agent-arena');
const FIGHTS_FILE = join(DATA_DIR, 'fights.json');

function ensureDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function saveFight(record: FightRecord): void {
  ensureDir();
  const fights = getFights();
  fights.push(record);
  writeFileSync(FIGHTS_FILE, JSON.stringify(fights, null, 2));
}

export function getFights(): FightRecord[] {
  ensureDir();
  if (!existsSync(FIGHTS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(FIGHTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function getStats() {
  const fights = getFights();
  return {
    total: fights.length,
    knockouts: fights.filter(f => f.knockout).length,
    fighter1Wins: fights.filter(f => f.winner === 1).length,
    fighter2Wins: fights.filter(f => f.winner === 2).length,
  };
}
