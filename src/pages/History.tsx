import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface FightRecord {
  id: string;
  task: string;
  timestamp: string;
  winner: 1 | 2;
  reasoning: string;
  knockout: boolean;
  fighter1: { tokens: number; timeMs: number; scores: { total: number } };
  fighter2: { tokens: number; timeMs: number; scores: { total: number } };
}

export default function History() {
  const [fights, setFights] = useState<FightRecord[]>([]);

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(setFights);
  }, []);

  return (
    <div className="history-page">
      <header className="arena-header">
        <h1 className="arena-title">
          <span className="title-agent">FIGHT</span>
          <span className="title-arena">HISTORY</span>
        </h1>
        <nav className="arena-nav">
          <Link to="/" className="nav-link">BACK TO ARENA</Link>
        </nav>
      </header>

      {fights.length === 0 ? (
        <div className="no-fights">No fights yet. Go start one!</div>
      ) : (
        <div className="fight-list">
          {fights.map(fight => (
            <div key={fight.id} className="fight-record">
              <div className="fight-record-header">
                <span className="fight-id">#{fight.id}</span>
                <span className={`fight-result ${fight.knockout ? 'ko' : 'decision'}`}>
                  {fight.knockout ? 'K.O.' : 'DECISION'}
                </span>
                <span className="fight-date">
                  {new Date(fight.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="fight-task">{fight.task}</div>
              <div className="fight-scores">
                <span className={fight.winner === 1 ? 'winner-score' : 'loser-score'}>
                  ALPHA {fight.fighter1.scores.total}
                </span>
                <span className="score-dash">—</span>
                <span className={fight.winner === 2 ? 'winner-score' : 'loser-score'}>
                  {fight.fighter2.scores.total} OMEGA
                </span>
              </div>
              <div className="fight-reasoning">{fight.reasoning}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
