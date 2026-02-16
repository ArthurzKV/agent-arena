import React from 'react';
import { Box, Text } from 'ink';
import type { JudgeVerdict } from '../../server/types.js';

export default function VerdictScreen({ verdict }: { verdict: JudgeVerdict }) {
  const winnerName = verdict.winner === 1 ? 'AGENT ALPHA' : 'AGENT OMEGA';
  const winColor = verdict.winner === 1 ? 'blue' : 'red';

  const categories = [
    { key: 'correctness' as const, max: 10 },
    { key: 'quality' as const, max: 10 },
    { key: 'completeness' as const, max: 10 },
    { key: 'style' as const, max: 5 },
  ];

  return (
    <Box flexDirection="column" alignItems="center" marginTop={1}>
      <Text bold color="yellow">
        {verdict.knockout ? '*** K.O. ***' : '=== DECISION ==='}
      </Text>
      <Text bold color={winColor}>{winnerName} WINS!</Text>

      <Box flexDirection="column" marginTop={1} borderStyle="single" paddingX={2} width={50}>
        <Box justifyContent="space-between">
          <Text bold color="blue">ALPHA</Text>
          <Text bold dimColor>CATEGORY</Text>
          <Text bold color="red">OMEGA</Text>
        </Box>
        {categories.map(({ key, max }) => (
          <Box key={key} justifyContent="space-between">
            <Text>{verdict.fighter1[key]}/{max}</Text>
            <Text dimColor>{key.toUpperCase()}</Text>
            <Text>{verdict.fighter2[key]}/{max}</Text>
          </Box>
        ))}
        <Box justifyContent="space-between" marginTop={1}>
          <Text bold color={verdict.winner === 1 ? 'yellow' : undefined}>
            {verdict.fighter1.total}/35
          </Text>
          <Text bold>TOTAL</Text>
          <Text bold color={verdict.winner === 2 ? 'yellow' : undefined}>
            {verdict.fighter2.total}/35
          </Text>
        </Box>
      </Box>

      <Box marginTop={1} width={50}>
        <Text dimColor italic wrap="wrap">{verdict.reasoning}</Text>
      </Box>
    </Box>
  );
}
