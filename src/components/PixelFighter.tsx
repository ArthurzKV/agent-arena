import { useEffect, useState } from 'react';

interface Props {
  side: 'left' | 'right';
  isActive: boolean;
  isDone: boolean;
  isWinner: boolean;
  isLoser: boolean;
  chars: number;
}

// Color palette
const _ = 'transparent';
const K = '#1a1a2e'; // outline/dark
const S = '#f5c6a0'; // skin
const D = '#d4956b'; // skin shadow
const H = '#2c1810'; // hair
const W = '#ffffff'; // white (eyes)
const E = '#111111'; // eye pupil
const M = '#c44040'; // mouth
const T = '#333333'; // shorts dark
const B = '#222222'; // boots

// Fighter 1 colors (ALPHA - blue)
const B1 = '#3498db'; // gloves blue
const B2 = '#2176ab'; // gloves shadow
const S1 = '#3498db'; // shorts
const S2 = '#2176ab'; // shorts shadow

// Fighter 2 colors (OMEGA - red)
const R1 = '#e63946'; // gloves red
const R2 = '#b22d37'; // gloves shadow
const X1 = '#e63946'; // shorts
const X2 = '#b22d37'; // shorts shadow

type Sprite = string[][];

// ===== ALPHA (left fighter, facing right) =====

const ALPHA_IDLE: Sprite = [
  [_,_,_,K,K,K,K,_,_,_,_,_],
  [_,_,K,H,H,H,H,K,_,_,_,_],
  [_,_,K,H,H,H,H,K,_,_,_,_],
  [_,K,S,S,S,S,S,S,K,_,_,_],
  [_,K,S,W,E,S,W,E,K,_,_,_],
  [_,K,S,S,S,S,S,S,K,_,_,_],
  [_,_,K,S,D,D,S,K,_,_,_,_],
  [_,_,K,S,M,M,S,K,_,_,_,_],
  [_,_,_,K,K,K,K,_,_,_,_,_],
  [_,_,_,K,S,S,K,_,_,_,_,_],
  [_,B1,B1,K,S,S,K,_,_,_,_,_],
  [B1,B1,B1,K,S,S,S,K,_,_,_,_],
  [B1,B2,B1,K,S1,S1,S1,S1,K,_,_,_],
  [_,B1,B1,K,S1,S2,S2,S1,K,_,_,_],
  [_,_,_,K,S1,S1,S1,S1,K,_,_,_],
  [_,_,_,K,S1,S1,S1,S1,K,_,_,_],
  [_,_,_,K,S,K,K,S,K,_,_,_],
  [_,_,_,K,S,K,K,S,K,_,_,_],
  [_,_,K,S,S,K,K,S,S,K,_,_],
  [_,_,K,B,B,K,K,B,B,K,_,_],
];

const ALPHA_JAB: Sprite = [
  [_,_,_,K,K,K,K,_,_,_,_,_,_,_],
  [_,_,K,H,H,H,H,K,_,_,_,_,_,_],
  [_,_,K,H,H,H,H,K,_,_,_,_,_,_],
  [_,K,S,S,S,S,S,S,K,_,_,_,_,_],
  [_,K,S,W,E,S,W,E,K,_,_,_,_,_],
  [_,K,S,S,S,S,S,S,K,_,_,_,_,_],
  [_,_,K,S,D,D,S,K,_,_,_,_,_,_],
  [_,_,K,S,M,M,S,K,_,_,_,_,_,_],
  [_,_,_,K,K,K,K,_,_,_,_,_,_,_],
  [_,_,_,K,S,S,K,K,K,K,K,K,_,_],
  [_,B1,B1,K,S,S,S,S,S,S,B1,B1,B1,_],
  [B1,B1,B1,K,S,S,K,_,_,B1,B1,B1,B2,_],
  [B1,B2,B1,K,S1,S1,S1,S1,K,_,_,_,_,_],
  [_,B1,_,K,S1,S2,S2,S1,K,_,_,_,_,_],
  [_,_,_,K,S1,S1,S1,S1,K,_,_,_,_,_],
  [_,_,_,K,S1,S1,S1,S1,K,_,_,_,_,_],
  [_,_,_,K,S,K,K,S,K,_,_,_,_,_],
  [_,_,_,K,S,K,K,S,K,_,_,_,_,_],
  [_,_,K,S,S,K,K,S,S,K,_,_,_,_],
  [_,_,K,B,B,K,K,B,B,K,_,_,_,_],
];

