import { useState, useEffect, useRef } from 'react';

interface ClaudeAgent {
  name: string;
  description: string;
  status: 'running' | 'done';
  startTime: number;
  elapsed: number;
  toolUses: number;
  tokens: number;
}

export default function AgentPanel() {
  const [claudeAgents, setClaudeAgents] = useState<ClaudeAgent[]>([]);
  const [fights, setFights] = useState<any[]>([]);
  const [tab, setTab] = useState<'agents' | 'history'>('agents');
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Listen for real-time Claude agent updates from terminal
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (api?.onClaudeAgentsUpdate) {
      api.onClaudeAgentsUpdate((agents: ClaudeAgent[]) => {
        setClaudeAgents(agents);
      });
      // Initial fetch
      api.getClaudeAgents?.().then((agents: ClaudeAgent[]) => {
        if (agents) setClaudeAgents(agents);
      });
      return () => api.removeClaudeAgentsListeners?.();
    }
  }, []);

  // Also poll active fights for fight agents
  const [activeFights, setActiveFights] = useState<any[]>([]);
  useEffect(() => {
    const poll = () => {
      fetch('/api/active-fights')
        .then(r => r.json())
        .then(setActiveFights)
        .catch(() => {});
    };
    poll();
    pollRef.current = setInterval(poll, 1000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (tab === 'history') {
      fetch('/api/history').then(r => r.json()).then(setFights).catch(() => {});
    }
  }, [tab]);

  const runningCount = claudeAgents.filter(a => a.status === 'running').length;
  const fightAgentCount = activeFights.reduce((n, f) => n + f.agents.length, 0);
  const totalActive = runningCount + fightAgentCount;

  const formatElapsed = (ms: number) => {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="agent-panel">
      <div className="agent-panel-header">
        <div className="agent-panel-tabs">
          <button
            className={`agent-tab ${tab === 'agents' ? 'active' : ''}`}
            onClick={() => setTab('agents')}
          >
            AGENTS {totalActive > 0 && <span className="agent-count">{totalActive}</span>}
          </button>
          <button
            className={`agent-tab ${tab === 'history' ? 'active' : ''}`}
            onClick={() => setTab('history')}
          >
            FIGHT LOG
          </button>
        </div>
      </div>

      <div className="agent-panel-content">
        {tab === 'agents' && (
          <div className="agent-list">
            {/* Claude Code agents from terminal */}
            {claudeAgents.map((a, i) => (
              <div key={`claude-${i}`} className={`agent-row ${a.status}`}>
                <div className="agent-indicator">
                  <span className={`agent-dot ${a.status}`} />
                </div>
                <div className="agent-info">
                  <span className="agent-name">
                    <span className="agent-type-badge">{a.name}</span>
                    {a.description}
                  </span>
                  <span className="agent-task">
                    {a.toolUses > 0 && <span>{a.toolUses} tool uses</span>}
                    {a.tokens > 0 && <span> · {a.tokens >= 1000 ? `${(a.tokens / 1000).toFixed(1)}k` : a.tokens} tokens</span>}
                  </span>
                </div>
                <div className="agent-meta">
                  <span className="agent-chars">{formatElapsed(a.elapsed)}</span>
                  <span className={`agent-status-badge ${a.status}`}>
                    {a.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}

            {/* Fight agents */}
            {activeFights.map(fight => (
              <div key={fight.id} className="agent-fight-group">
                <div className="agent-fight-header">
                  <span className="agent-fight-status">{fight.status.toUpperCase()}</span>
                  <span className="agent-fight-task">{fight.task}</span>
                </div>
                {fight.agents.map((a: any, i: number) => (
                  <div key={`${fight.id}-${i}`} className={`agent-row ${a.status}`}>
                    <div className="agent-indicator">
                      <span className={`agent-dot ${a.status}`} />
                    </div>
                    <div className="agent-info">
                      <span className="agent-name">
                        <span className="agent-type-badge">Fight</span>
                        {a.name}
                      </span>
                      <span className="agent-task">{fight.task}</span>
                    </div>
                    <div className="agent-meta">
                      <span className="agent-chars">{a.chars.toLocaleString()} chars</span>
                      <span className={`agent-status-badge ${a.status}`}>
                        {a.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {claudeAgents.length === 0 && activeFights.length === 0 && (
              <div className="agent-empty">
                <span className="agent-empty-icon">&#9678;</span>
                <span>No active agents — run Claude in the terminal to see activity</span>
              </div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="agent-list">
            {fights.length === 0 ? (
              <div className="agent-empty">
                <span className="agent-empty-icon">&#9678;</span>
                <span>No fights yet</span>
              </div>
            ) : (
              fights.slice(0, 30).map((f: any) => (
                <div key={f.id} className="agent-row done">
                  <div className="agent-indicator">
                    <span className={`fight-dot ${f.knockout ? 'ko' : 'dec'}`} />
                  </div>
                  <div className="agent-info">
                    <span className="agent-name">
                      <span className={f.winner === 1 ? 'text-blue' : 'text-red'}>
                        {f.winner === 1 ? 'ALPHA' : 'OMEGA'}
                      </span>
                      {' '}wins {f.knockout ? 'by K.O.' : 'by decision'}
                    </span>
                    <span className="agent-task">{f.task}</span>
                  </div>
                  <div className="agent-meta">
                    <span className="agent-chars">
                      {f.fighter1?.scores?.total ?? '?'}-{f.fighter2?.scores?.total ?? '?'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
