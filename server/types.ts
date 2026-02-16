export interface FighterScores {
  correctness: number;
  quality: number;
  completeness: number;
  style: number;
  total: number;
}

export interface JudgeVerdict {
  winner: 1 | 2;
  fighter1: FighterScores;
  fighter2: FighterScores;
  reasoning: string;
  knockout: boolean;
}

export interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
}

export interface FighterResult {
  output: string;
  toolCalls: ToolCall[];
  timeMs: number;
}

export interface Fight {
  id: string;
  task: string;
  context?: string;
  model?: string;
  status: 'waiting' | 'gathering' | 'fighting' | 'judging' | 'done' | 'cancelled';
  fighter1: FighterResult | null;
  fighter2: FighterResult | null;
  verdict: JudgeVerdict | null;
  timestamp: string;
  listeners: Set<(event: string, data: unknown) => void>;
}

export interface FightRecord {
  id: string;
  task: string;
  timestamp: string;
  winner: 1 | 2;
  fighter1: FighterResult & { scores: FighterScores };
  fighter2: FighterResult & { scores: FighterScores };
  reasoning: string;
  knockout: boolean;
}
