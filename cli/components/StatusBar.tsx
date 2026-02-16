import React from 'react';
import { Box, Text } from 'ink';

export default function StatusBar({ seconds, phase }: { seconds: number; phase: string }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const time = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <Box justifyContent="center" gap={4} marginTop={1}>
      <Text dimColor>ROUND 1</Text>
      <Text bold>{time}</Text>
      <Text color="yellow" bold>{phase.toUpperCase()}</Text>
    </Box>
  );
}
