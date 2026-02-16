import { useRef, useEffect } from 'react';
import { useMultiFight, type FightState, type GatheringState } from '../hooks/useMultiFight';
import Octagon from '../components/Octagon';
import PixelFighter from '../components/PixelFighter';
import KOAnimation from '../components/KOAnimation';
import JudgeVerdict from '../components/JudgeVerdict';
import FightTimer from '../components/FightTimer';

function OutputPanel({ output, label, side }: { output: string; label: string; side: 'left' | 'right' }) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className={`output-panel ${side}`}>
      <div className="output-panel-header">
        <span className="output-panel-label">{label}</span>
        <span className="output-panel-chars">{output.length.toLocaleString()} chars</span>
      </div>
      <pre ref={ref} className="output-panel-code">
        {output || 'Waiting for output...'}
      </pre>
    </div>
  );
}

function GatheringIndicator({ state, onForce, onCancel }: { state: GatheringState; onForce: () => void; onCancel: () => void }) {
  const skipped = (state as any).skipped;

  if (skipped) {
    return (
      <div className="gathering-indicator skipped">
        <div className="gathering-info">
          <div className="gathering-title" style={{ color: 'var(--text-dim)' }}>FIGHT SKIPPED</div>
          <div className="gathering-task">{state.task}</div>
          <div className="gathering-hint">{skipped}</div>
        </div>
      </div>
    );
  }

  const secs = Math.floor(state.elapsed / 1000);
  const kb = (state.contextLength / 1024).toFixed(1);

  return (
    <div className="gathering-indicator">
      <div className="gathering-pulse" />
      <div className="gathering-info">
        <div className="gathering-title">GATHERING CONTEXT</div>
        <div className="gathering-task">{state.task}</div>
        <div className="gathering-stats">
          {kb}KB collected &middot; {secs}s
        </div>
        <div className="gathering-hint">
          Watching Claude explore... fight starts when exploration ends
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="gathering-force-btn" onClick={onForce}>
            FIGHT NOW
          </button>
          <button className="gathering-cancel-btn" onClick={onCancel}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

function FightRing({ fight, onDismiss, onRemove, onStop, onApply }: { fight: FightState; onDismiss: () => void; onRemove: () => void; onStop: () => void; onApply: (output: string, task: string) => void }) {
  const isFighting = fight.status === 'fighting' || fight.status === 'judging';
  const isVerdict = fight.status === 'verdict';
  const isCancelled = fight.status === 'cancelled';

  return (
    <div className="fight-ring">
      <div className="ring-task-label">
        {fight.task}
        {isFighting && (
          <button className="stop-fight-btn" onClick={onStop}>STOP FIGHT</button>
        )}
      </div>

      <FightTimer isRunning={isFighting} />

      {fight.status === 'judging' && (
        <div className="judging-indicator">
          <span className="judging-text">JUDGE IS REVIEWING...</span>
        </div>
      )}

      <Octagon isActive={isFighting}>
        <div className="ring-floor">
          <div className="fighter-side left">
            <div className="fighter-label">AGENT ALPHA</div>
            <div className="fighter-subtitle">THE OPTIMIZER</div>
            <PixelFighter
              side="left"
              isActive={isFighting}
              isDone={fight.leftDone}
              isWinner={isVerdict && fight.verdict?.winner === 1}
              isLoser={isVerdict && fight.verdict?.winner === 2}
              chars={fight.leftChars}
            />
            {fight.leftStats && (
              <div className="fighter-stats-bottom">
                <span>{(fight.leftStats.timeMs / 1000).toFixed(1)}s</span>
                <span>{fight.leftStats.outputLength.toLocaleString()} chars</span>
              </div>
            )}
            {isVerdict && fight.verdict && (
              <div className="fighter-score-total">
                <span className={fight.verdict.winner === 1 ? 'score-gold' : 'score-dim'}>
                  {fight.verdict.fighter1.total}/35
                </span>
              </div>
            )}
          </div>

          <div className="vs-center">
            <span className="vs-text">{isFighting ? '⚔️' : isVerdict ? '' : 'VS'}</span>
          </div>

          <div className="fighter-side right">
            <div className="fighter-label">AGENT OMEGA</div>
            <div className="fighter-subtitle">THE ARCHITECT</div>
            <PixelFighter
              side="right"
              isActive={isFighting}
              isDone={fight.rightDone}
              isWinner={isVerdict && fight.verdict?.winner === 2}
              isLoser={isVerdict && fight.verdict?.winner === 1}
              chars={fight.rightChars}
            />
            {fight.rightStats && (
              <div className="fighter-stats-bottom">
                <span>{(fight.rightStats.timeMs / 1000).toFixed(1)}s</span>
                <span>{fight.rightStats.outputLength.toLocaleString()} chars</span>
              </div>
            )}
            {isVerdict && fight.verdict && (
              <div className="fighter-score-total">
                <span className={fight.verdict.winner === 2 ? 'score-gold' : 'score-dim'}>
                  {fight.verdict.fighter2.total}/35
                </span>
              </div>
            )}
          </div>
        </div>
      </Octagon>

      {(isFighting || isVerdict) && (
        <div className="output-panels">
          <OutputPanel output={fight.leftOutput} label="AGENT ALPHA" side="left" />
          <OutputPanel output={fight.rightOutput} label="AGENT OMEGA" side="right" />
        </div>
      )}

      <KOAnimation
        show={isVerdict && !!fight.verdict && fight.showOverlay}
        knockout={fight.verdict?.knockout ?? false}
        winner={fight.verdict?.winner ?? 1}
        reasoning={fight.verdict?.reasoning ?? ''}
        onDismiss={onDismiss}
      />

      {isVerdict && fight.verdict && (
        <>
          <JudgeVerdict
            show={true}
            fighter1={fight.verdict.fighter1}
            fighter2={fight.verdict.fighter2}
          />
          <div className="verdict-actions">
            <button className="apply-winner-btn" onClick={() => {
              const winnerOutput = fight.verdict!.winner === 1 ? fight.leftOutput : fight.rightOutput;
              onApply(winnerOutput, fight.task);
            }}>
              APPLY WINNER
            </button>
            <button className="new-fight-btn" onClick={onRemove}>
              DISMISS
            </button>
          </div>
        </>
      )}

      {isCancelled && (
        <div className="verdict-actions">
          <div className="fight-cancelled-label">FIGHT CANCELLED</div>
          <button className="new-fight-btn" onClick={onRemove}>
            DISMISS
          </button>
        </div>
      )}
    </div>
  );
}

export default function Arena() {
  const { fights, gathering, dismissOverlay, removeFight, stopFight, forceTrigger, cancelFight, applySolution } = useMultiFight();

  const isIdle = fights.length === 0 && !gathering;

  return (
    <div className="arena">
      <header className="arena-header compact">
        <h1 className="arena-title-inline">
          <span className="title-agent">AGENT</span>
          <span className="title-arena">ARENA</span>
        </h1>
      </header>

      {isIdle && (
        <div className="arena-idle">
          <div className="arena-idle-icon">⚔️</div>
          <div className="arena-idle-text">WAITING FOR FIGHTS</div>
          <div className="arena-idle-hint">
            Run <code>arena-fight "task"</code> in the terminal to start a fight
          </div>
        </div>
      )}

      {gathering && (
        <GatheringIndicator state={gathering} onForce={forceTrigger} onCancel={cancelFight} />
      )}

      {fights.map(fight => (
        <FightRing
          key={fight.id}
          fight={fight}
          onDismiss={() => dismissOverlay(fight.id)}
          onRemove={() => removeFight(fight.id)}
          onStop={() => stopFight(fight.id)}
          onApply={applySolution}
        />
      ))}
    </div>
  );
}