const ALPHA_HOOK: Sprite = [
  [_,_,_,K,K,K,K,_,_,_,_,_],
  [_,_,K,H,H,H,H,K,_,_,_,_],
  [_,_,K,H,H,H,H,K,_,_,_,_],
  [_,K,S,S,S,S,S,S,K,_,_,_],
  [_,K,S,W,E,S,W,E,K,_,_,_],
  [_,K,S,S,S,S,S,S,K,_,_,_],
  [_,_,K,S,D,D,S,K,_,_,_,_],
  [_,_,K,S,M,M,S,K,_,_,_,_],
  [_,_,_,K,K,K,K,_,B1,B1,_,_],
  [_,_,_,K,S,S,K,B1,B1,B1,_,_],
  [_,B1,B1,K,S,S,K,B1,B2,B1,_,_],
  [B1,B1,B1,K,S,S,S,K,_,_,_,_],
  [B1,B2,B1,K,S1,S1,S1,S1,K,_,_,_],
  [_,B1,_,K,S1,S2,S2,S1,K,_,_,_],
  [_,_,_,K,S1,S1,S1,S1,K,_,_,_],
  [_,_,_,K,S1,S1,S1,S1,K,_,_,_],
  [_,_,_,K,S,K,K,S,K,_,_,_],
  [_,_,K,S,S,K,_,K,S,K,_,_],
  [_,_,K,S,S,K,K,S,S,K,_,_],
  [_,_,K,B,B,K,K,B,B,K,_,_],
];

const ALPHA_BLOCK: Sprite = [
  [_,_,_,K,K,K,K,_,_,_,_,_],
  [_,_,K,H,H,H,H,K,_,_,_,_],
  [_,_,K,H,H,H,H,K,_,_,_,_],
  [_,K,S,S,S,S,S,S,K,_,_,_],
  [B1,K,S,W,E,S,W,E,K,B1,_,_],
  [B1,K,S,S,S,S,S,S,K,B1,_,_],
  [B1,B1,K,S,D,D,S,K,B1,B1,_,_],
  [B1,B2,K,S,S,S,S,K,B2,B1,_,_],
  [_,_,_,K,K,K,K,_,_,_,_,_],
  [_,_,_,K,S,S,S,K,_,_,_,_],
  [_,_,_,K,S,S,S,K,_,_,_,_],
  [_,_,_,K,S,S,S,K,_,_,_,_],
  [_,_,_,K,S1,S1,S1,S1,K,_,_,_],
  [_,_,_,K,S1,S2,S2,S1,K,_,_,_],
  [_,_,_,K,S1,S1,S1,S1,K,_,_,_],
  [_,_,_,K,S1,S1,S1,S1,K,_,_,_],
  [_,_,_,K,S,K,K,S,K,_,_,_],
  [_,_,_,K,S,K,K,S,K,_,_,_],
  [_,_,K,S,S,K,K,S,S,K,_,_],
  [_,_,K,B,B,K,K,B,B,K,_,_],
];

const ALPHA_WIN: Sprite = [
  [_,B1,B1,_,_,_,_,_,B1,B1,_,_],
  [B1,B1,B1,K,K,K,K,B1,B1,B1,_,_],
  [B1,B2,B1,H,H,H,H,B1,B2,B1,_,_],
  [_,K,K,H,H,H,H,K,K,_,_,_],
  [_,K,S,S,S,S,S,S,K,_,_,_],
  [_,K,S,W,E,S,W,E,K,_,_,_],
  [_,_,K,S,S,S,S,K,_,_,_,_],
  [_,_,K,S,S,S,S,K,_,_,_,_],
  [_,_,_,K,K,K,K,_,_,_,_,_],
  [_,_,_,K,S,S,K,_,_,_,_,_],
  [_,_,_,K,S,S,S,K,_,_,_,_],
  [_,_,_,K,S,S,S,K,_,_,_,_],
  [_,_,_,K,S1,S1,S1,S1,K,_,_,_],
  [_,_,_,K,S1,S2,S2,S1,K,_,_,_],
  [_,_,_,K,S1,S1,S1,S1,K,_,_,_],
  [_,_,_,K,S1,S1,S1,S1,K,_,_,_],
  [_,_,_,K,S,K,K,S,K,_,_,_],
  [_,_,K,S,S,K,_,K,S,K,_,_],
  [_,K,S,S,K,_,_,K,S,S,K,_],
  [_,K,B,B,K,_,_,K,B,B,K,_],
];

const ALPHA_LOSE: Sprite = [
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [B1,B1,_,_,_,_,_,_,_,_,B1,B1,_,_],
  [B1,B2,K,K,K,K,_,_,_,_,B1,B2,_,_],
  [_,K,S,S,S,S,K,K,K,K,K,_,_,_],
  [_,K,S,E,S,S,E,S,S1,S1,S1,K,K,_],
  [_,K,S,S,M,S,S,D,S1,S2,S1,S,K,K],
  [_,_,K,K,K,K,K,K,K,K,K,K,K,K],
];

// ===== OMEGA (right fighter, facing left) — uses red palette =====

function mirrorSprite(sprite: Sprite): Sprite {
  return sprite.map(row => [...row].reverse());
}

function recolorSprite(sprite: Sprite): Sprite {
  return sprite.map(row =>
    row.map(c => {
      if (c === B1) return R1;
      if (c === B2) return R2;
      if (c === S1) return X1;
      if (c === S2) return X2;
      return c;
    })
  );
}

