// Sprite data extracted from src/components/PixelFighter.tsx
// Pure data — no React dependency

export const _ = 'transparent';
export const K = '#1a1a2e';
export const S = '#f5c6a0';
export const D = '#d4956b';
export const H = '#2c1810';
export const W = '#ffffff';
export const E = '#111111';
export const M = '#c44040';
export const B = '#222222';

// ALPHA (blue)
const B1 = '#3498db';
const B2 = '#2176ab';
const S1 = '#3498db';
const S2 = '#2176ab';

// OMEGA (red)
const R1 = '#e63946';
const R2 = '#b22d37';
const X1 = '#e63946';
const X2 = '#b22d37';

export type Sprite = string[][];

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

// ===== OMEGA (right fighter, facing left) — red palette =====

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

export const ALPHA_FRAMES = {
  idle: ALPHA_IDLE,
  jab: ALPHA_JAB,
  hook: ALPHA_HOOK,
  block: ALPHA_BLOCK,
  win: ALPHA_WIN,
  lose: ALPHA_LOSE,
};

export const OMEGA_FRAMES = {
  idle: OMEGA_IDLE,
  jab: OMEGA_JAB,
  hook: OMEGA_HOOK,
  block: OMEGA_BLOCK,
  win: OMEGA_WIN,
  lose: OMEGA_LOSE,
};

export type FrameKey = keyof typeof ALPHA_FRAMES;

// Pad all sprites to max width so animations don't jump
function normalizeSprite(sprite: Sprite, maxCols: number): Sprite {
  return sprite.map(row => {
    const padded = [...row];
    while (padded.length < maxCols) padded.push(_);
    return padded;
  });
}

const ALL_SPRITES = [
  ...Object.values(ALPHA_FRAMES),
  ...Object.values(OMEGA_FRAMES),
];
const MAX_COLS = Math.max(...ALL_SPRITES.flatMap(s => s.map(r => r.length)));

// Normalize all frames in-place
for (const frames of [ALPHA_FRAMES, OMEGA_FRAMES]) {
  for (const key of Object.keys(frames) as FrameKey[]) {
    (frames as Record<FrameKey, Sprite>)[key] = normalizeSprite(frames[key], MAX_COLS);
  }
}
