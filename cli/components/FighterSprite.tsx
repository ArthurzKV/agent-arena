import React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';
import type { Sprite } from '../sprites.js';

export default function FighterSprite({ sprite, label, color }: { sprite: Sprite; label: string; color: string }) {
  const maxCols = Math.max(...sprite.map(r => r.length));

  const lines = sprite.map(row => {
    let line = '';
    for (let x = 0; x < maxCols; x++) {
      const c = row[x] || 'transparent';
      if (c === 'transparent') {
        line += ' ';
      } else {
        line += chalk.hex(c)('\u2588');
      }
    }
    return line;
  });

  return (
    <Box flexDirection="column" alignItems="center">
      <Text bold color={color}>{label}</Text>
      {lines.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
    </Box>
  );
}