const OMEGA_IDLE = mirrorSprite(recolorSprite(ALPHA_IDLE));
const OMEGA_JAB = mirrorSprite(recolorSprite(ALPHA_JAB));
const OMEGA_HOOK = mirrorSprite(recolorSprite(ALPHA_HOOK));
const OMEGA_BLOCK = mirrorSprite(recolorSprite(ALPHA_BLOCK));
const OMEGA_WIN = mirrorSprite(recolorSprite(ALPHA_WIN));
const OMEGA_LOSE = mirrorSprite(recolorSprite(ALPHA_LOSE));

const ALPHA_FRAMES = {
  idle: ALPHA_IDLE,
  jab: ALPHA_JAB,
  hook: ALPHA_HOOK,
  block: ALPHA_BLOCK,
  win: ALPHA_WIN,
  lose: ALPHA_LOSE,
};

const OMEGA_FRAMES = {
  idle: OMEGA_IDLE,
  jab: OMEGA_JAB,
  hook: OMEGA_HOOK,
  block: OMEGA_BLOCK,
  win: OMEGA_WIN,
  lose: OMEGA_LOSE,
};

type FrameKey = keyof typeof ALPHA_FRAMES;

function SpriteRenderer({ sprite, glow }: { sprite: Sprite; glow?: string }) {
  const cols = Math.max(...sprite.map(r => r.length));
  return (
    <div
      className="sprite-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 6px)`,
        gridAutoRows: '6px',
        filter: glow ? `drop-shadow(0 0 8px ${glow})` : undefined,
      }}
    >
      {sprite.flatMap((row, y) =>
        Array.from({ length: cols }, (__, x) => {
          const color = row[x] || 'transparent';
          return (
            <div
              key={`${y}-${x}`}
              style={{
                backgroundColor: color,
                width: '6px',
                height: '6px',
              }}
            />
          );
        })
      )}
    </div>
  );
}

export default function PixelFighter({ side, isActive, isDone, isWinner, isLoser, chars }: Props) {
  const [frame, setFrame] = useState<FrameKey>('idle');
  const [showImpact, setShowImpact] = useState(false);
  const [gotHit, setGotHit] = useState(false);
  const [recoil, setRecoil] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    // Sequences synced: when one punches, the other blocks and gets hit
    const leftSequence: FrameKey[] = ['idle', 'jab', 'idle', 'block', 'idle', 'hook', 'idle', 'block'];
    const rightSequence: FrameKey[] = ['idle', 'block', 'idle', 'jab', 'idle', 'block', 'idle', 'hook'];
    const sequence = side === 'left' ? leftSequence : rightSequence;
    let i = 0;

    const interval = setInterval(() => {
      const next = sequence[i % sequence.length];
      setFrame(next);

      if (next === 'jab' || next === 'hook') {
        // This fighter is punching — show impact spark
        setShowImpact(true);
        setTimeout(() => setShowImpact(false), 300);
      }

      if (next === 'block') {
        // This fighter is receiving a hit — show hit reaction
        setGotHit(true);
        setRecoil(true);
        setTimeout(() => setGotHit(false), 200);
        setTimeout(() => setRecoil(false), 250);
      }

      i++;
    }, 400);

    return () => clearInterval(interval);
  }, [isActive, side]);

  useEffect(() => {
    if (isWinner) setFrame('win');
    if (isLoser) setFrame('lose');
    if (!isActive && !isWinner && !isLoser) setFrame('idle');
  }, [isWinner, isLoser, isActive]);

  const frames = side === 'left' ? ALPHA_FRAMES : OMEGA_FRAMES;
  const sprite = frames[frame];
  const glowColor = side === 'left' ? '#3498db' : '#e63946';

  // Fighters overlap slightly during fight for collision effect
  const baseTranslate = isActive
    ? side === 'left' ? 20 : -20
    : 0;
  // Recoil pushes fighter back when hit
  const recoilOffset = recoil
    ? side === 'left' ? -10 : 10
    : 0;
  const totalTranslate = baseTranslate + recoilOffset;

  return (
    <div
      className={`pixel-fighter ${side} ${isWinner ? 'winner' : ''} ${isLoser ? 'loser' : ''} ${gotHit ? 'got-hit' : ''} ${isActive ? 'fighting' : ''}`}
      style={{ transform: `translateX(${totalTranslate}px)`, transition: recoil ? 'transform 0.1s ease-out' : 'transform 0.8s ease-out' }}
    >
      <SpriteRenderer sprite={sprite} glow={isActive ? glowColor : undefined} />
      {gotHit && (
        <div className="hit-flash" />
      )}
      {showImpact && (
        <div className={`impact-flash ${side}`} />
      )}
      {isActive && (
        <div className="char-counter">{chars.toLocaleString()} chars</div>
      )}
      {isDone && !isWinner && !isLoser && isActive && (
        <div className="done-badge">DONE</div>
      )}
    </div>
  );
}
