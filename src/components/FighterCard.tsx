import type { ToolUseEvent } from '../hooks/useFightStream';

interface Stats {
  toolCalls: number;
  timeMs: number;
}

interface Scores {
  correctness: number;
  quality: number;
  completeness: number;
  style: number;
  total: number;
}

interface Props {
  name: string;
  side: 'left' | 'right';
  stats: Stats | null;
  scores: Scores | null;
  isWinner: boolean;
  isLoser: boolean;
  toolEvents: ToolUseEvent[];
}

const TOOL_ICONS: Record<string, string> = {
  Write: 'WRITE',
  Edit: 'EDIT',
  Read: 'READ',
  Bash: 'BASH',
  Glob: 'GLOB',
  Grep: 'GREP',
  Task: 'TASK',
};

const FIGHTER_TITLES = {
  left: 'THE OPTIMIZER',
  right: 'THE ARCHITECT',
};

export default function FighterCard({ name, side, stats, scores, isWinner, isLoser, toolEvents }: Props) {
  const recentTools = toolEvents.slice(-5);

  return (
    <div className={`fighter-card ${side} ${isWinner ? 'winner' : ''} ${isLoser ? 'loser' : ''}`}>
      <div className="fighter-name">{name}</div>
      <div className="fighter-title">{FIGHTER_TITLES[side]}</div>
      <div className="fighter-model">Claude Code</div>

      {recentTools.length > 0 && (
        <div className="tool-feed">
          {recentTools.map((t, i) => (
            <span key={i} className="tool-badge">
              {TOOL_ICONS[t.tool] || t.tool}
            </span>
          ))}
        </div>
      )}

      {stats && (
        <div className="fighter-stats">
          <span>{stats.toolCalls} tool calls</span>
          <span>{(stats.timeMs / 1000).toFixed(1)}s</span>
        </div>
      )}
      {scores && (
        <div className="fighter-scores">
          <div className="score-row">
            <span>Correctness</span>
            <span className="score-value">{scores.correctness}/10</span>
          </div>
          <div className="score-row">
            <span>Quality</span>
            <span className="score-value">{scores.quality}/10</span>
          </div>
          <div className="score-row">
            <span>Completeness</span>
            <span className="score-value">{scores.completeness}/10</span>
          </div>
          <div className="score-row">
            <span>Style</span>
            <span className="score-value">{scores.style}/5</span>
          </div>
          <div className="score-row total">
            <span>TOTAL</span>
            <span className="score-value">{scores.total}/35</span>
          </div>
        </div>
      )}
    </div>
  );
}
