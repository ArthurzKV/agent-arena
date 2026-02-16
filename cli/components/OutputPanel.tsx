import React from 'react';
import { Box, Text } from 'ink';

interface Props {
  label: string;
  output: string;
  chars: number;
  done: boolean;
  color: string;
}

export default function OutputPanel({ label, output, chars, done, color }: Props) {
  const lines = output.split('\n');
  const visible = lines.slice(-12).join('\n');

  return (
    <Box flexDirection="column" width="50%" borderStyle="single" borderColor={color}>
      <Box justifyContent="space-between" paddingX={1}>
        <Text bold color={color}>{label}</Text>
        <Text dimColor>{chars.toLocaleString()} chars{done ? ' (DONE)' : ''}</Text>
      </Box>
      <Box paddingX={1} height={12}>
        <Text wrap="truncate-end">{visible || 'Waiting for output...'}</Text>
      </Box>
    </Box>
  );
}
